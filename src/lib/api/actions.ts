'use server'

import { getCourts } from './courts'
import { getAvailableSlots, createBooking as createBookingApi } from './bookings'
import { revalidatePath } from 'next/cache'

/**
 * Server action to fetch courts
 */
export async function fetchCourts() {
    const courts = await getCourts({ isActive: true })
    return courts
}

/**
 * Server action to fetch available slots for a court
 */
export async function fetchAvailableSlots(courtId: string, date: string) {
    const slots = await getAvailableSlots(courtId, date)
    return slots
}

/**
 * Server action to create a booking
 */
export async function createBooking(data: {
    courtId: string
    bookingDate: string
    startTime: string
    endTime: string
    durationHours: number
    notes?: string
}) {
    const result = await createBookingApi(data)

    if (result.success) {
        revalidatePath('/')
    }

    return result
}
