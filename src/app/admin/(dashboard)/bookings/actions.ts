'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'
import { withLogging } from '@/lib/safe-action'

const getAllBookingsLogic = async (params: { page: number, limit: number }) => {
    const { page, limit } = params
    const isUserAdmin = await isAdmin()
    if (!isUserAdmin) {
        return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Calculate range
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await supabase
        .from('bookings')
        .select(`
            id,
            booking_date,
            start_time,
            end_time,
            total_price,
            status,
            created_at,
            user_id,
            users (
                full_name,
                email,
                phone,
                avatar_url
            ),
            courts (
                name
            ),
            venue_id,
            venue_name,
            court_name
        `, { count: 'exact' })
        .order('booking_date', { ascending: false })
        .range(from, to)

    if (error) {
        // console.error('Error fetching admin bookings:', error) -> Handled by withLogging
        return { error: 'Failed to fetch bookings' }
    }

    // Map venue_id to venue_name (Backwards compatibility)
    const bookingsWithVenueName = data.map((booking: any) => ({
        ...booking,
        venue_name: booking.venue_name || 'GOR Smash Juara', // Use DB value or Fallback
        court_name: booking.court_name || booking.courts?.name || 'Unknown Court', // Use DB value or Fallback
    }))

    return { data: bookingsWithVenueName, totalCount: count || 0 }
}

// Adapting the signature to match original (args vs single object)
// withLogging takes a single argument function. We need to adapt it.
// Or we can just modify the caller to pass an object, but that breaks signature.
// Strategy: Create a new exported function that matches signature but calls wrapped logic internally?
// Ideally withLogging should wrap the logic. If original function took multiple args, we package them.
// But wait, getAllBookings(page, limit).
// Using an adapter:

const getAllBookingsWrapped = withLogging('getAllBookings', getAllBookingsLogic)

export async function getAllBookings(page: number = 1, limit: number = 10) {
    return getAllBookingsWrapped({ page, limit })
}

export async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled' | 'completed') {
    const isUserAdmin = await isAdmin()
    if (!isUserAdmin) {
        return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)

    if (error) {
        return { error: 'Failed to update booking' }
    }

    revalidatePath('/admin/bookings')
    return { success: true }
}
