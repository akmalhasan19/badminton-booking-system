'use server'

import { getCourts } from './courts'
import { revalidatePath } from 'next/cache'
import { smashApi, SmashVenueDetails, SmashAvailabilityResponse } from '@/lib/smash-api'
import { getCurrentUser } from '@/lib/auth/actions'
import { createInvoice } from '@/lib/xendit/client'
import { getSetting } from '@/lib/api/settings'
import { createClient } from '@/lib/supabase/server'
import { createBookingEventNotification } from '@/lib/notifications/service'




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
 * Server action to fetch public courts (with venue details)
 * Use for dynamic filtering
 */
export async function fetchPublicCourts() {
    const courts = await smashApi.getPublicCourts()
    return courts
}

/**
 * Server action to fetch venue details (with courts) from Smash API
 * Use this when user selects a venue to get court list
 */
export async function fetchVenueDetails(venueId: string): Promise<SmashVenueDetails | null> {
    return await smashApi.getVenueDetails(venueId)
}

/**
 * Server action to fetch courts for a venue from Smash API
 * Use this to get courts with court_type and photo_url
 * Endpoint: GET /venues/{id}/courts
 */
export async function fetchVenueCourts(venueId: string) {
    return await smashApi.getVenueCourts(venueId)
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
    venueName?: string
    courtName?: string
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
    const originalPrice = hourlyRate * data.durationHours

    // FEE CALCULATION
    // Strategy: Hybrid (Service Fee for User + Application Fee for Partner)
    const serviceFeeUser = await getSetting('service_fee_user', 3000)
    const applicationFeePartner = await getSetting('application_fee_partner', 2000)

    // Venue receives: Original - Application Fee
    // This is what we disburse to the partner (Sync to Partner App)
    const netVenuePrice = originalPrice - applicationFeePartner

    // Buyer pays: Original + Service Fee
    // This is the total amount on the invoice
    const totalUserBill = originalPrice + serviceFeeUser

    // Legacy logic cleanup: We no longer add 'xenditFee' separately to user bill, 
    // it's now covered by the serviceFeeUser spread.

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smash-web.vercel.app'

    // 3. Create Xendit Invoice (Platform Account Only)
    // We charge the User the totalUserBill
    try {
        console.log('[CreateBooking] Preparing to create Xendit Invoice...')
        console.log('[CreateBooking] Price Logic (Hybrid Strategy):', {
            originalPrice,
            serviceFeeUser,
            applicationFeePartner,
            netVenuePrice,
            totalUserBill,
            spread: serviceFeeUser + applicationFeePartner
        })

        const invoice = await createInvoice({
            externalId: bookingId,
            amount: totalUserBill,
            payerEmail: user.email,
            description: `Booking ${venueDetails?.name || 'Court'} - ${selectedCourt?.name || 'Badminton'}`,
            successRedirectUrl: `${appUrl}/bookings?payment=success&booking_id=${bookingId}`,
            failureRedirectUrl: `${appUrl}/?status=failed`,
        })

        console.log('[CreateBooking] Invoice created in Platform Account:', invoice.id)
        console.log('[CreateBooking] Full Invoice Response:', JSON.stringify(invoice, null, 2))

        if (!invoice.invoice_url) {
            console.error('[CreateBooking] ⚠️ WARNING: Invoice URL is MISSING in Xendit response!', invoice)
        } else {
            console.log('[CreateBooking] Invoice URL:', invoice.invoice_url)
        }

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
                await supabase
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
            total_price: totalUserBill, // This is what user pays
            status: 'pending',
            duration_hours: data.durationHours,
            venue_id: data.courtId, // Save Venue ID for Partner Sync
            venue_name: data.venueName || venueDetails?.name || 'Unknown Venue', // Snapshot Venue Name
            court_name: data.courtName || selectedCourt?.name || 'Unknown Court', // Snapshot Court Name
            payment_url: invoice.invoice_url, // Save Xendit payment URL for direct redirect
            // Fee Breakdown columns
            application_fee: applicationFeePartner,
            xendit_fee: 0, // No longer tracked separately, subsumed in service fee spread
            service_fee: serviceFeeUser, // New column might be needed if we want to track it explicitly, or just store in total_price
            net_venue_price: netVenuePrice
        })

        if (dbError) {
            console.error('Failed to save booking to local DB:', dbError)
            // We don't block the user but we log it.
        } else {
            await createBookingEventNotification({
                type: 'payment_reminder',
                booking: {
                    id: bookingId,
                    user_id: user.id,
                    booking_date: data.bookingDate,
                    start_time: data.startTime,
                    venue_name: data.venueName || venueDetails?.name || null,
                    court_name: data.courtName || selectedCourt?.name || null
                },
                supabase
            })
        }

        if (apiResult.success) {
            revalidatePath('/')
        }

        return {
            success: true,
            data: apiResult.data,
            paymentUrl: invoice.invoice_url
        }

    } catch (error: unknown) {
        console.error('Failed to create payment invoice:', error)
        // Return success but with warning/no payment URL
        // User will see booking in "Pending" state in their history
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
            .select('venue_id, status, user_id, venue_name, court_name, booking_date, start_time')
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
            await createBookingEventNotification({
                type: 'booking_confirmed',
                booking: {
                    id: bookingId,
                    user_id: booking.user_id,
                    booking_date: booking.booking_date,
                    start_time: booking.start_time,
                    venue_name: booking.venue_name,
                    court_name: booking.court_name
                },
                supabase
            })

            revalidatePath('/bookings/history')
            return { success: true, status: 'confirmed' }

        } else if (invoice && invoice.status === 'EXPIRED') {
            console.log('[ManualCheck] Invoice EXPIRED')
            await updateBookingStatus(bookingId, 'cancelled')
            await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
            await createBookingEventNotification({
                type: 'booking_cancelled',
                booking: {
                    id: bookingId,
                    user_id: booking.user_id,
                    booking_date: booking.booking_date,
                    start_time: booking.start_time,
                    venue_name: booking.venue_name,
                    court_name: booking.court_name
                },
                supabase
            })

            revalidatePath('/bookings/history')
            return { success: true, status: 'cancelled' }
        }

        return {
            success: false,
            status: invoice?.status || 'pending'
        }

    } catch (e: unknown) {
        console.error("Manual payment check failed", e)
        // If 404, it might mean we looked in the wrong account or ID is wrong
        const message = e instanceof Error ? e.message : 'Check failed'
        return { success: false, error: message }
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
        venue_name?: string
        points?: number
        promo_code?: string
        notification_source?: string
        [key: string]: string | number | boolean | null | undefined
    }
}

export interface NotificationPreferences {
    accountEmail: boolean
    accountPush: boolean
    exclusiveEmail: boolean
    exclusivePush: boolean
    reminderEmail: boolean
    reminderPush: boolean
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    accountEmail: true,
    accountPush: false,
    exclusiveEmail: true,
    exclusivePush: false,
    reminderEmail: true,
    reminderPush: false,
}

const mapPreferenceDbToClient = (row: {
    account_email: boolean
    account_push: boolean
    exclusive_email: boolean
    exclusive_push: boolean
    reminder_email: boolean
    reminder_push: boolean
}): NotificationPreferences => ({
    accountEmail: row.account_email,
    accountPush: row.account_push,
    exclusiveEmail: row.exclusive_email,
    exclusivePush: row.exclusive_push,
    reminderEmail: row.reminder_email,
    reminderPush: row.reminder_push
})

const mapPreferenceClientToDb = (preferences: NotificationPreferences) => ({
    account_email: preferences.accountEmail,
    account_push: preferences.accountPush,
    exclusive_email: preferences.exclusiveEmail,
    exclusive_push: preferences.exclusivePush,
    reminder_email: preferences.reminderEmail,
    reminder_push: preferences.reminderPush
})

/**
 * Server action to fetch user notifications
 */
export async function fetchNotifications(): Promise<Notification[]> {
    const user = await getCurrentUser()

    if (!user) {
        return []
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, title, message, metadata, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch notifications:', error)
        return []
    }

    return (data || []) as Notification[]
}

/**
 * Server action to mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false }
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Failed to mark notification as read:', error)
        return { success: false }
    }

    revalidatePath('/notifications')
    return { success: true }
}

/**
 * Server action to mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false }
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

    if (error) {
        console.error('Failed to mark all notifications as read:', error)
        return { success: false }
    }

    revalidatePath('/notifications')
    return { success: true }
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
    const user = await getCurrentUser()

    if (!user) {
        return DEFAULT_NOTIFICATION_PREFERENCES
    }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('notification_preferences')
        .select('account_email, account_push, exclusive_email, exclusive_push, reminder_email, reminder_push')
        .eq('user_id', user.id)
        .maybeSingle()

    if (error) {
        console.error('Failed to load notification preferences:', error)
        return DEFAULT_NOTIFICATION_PREFERENCES
    }

    if (!data) {
        const { error: upsertError } = await supabase
            .from('notification_preferences')
            .upsert(
                {
                    user_id: user.id,
                    ...mapPreferenceClientToDb(DEFAULT_NOTIFICATION_PREFERENCES)
                },
                { onConflict: 'user_id' }
            )

        if (upsertError) {
            console.error('Failed to initialize notification preferences:', upsertError)
        }

        return DEFAULT_NOTIFICATION_PREFERENCES
    }

    return mapPreferenceDbToClient(data)
}

export async function updateNotificationPreferences(
    partialPreferences: Partial<NotificationPreferences>
): Promise<{ success: boolean; preferences?: NotificationPreferences; error?: string }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const currentPreferences = await getNotificationPreferences()
    const nextPreferences: NotificationPreferences = {
        ...currentPreferences,
        ...partialPreferences
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('notification_preferences')
        .upsert(
            {
                user_id: user.id,
                ...mapPreferenceClientToDb(nextPreferences)
            },
            { onConflict: 'user_id' }
        )

    if (error) {
        console.error('Failed to update notification preferences:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/settings/notifications')
    return { success: true, preferences: nextPreferences }
}
