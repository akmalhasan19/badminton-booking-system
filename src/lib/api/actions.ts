'use server'

import { getCourts } from './courts'
import { getAvailableSlots, createBooking as createBookingApi } from './bookings'
import { revalidatePath } from 'next/cache'
import { smashApi, SmashVenueDetails, SmashAvailabilityResponse } from '@/lib/smash-api'
import { getCurrentUser } from '@/lib/auth/actions'
import { createInvoice, getInvoice } from '@/lib/xendit/client'




/**
 * Server action to fetch courts (Local DB)
 * @deprecated Use fetchVenues for external API
 */
export async function fetchCourts() {
    const courts = await getCourts({ isActive: true })
    return courts
}

/**
 * Server action to fetch venues from Smash API
 */
export async function fetchVenues() {
    const venues = await smashApi.getVenues()
    return venues
}

/**
 * Server action to fetch venue details (with courts) from Smash API
 * Use this when user selects a venue to get court list
 */
export async function fetchVenueDetails(venueId: string): Promise<SmashVenueDetails | null> {
    return await smashApi.getVenueDetails(venueId)
}

/**
 * Server action to fetch availability for a venue on specific date
 * Returns complete slot availability per court
 */
export async function fetchAvailableSlots(venueId: string, date: string): Promise<SmashAvailabilityResponse | null> {
    return await smashApi.checkAvailability(venueId, date)
}

/**
 * Server action to create a booking
 * Dual-Write: Smash API (Master) -> Supabase (Replica/History)
 */
export async function createBooking(data: {
    courtId: string // Venue ID
    courtUuid: string // Specific Court UUID
    bookingDate: string
    startTime: string
    endTime: string
    durationHours: number
    notes?: string
}) {
    // Get current user for booking details
    const user = await getCurrentUser()

    // Enforce authentication
    if (!user) {
        return { success: false, error: 'Unauthorized: Harap login terlebih dahulu untuk melakukan booking.' }
    }

    const customerName = user.name
    const customerPhone = user.phone || ""

    const smashBooking = {
        venue_id: data.courtId,
        court_id: data.courtUuid,
        booking_date: data.bookingDate,
        start_time: data.startTime,
        duration: data.durationHours,
        customer_name: customerName,
        phone: customerPhone
    }

    // Call Smash API
    const apiResult = await smashApi.createBooking(smashBooking)

    if (apiResult.error || !apiResult.data?.id) {
        return { success: false, error: apiResult.error || 'Failed to create booking' }
    }

    const bookingId = apiResult.data.id

    // 2. Calculate Price for Payment
    // We need to fetch venue details again to get the accurate price
    // Optimization: We could pass price from frontend but that is insecure.
    const venueDetails = await smashApi.getVenueDetails(data.courtId)
    const selectedCourt = venueDetails?.courts.find(c => c.id === data.courtUuid)
    const hourlyRate = selectedCourt?.hourly_rate || 50000
    const courtPrice = hourlyRate * data.durationHours

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smash-web.vercel.app'

    // 3. Create Xendit Invoice (Platform Account Only)

    try {
        console.log('[CreateBooking] Preparing to create Xendit Invoice...')
        console.log('[CreateBooking] Params:', {
            externalId: bookingId,
            courtPrice: courtPrice,
            payerEmail: user.email,
            description: `Booking ${venueDetails?.name || 'Court'} - ${selectedCourt?.name || 'Badminton'}`,
        })

        const invoice = await createInvoice({
            externalId: bookingId,
            amount: courtPrice,
            payerEmail: user.email,
            description: `Booking ${venueDetails?.name || 'Court'} - ${selectedCourt?.name || 'Badminton'}`,
            successRedirectUrl: `${appUrl}/bookings/history?payment=success&booking_id=${bookingId}`,
            failureRedirectUrl: `${appUrl}/?status=failed`,
        })

        console.log('[CreateBooking] Invoice created in Platform Account:', invoice.id)

        // 4. Save to Local Database (Dual Write)
        const { createServiceClient } = await import('@/lib/supabase/server')
        const supabase = createServiceClient()

        // 4a. Sync Court to Local DB if not exists (for FK constraint)
        const { data: existingCourt } = await supabase
            .from('courts')
            .select('id')
            .eq('id', data.courtUuid)
            .single()

        if (!existingCourt) {
            // Court not in local DB, sync from PWA API data
            const courtDetails = venueDetails?.courts.find(c => c.id === data.courtUuid)
            const { error: courtInsertError } = await supabase.from('courts').insert({
                id: data.courtUuid,
                name: courtDetails?.name || 'Court',
                description: `${venueDetails?.name || 'Venue'} - Synced from PWA`,
                is_active: true
            })
            if (courtInsertError) {
                console.error('Failed to sync court to local DB:', courtInsertError)
            }
        }

        // 4b. Insert or Update Booking (Handle Duplicates)
        const { data: existingBooking } = await supabase
            .from('bookings')
            .select('id, user_id, status')
            .eq('court_id', data.courtUuid)
            .eq('booking_date', data.bookingDate)
            .eq('start_time', data.startTime)
            .single()

        if (existingBooking) {
            // Case 1: Slot taken by same user (Pending/Failed) -> UPDATE it
            if (existingBooking.user_id === user.id && existingBooking.status === 'pending') {
                console.log(`[CreateBooking] Updating existing pending booking ${existingBooking.id} with new invoice`)
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update({
                        id: bookingId, // Update ID to match new invoice ID (if we want to sync them) OR keep old ID and just update invoice ref
                        // Actually, for Xendit callback to work, the External ID must match the Booking ID in DB.
                        // Since we already created Invoice with `bookingId` (from Smash API), we should probably delete the old local pending booking 
                        // and insert the new one to keep IDs consistent with Smash API.
                        // OR better: Just update the existing record's ID to the new Smash API ID? (ID might be PK, so risky).

                        // SAFER APPROACH: Delete the old local pending booking, then Insert the new one.
                    })
                    .eq('id', existingBooking.id)

                // Let's go with DELETE then INSERT to ensure clean state and correct ID (from Smash API)
                await supabase.from('bookings').delete().eq('id', existingBooking.id)
            } else {
                // Case 2: Slot taken by other user or already confirmed -> ERROR
                // But wait, Smash API allowed it? That means local DB is out of sync.
                console.warn(`[CreateBooking] Slot collision! Local DB has booking ${existingBooking.id} but Smash API allowed new one.`)
                // If local status is pending and old (e.g. > 15 mins), we could force overwrite.
                // For now, let's just delete the stale local pending booking if it exists to allow the new one.
                if (existingBooking.status === 'pending') {
                    await supabase.from('bookings').delete().eq('id', existingBooking.id)
                }
            }
        }

        // Now safe to Insert
        const { error: dbError } = await supabase.from('bookings').insert({
            id: bookingId,
            user_id: user.id,
            court_id: data.courtUuid,
            booking_date: data.bookingDate,
            start_time: data.startTime,
            end_time: data.endTime,
            total_price: courtPrice,
            status: 'pending',
            duration_hours: data.durationHours,
            venue_id: data.courtId // Save Venue ID for Partner Sync
        })

        if (dbError) {
            console.error('Failed to save booking to local DB:', dbError)
            // We don't block the user but we log it.
        }

        if (apiResult.success) {
            revalidatePath('/')
        }

        return {
            success: true,
            data: apiResult.data,
            paymentUrl: invoice.invoice_url
        }

    } catch (error: any) {
        console.error('Failed to create payment invoice:', error)
        // Return success but with warning/no payment URL
        // User will see booking in "Pending" state in their history
        const errorMessage = error?.message || 'Unknown error';
        return {
            success: true,
            data: apiResult.data,
            warning: `Payment link failed: ${errorMessage}. Booking saved as Pending.`
        }
    }
}

export async function confirmBookingPayment(bookingId: string) {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // 1. Get current booking to retrieve Venue ID -> Partner ID
    try {
        const { createServiceClient } = await import('@/lib/supabase/server')
        const supabase = createServiceClient()

        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('venue_id, status')
            .eq('id', bookingId)
            .single()

        if (bookingError || !booking) {
            console.error('[ManualCheck] Booking not found locally:', bookingError)
            return { success: false, error: 'Booking not found' }
        }

        // If already confirmed, return early
        if (booking.status === 'confirmed') {
            return { success: true, status: 'confirmed' }
        }

        // 2. Fetch invoice from Xendit (Platform Account)
        // Note: Removed partner account lookup as all invoices are in platform account
        const { getInvoicesByExternalId } = await import('@/lib/xendit/client')
        const invoices = await getInvoicesByExternalId(bookingId)

        // Take the latest invoice
        const invoice = invoices && invoices.length > 0 ? invoices[0] : null

        // 3. Check Invoice Status
        if (invoice && (invoice.status === 'PAID' || invoice.status === 'SETTLED')) {
            console.log('[ManualCheck] Invoice PAID!')

            // Revenue = Full court price (no fee deduction)
            const paidAmount = invoice.amount
            console.log(`[ManualCheck] Syncing to Partner - Amount: ${paidAmount}`)

            await updateBookingStatus(bookingId, 'confirmed', paidAmount)

            // Force update local DB
            await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)

            revalidatePath('/bookings/history')
            return { success: true, status: 'confirmed' }

        } else if (invoice && invoice.status === 'EXPIRED') {
            console.log('[ManualCheck] Invoice EXPIRED')
            await updateBookingStatus(bookingId, 'cancelled')
            await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)

            revalidatePath('/bookings/history')
            return { success: true, status: 'cancelled' }
        }

        return {
            success: false,
            status: invoice?.status || 'pending'
        }

    } catch (e: any) {
        console.error("Manual payment check failed", e)
        // If 404, it might mean we looked in the wrong account or ID is wrong
        return { success: false, error: e.message || 'Check failed' }
    }
}

/**
 * Server action to update booking status (payment confirmation)
 */
export async function updateBookingStatus(bookingId: string, status: string, paidAmount?: number) {
    return await smashApi.updateBookingStatus(bookingId, status, paidAmount)
}

// ============== NOTIFICATIONS ==============

export type NotificationType = 'booking_confirmed' | 'booking_cancelled' | 'payment_reminder' | 'points_earned' | 'system' | 'promo'

export interface Notification {
    id: string
    user_id: string
    type: NotificationType
    title: string
    message: string
    read: boolean
    created_at: string
    // Optional metadata for different notification types
    metadata?: {
        booking_id?: string
        court_name?: string
        booking_date?: string
        points?: number
        promo_code?: string
    }
}

/**
 * Server action to fetch user notifications
 * TODO: Connect to real API once notifications endpoint is available
 */
export async function fetchNotifications(): Promise<Notification[]> {
    const user = await getCurrentUser()

    if (!user) {
        return []
    }

    // TODO: Replace with actual API call when ready
    // Example: return await smashApi.getNotifications(user.id)

    // For now, return empty array - no dummy data
    return []
}

/**
 * Server action to mark a notification as read
 * TODO: Connect to real API once notifications endpoint is available
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false }
    }

    // TODO: Replace with actual API call when ready
    // Example: return await smashApi.markNotificationRead(notificationId)

    return { success: true }
}

/**
 * Server action to mark all notifications as read
 * TODO: Connect to real API once notifications endpoint is available
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false }
    }

    // TODO: Replace with actual API call when ready
    // Example: return await smashApi.markAllNotificationsRead(user.id)

    return { success: true }
}
