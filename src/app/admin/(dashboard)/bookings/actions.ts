'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

export async function getAllBookings(page: number = 1, limit: number = 10) {
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
                phone
            ),
            courts (
                name
            ),
            venue_id
        `, { count: 'exact' })
        .order('booking_date', { ascending: false })
        .range(from, to)

    if (error) {
        console.error('Error fetching admin bookings:', error)
        return { error: 'Failed to fetch bookings' }
    }

    return { data, totalCount: count || 0 }
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
