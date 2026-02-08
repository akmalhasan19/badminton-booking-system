'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache' // Added import
import { smashApi } from '@/lib/smash-api' // Added import for updateBookingStatus

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

    console.log('[DEBUG getUserActiveBookings] user:', user?.id)

    if (!user) {
        return { error: 'Unauthorized', data: [] }
    }

    const today = new Date().toISOString().split('T')[0]
    console.log('[DEBUG getUserActiveBookings] today:', today)

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
        .gte('booking_date', today) // Only future or today
        .order('booking_date', { ascending: true })

    console.log('[DEBUG getUserActiveBookings] data:', data?.length, 'error:', error)

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

    console.log('[DEBUG getUserBookingHistory] user:', user?.id)

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
            payment_url,
            courts (
                name
            )
        `)
        .eq('user_id', user.id)
        .in('status', ['completed', 'cancelled', 'confirmed', 'pending'])
        .order('booking_date', { ascending: false })

    console.log('[DEBUG getUserBookingHistory] data:', data?.length, 'error:', error)
    if (data && data.length > 0) {
        console.log('[DEBUG getUserBookingHistory] first booking:', data[0])
    }

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
        payment_url: booking.payment_url,
    }))

    return { data: bookings }
}

// Re-implement updateBookingStatus as it is used in confirmBookingPayment
export async function updateBookingStatus(bookingId: string, status: string, paidAmount?: number) {
    return await smashApi.updateBookingStatus(bookingId, status, paidAmount)
}

export async function confirmBookingPayment(bookingId: string) {
    console.log(`[ManualCheck] Starting check for booking: ${bookingId}`)
    const user = await getCurrentUser()

    if (!user) {
        console.error('[ManualCheck] Unauthorized')
        return { success: false, error: 'Unauthorized' }
    }

    // 1. Get current booking to get bookingId
    // In a real app we might store external_id = booking_id

    // 2. Fetch invoice from Xendit using the booking ID (which we set as external_id)
    try {
        console.log(`[ManualCheck] Fetching Xendit invoice for external_id: ${bookingId}`)

        // Use Xendit List Invoices API to find it by external_id
        const authString = Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64');
        const response = await fetch(`https://api.xendit.co/v2/invoices?external_id=${bookingId}`, {
            headers: {
                'Authorization': `Basic ${authString}`
            },
            cache: 'no-store'
        });

        console.log(`[ManualCheck] Xendit Response Status: ${response.status}`)

        if (!response.ok) {
            console.error('[ManualCheck] Xendit fetch failed')
            return { success: false, error: 'Failed to fetch invoice' }
        }

        const data = await response.json()
        console.log(`[ManualCheck] Invoices found: ${data.length}`)

        const invoice = data[0] // Get the latest one

        if (invoice) {
            console.log(`[ManualCheck] Invoice status: ${invoice.status}`)
        } else {
            console.log('[ManualCheck] No invoice found for this ID')
        }

        if (invoice && (invoice.status === 'PAID' || invoice.status === 'SETTLED')) {
            console.log('[ManualCheck] Invoice is PAID. Updating booking...')

            // OPTIMIZATION (async-defer-await): Parallelize independent updates
            // Both updateBookingStatus (SmashAPI) and local DB update can happen simultaneously
            const { createServiceClient } = await import('@/lib/supabase/server')
            const supabase = createServiceClient()

            await Promise.all([
                updateBookingStatus(bookingId, 'confirmed', invoice.amount),
                supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)
            ]);

            revalidatePath('/bookings/history')
            return { success: true, status: 'confirmed' }
        } else if (invoice && invoice.status === 'EXPIRED') {
            console.log('[ManualCheck] Invoice is EXPIRED. Cancelling...')

            // OPTIMIZATION (async-defer-await): Parallelize independent updates
            const { createServiceClient } = await import('@/lib/supabase/server')
            const supabase = createServiceClient()

            await Promise.all([
                updateBookingStatus(bookingId, 'cancelled'),
                supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
            ]);

            revalidatePath('/bookings/history')
            return { success: true, status: 'cancelled' }
        }

        return { success: false, status: invoice?.status || 'pending' }

    } catch (e) {
        console.error("Manual payment check failed", e)
        return { success: false, error: 'Check failed' }
    }
}
