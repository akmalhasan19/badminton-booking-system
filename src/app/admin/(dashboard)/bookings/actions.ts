'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'
import { withLogging } from '@/lib/safe-action'

const getAllBookingsLogic = async (params: { page: number, limit: number, filterType?: 'success' | 'failed' | 'all' }) => {
    const { page, limit, filterType = 'success' } = params
    const isUserAdmin = await isAdmin()
    if (!isUserAdmin) {
        return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Calculate range
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
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
            court_name,
            payment_method
        `, { count: 'exact' })
        .order('booking_date', { ascending: false })
        .range(from, to)

    // Apply filters based on type
    if (filterType === 'success') {
        query = query.in('status', ['confirmed', 'completed', 'paid'])
    } else if (filterType === 'failed') {
        // Includes pending as they are not yet successful, and cancelled/rejected/failed
        query = query.in('status', ['cancelled', 'rejected', 'pending', 'failed'])
    }

    // if 'all' or undefined (though we default to success), we don't filter status (or maybe we do? user asked for split)
    // User asked for "Confirmed/Success" and "Failed/Cancelled". "All" might not be needed but good to keep as fallback logic if needed.
    // For now, if filterType is 'all', we just don't add .in() filter.

    const { data, count, error } = await query

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

export async function getAllBookings(page: number = 1, limit: number = 10, filterType: 'success' | 'failed' | 'all' = 'success') {
    return getAllBookingsWrapped({ page, limit, filterType })
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
