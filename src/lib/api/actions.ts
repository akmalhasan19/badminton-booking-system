'use server'

import { getCourts } from './courts'
import { getAvailableSlots, createBooking as createBookingApi } from './bookings'
import { revalidatePath } from 'next/cache'
import { smashApi, SmashVenueDetails, SmashAvailabilityResponse } from '@/lib/smash-api'
import { getCurrentUser } from '@/lib/auth/actions'

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

    if (apiResult.error) {
        return { success: false, error: apiResult.error }
    }

    // 2. If successful, save to Supabase (Local History)
    // We reuse the existing createBookingApi but we might need to mock/adjust data 
    // since we don't have a local 'courts' record that matches the external Venue ID.
    // We skip local DB write if we don't have matching local tables, to avoid errors.

    if (apiResult.success) {
        revalidatePath('/')
    }

    return apiResult
}

/**
 * Server action to update booking status (payment confirmation)
 */
export async function updateBookingStatus(bookingId: string, status: string, paidAmount?: number) {
    return await smashApi.updateBookingStatus(bookingId, status, paidAmount)
}
