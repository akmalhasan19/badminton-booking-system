import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { smashApi } from '@/lib/smash-api'
import { syncBookingToPartner } from '@/lib/partner-sync'

export async function POST(req: Request) {
    try {
        const callbackToken = req.headers.get('x-callback-token')
        const webhookToken = process.env.XENDIT_CALLBACK_TOKEN

        // 1. Security Check: Verify the request is actually from Xendit
        if (!callbackToken || callbackToken !== webhookToken) {
            console.error('Unauthorized webhook attempt')
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { external_id, status, paid_amount, payment_method, id: invoice_id } = body

        console.log(`Received webhook for booking ${external_id}: ${status}, paid_amount: ${paid_amount}`)

        // 2. Process only relevant statuses (PAID or SETTLED)
        if (status === 'PAID' || status === 'SETTLED') {
            const supabase = createServiceClient()

            // 3. Update local database
            const { error } = await supabase
                .from('bookings')
                .update({
                    status: 'confirmed',
                })
                .eq('id', external_id)

            if (error) {
                console.error('Failed to update local booking status:', error)
                return NextResponse.json({ message: 'Database update failed' }, { status: 500 })
            }

            console.log(`Booking ${external_id} confirmed in local database.`)

            // 3a. Fetch Booking & User Details for Partner Sync
            const { data: bookingData, error: fetchError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    users (
                        full_name,
                        phone
                    )
                `)
                .eq('id', external_id)
                .single()

            if (fetchError || !bookingData) {
                console.error('Failed to fetch booking details for sync:', fetchError)
                // We don't fail the webhook, but we log the sync failure
            } else {
                // 4. Sync to PWA Smash API (Legacy/Direct)
                // Optional: Keep if needed for legacy support
                await smashApi.updateBookingStatus(external_id, 'LUNAS', paid_amount)

                // 5. Sync to Partner API (New Webhook Methodology)
                const customerName = bookingData.users?.full_name || 'PWA User'
                const customerPhone = bookingData.users?.phone

                console.log(`[Webhook] Preparing to sync booking ${external_id}. Venue ID: ${bookingData.venue_id}`);

                await syncBookingToPartner({
                    event: 'booking.paid',
                    booking_id: external_id,
                    venue_id: bookingData.venue_id || 'unknown', // Critical field
                    payment_status: 'PAID',
                    total_amount: paid_amount,
                    paid_amount: paid_amount,
                    payment_method: payment_method || 'XENDIT',
                    customer_name: customerName,
                    customer_phone: customerPhone
                })
            }
        }

        return NextResponse.json({ message: 'Webhook received' }, { status: 200 })

    } catch (error) {
        console.error('Webhook Error:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
