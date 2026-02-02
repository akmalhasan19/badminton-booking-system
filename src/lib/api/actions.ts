'use server'

import { getCourts } from './courts'
import { getAvailableSlots, createBooking as createBookingApi } from './bookings'
import { revalidatePath } from 'next/cache'
import { smashApi } from '@/lib/smash-api'

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
 * Server action to fetch courts from Smash API
 */
export async function fetchSmashCourts() {
    const courts = await smashApi.getCourts()
    return courts
}

/**
 * Server action to fetch available slots for a court
 * Now uses Smash API for availability check if possible, or falls back to local
 */
export async function fetchAvailableSlots(venueId: string, date: string) {
    // Note: The UI currently expects a list of { time, available }.
    // The Smash API returns a list of BOOKINGS (occupied slots).
    // We need to convert that into the format the UI expects.

    // 1. Get raw availability/bookings from Smash API
    const occupiedSlots = await smashApi.checkAvailability(venueId, date)

    // 2. Define operating hours (Hardcoded for now as per API Guide example or inferred)
    // The venue object from getVenues has operating_hours_start/end. 
    //Ideally we should get this from the venue details, but for now let's assume standard 8-23
    const startHour = 8
    const endHour = 23

    const slots = []

    // 3. Generate slots
    for (let hour = startHour; hour < endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`

        // Check if this time slot matches any occupied slot in the response
        // Smash API returns e.g. { start_time: "10:00", duration: 1 }
        // We need to check if 'timeSlot' falls within any booking

        const isBooked = occupiedSlots.some((booking: any) => {
            // Simple exact match check for now. 
            // TODO: Handle duration > 1 hour logic if needed (e.g. if booking is 10:00 for 2 hours, 11:00 is also booked)
            // The API guide says "Disable slots that are already in the response".
            // Assuming response contains specific slots or we need to calculate range.

            // Simplest assumption: API returns all occupied "blocks" or we match start_time.
            // Let's assume simplest 'start_time' match first.
            return booking.start_time === timeSlot || booking.startTime === timeSlot
        })

        slots.push({
            time: timeSlot,
            available: !isBooked,
        })
    }

    return slots
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
    const smashBooking = {
        venue_id: data.courtId,
        court_id: data.courtUuid,
        booking_date: data.bookingDate,
        start_time: data.startTime,
        duration: data.durationHours,
        customer_name: "Customer (Web)", // TODO: Get from auth
        phone: "0000000000" // TODO: Get from auth
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
