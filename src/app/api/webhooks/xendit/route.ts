import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateBookingStatus } from '@/lib/api/bookings'

const XENDIT_CALLBACK_TOKEN = process.env.XENDIT_CALLBACK_TOKEN

export async function POST(request: Request) {
    if (!XENDIT_CALLBACK_TOKEN) {
        console.error('XENDIT_CALLBACK_TOKEN is not set')
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const callbackToken = request.headers.get('x-callback-token')

    // 1. Security Check
    if (callbackToken !== XENDIT_CALLBACK_TOKEN) {
        return NextResponse.json({ error: 'Invalid callback token' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { external_id, status } = body

        // external_id is usually our bookingId or format like "booking-{id}"
        // Assuming external_id IS the booking ID for simplicity based on typical usage
        const bookingId = external_id

        if (!bookingId || !status) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const supabase = await createClient()

        // 2. Idempotency Check & Status Update
        // Fetch current booking status first to avoid redundant updates
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('status')
            .eq('id', bookingId)
            .single()

        if (fetchError || !booking) {
            console.error('Booking not found:', bookingId)
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Map Xendit status to our system status
        let newStatus: 'confirmed' | 'cancelled' | null = null

        if (status === 'PAID' || status === 'SETTLED') {
            newStatus = 'confirmed'
        } else if (status === 'EXPIRED') {
            newStatus = 'cancelled'
        }

        if (newStatus && booking.status !== newStatus) {
            // Use the API helper which manages Supabase client internally, 
            // OR use direct supabase call here since we are in an API route context.
            // Using direct supabase call for simplicity in API route context to avoid client recreation issues
            const { error: updateError } = await supabase
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', bookingId)

            if (updateError) {
                console.error('Error updating booking:', updateError)
                return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
            }
        }

        return NextResponse.json({ success: true })

    } catch (err) {
        console.error('Webhook Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
