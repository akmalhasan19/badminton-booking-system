'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'

export interface Booking {
    id: string
    court_name: string
    date: string
    start_time: string
    end_time: string
    price: number
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    payment_status: string // Assuming derived or part of status
}

export async function getUserActiveBookings() {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Unauthorized', data: [] }
    }

    // Fetch confirmed bookings
    // We join with courts to get the court name
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            id,
            booking_date,
            start_time,
            end_time,
            total_price,
            status,
            courts (
                name
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed') // Active bookings are usually confirmed
        .gte('booking_date', new Date().toISOString().split('T')[0]) // Only future or today
        .order('booking_date', { ascending: true })

    if (error) {
        console.error('Error fetching bookings:', error)
        return { error: 'Failed to fetch bookings', data: [] }
    }

    // Transform data
    const bookings = data.map((booking: any) => ({
        id: booking.id,
        court_name: booking.courts?.name || 'Unknown Court',
        date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        price: booking.total_price,
        status: booking.status,
    }))

    return { data: bookings }
}

export async function getUserBookingHistory() {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Unauthorized', data: [] }
    }

    // Fetch history bookings (completed or cancelled)
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            id,
            booking_date,
            start_time,
            end_time,
            total_price,
            status,
            courts (
                name
            )
        `)
        .eq('user_id', user.id)
        .in('status', ['completed', 'cancelled', 'confirmed', 'pending'])
        .order('booking_date', { ascending: false })

    if (error) {
        console.error('Error fetching booking history:', error)
        return { error: 'Failed to fetch booking history', data: [] }
    }

    // Transform data
    const bookings = data.map((booking: any) => ({
        id: booking.id,
        court_name: booking.courts?.name || 'Unknown Court',
        date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        price: booking.total_price,
        status: booking.status,
    }))

    return { data: bookings }
}
