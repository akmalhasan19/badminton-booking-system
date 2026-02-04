import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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
        const { external_id, status, paid_amount } = body

        console.log(`Received webhook for booking ${external_id}: ${status}`)

        // 2. Process only relevant statuses (PAID or SETTLED)
        if (status === 'PAID' || status === 'SETTLED') {
            const supabase = createServiceClient()

            // 3. Update database
            const { error } = await supabase
                .from('bookings')
                .update({
                    status: 'confirmed',
                    // Optional: You can store payment meta-data if your schema supports it
                    // payment_status: status,
                    // paid_at: new Date().toISOString()
                })
                .eq('id', external_id)

            if (error) {
                console.error('Failed to update booking status:', error)
                return NextResponse.json({ message: 'Database update failed' }, { status: 500 })
            }

            console.log(`Booking ${external_id} confirmed successfully.`)
        }

        return NextResponse.json({ message: 'Webhook received' }, { status: 200 })

    } catch (error) {
        console.error('Webhook Error:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
