'use server'

import { getCourts } from './courts'
import { getAvailableSlots, createBooking as createBookingApi } from './bookings'
import { revalidatePath } from 'next/cache'
import { smashApi, SmashVenueDetails, SmashAvailabilityResponse } from '@/lib/smash-api'
import { getCurrentUser } from '@/lib/auth/actions'
import { createInvoice } from '@/lib/xendit/client'

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
    const amount = hourlyRate * data.durationHours

    // 3. Create Xendit Invoice
    const appUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : (process.env.NEXT_PUBLIC_APP_URL || 'https://smash-web.vercel.app')

    try {
        const invoice = await createInvoice({
            externalId: bookingId,
            amount: amount,
            payerEmail: user.email,
            description: `Booking ${venueDetails?.name || 'Court'} - ${selectedCourt?.name || 'Badminton'}`,
            successRedirectUrl: `${appUrl}/bookings/history?payment=success&booking_id=${bookingId}`,
            failureRedirectUrl: `${appUrl}/?status=failed`,
        })

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
