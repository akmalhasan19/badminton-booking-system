'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'
import { getOrderPaymentStatus } from '@/lib/payments/service'

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

type BookingWithCourtRelation = {
    id: string
    booking_date: string
    start_time: string
    end_time: string
    total_price: number
    status: Booking['status']
    payment_url?: string | null
    payment_state?: string | null
    payments?:
    | {
        status?: string | null
        provider_status?: string | null
        actions_json?: unknown
        expires_at?: string | null
        payment_request_id?: string | null
        reference_id?: string | null
    }[]
    | {
        status?: string | null
        provider_status?: string | null
        actions_json?: unknown
        expires_at?: string | null
        payment_request_id?: string | null
        reference_id?: string | null
    }
    | null
    courts?: { name?: string | null }[] | { name?: string | null } | null
}

const resolveCourtName = (courts: BookingWithCourtRelation['courts']) => {
    if (Array.isArray(courts)) {
        return courts[0]?.name || 'Unknown Court'
    }
    return courts?.name || 'Unknown Court'
}

const resolvePayment = (payment: BookingWithCourtRelation['payments']) => {
    if (!payment) return null
    if (Array.isArray(payment)) return payment[0] || null
    return payment
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
    const bookings = (data as BookingWithCourtRelation[]).map((booking) => ({
        id: booking.id,
        court_name: resolveCourtName(booking.courts),
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
            payment_state,
            payments (
                status,
                provider_status,
                actions_json,
                expires_at,
                payment_request_id,
                reference_id
            ),
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
    const bookings = (data as BookingWithCourtRelation[]).map((booking) => {
        const payment = resolvePayment(booking.payments)

        return {
            id: booking.id,
            court_name: resolveCourtName(booking.courts),
            date: booking.booking_date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            price: booking.total_price,
            status: booking.status,
            payment_url: booking.payment_url,
            payment_state: booking.payment_state,
            payment: payment
                ? {
                    status: payment.status || booking.payment_state || null,
                    provider_status: payment.provider_status || null,
                    actions: Array.isArray(payment.actions_json) ? payment.actions_json : [],
                    expires_at: payment.expires_at || null,
                    payment_request_id: payment.payment_request_id || null,
                    reference_id: payment.reference_id || null,
                }
                : null,
        }
    })

    return { data: bookings }
}

export async function confirmBookingPayment(bookingId: string) {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const paymentStatus = await getOrderPaymentStatus(bookingId, { syncFromProvider: true })

        revalidatePath('/bookings/history')

        if (paymentStatus.orderStatus === 'confirmed') {
            return { success: true, status: 'confirmed', payment: paymentStatus }
        }

        if (paymentStatus.orderStatus === 'cancelled') {
            return { success: true, status: 'cancelled', payment: paymentStatus }
        }

        return {
            success: false,
            status: paymentStatus.providerStatus || paymentStatus.paymentStatus || 'pending',
            payment: paymentStatus,
        }

    } catch (e) {
        console.error('Manual payment check failed', e)
        return { success: false, error: 'Check failed' }
    }
}
