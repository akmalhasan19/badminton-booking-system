'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

export async function getAllBookings() {
    const isUserAdmin = await isAdmin()
    if (!isUserAdmin) {
        return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
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
            venue_id,
            venues (
                name
            )
        `)
        .order('booking_date', { ascending: false })

    if (error) {
        console.error('Error fetching admin bookings:', error)
        return { error: 'Failed to fetch bookings' }
    }

    return { data }
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
