import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { syncBookingToPartner } from '@/lib/partner-sync'

export async function POST(req: Request) {
    let body: any = {}
    let external_id = ''
    let status = ''

    const supabase = createServiceClient()

    try {
        const callbackToken = req.headers.get('x-callback-token')
        const webhookToken = process.env.XENDIT_CALLBACK_TOKEN

        // 1. Security Check: Verify the request is actually from Xendit
        if (!callbackToken || callbackToken !== webhookToken) {
            console.error('Unauthorized webhook attempt')

            // Log unauthorized attempt
            await supabase.from('webhook_logs').insert({
                source: 'xendit',
                status: 'unauthorized',
                response_code: 401,
                error_message: 'Invalid callback token'
            })

            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        body = await req.json()
        external_id = body.external_id
        status = body.status
        const { paid_amount, payment_method, id: invoice_id } = body

        // Log incoming webhook
        console.log('========== XENDIT WEBHOOK DEBUG ==========')
        console.log(`Received webhook for booking ${external_id}: ${status}`)

        // 2. Process only relevant statuses (PAID or SETTLED)
        if (status === 'PAID' || status === 'SETTLED') {

            // 3. Update local database
            const { error } = await supabase
                .from('bookings')
                .update({
                    status: 'confirmed',
                })
                .eq('id', external_id)

            if (error) {
                console.error('Failed to update local booking status:', error)
                throw new Error(`Database update failed: ${error.message}`)
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
                console.error('[Webhook] Failed to fetch booking details for sync:', fetchError)
                // We don't fail the webhook, but we log the sync failure
            } else {
                // 4. Sync to Partner API via Webhook (New Methodology)
                const customerName = bookingData.users?.full_name || 'PWA User'
                const customerPhone = bookingData.users?.phone

                // Calculate Net Revenue based on Xendit Fee Structure
                const XENDIT_FEE = 4000;
                const PLATFORM_FEE = 2000;
                const TOTAL_FEE = XENDIT_FEE + PLATFORM_FEE;

                const totalPaid = paid_amount;
                const netRevenue = totalPaid - TOTAL_FEE;

                console.log(`[Webhook] Processing payment for booking ${external_id}`);

                // Fetch court name with robust error handling
                const { data: courtData } = await supabase
                    .from('courts')
                    .select('name')
                    .eq('id', bookingData.court_id)
                    .single();

                const courtName = courtData?.name || `Court ${bookingData.court_id?.slice(0, 8) || 'Unknown'}`;
                const itemName = courtData?.name
                    ? `Booking ${courtData.name} - ${bookingData.start_time}`
                    : `Booking ${bookingData.start_time}`;

                // Validate venue_id before sync (CRITICAL)
                if (!bookingData.venue_id) {
                    console.error(`[Webhook] ❌ CRITICAL: venue_id is missing for booking ${external_id}`);

                    // Log warning to DB
                    await supabase.from('webhook_logs').insert({
                        source: 'xendit',
                        payload: body,
                        status: 'warning',
                        response_code: 200,
                        error_message: 'Missing venue_id, sync skipped'
                    })

                    return NextResponse.json({
                        message: 'Webhook processed but sync skipped: missing venue_id',
                        warning: 'Revenue will not appear on Partner dashboard'
                    }, { status: 200 })
                }

                console.log(`[Webhook] Preparing sync - Venue: ${bookingData.venue_id}, Customer: ${customerName}`);

                // Sync to Partner with comprehensive error handling
                try {
                    await syncBookingToPartner({
                        event: 'booking.paid',
                        booking_id: external_id,
                        venue_id: bookingData.venue_id,
                        status: 'LUNAS',  // CRITICAL: Partner requires this field for proper status display
                        payment_status: 'PAID',
                        total_amount: totalPaid,
                        paid_amount: netRevenue,
                        payment_method: payment_method || 'XENDIT',
                        customer_name: customerName,
                        customer_phone: customerPhone,
                        items: [{ name: itemName }],
                        payment_details: {
                            xendit_transaction_id: invoice_id,
                            xendit_fee: XENDIT_FEE,
                            platform_fee: PLATFORM_FEE,
                            total_fees: TOTAL_FEE
                        }
                    });
                    console.log(`[Webhook] ✅ Successfully synced booking ${external_id} to Partner dashboard`);
                } catch (error) {
                    console.error(`[Webhook] ❌ Failed to sync booking ${external_id} to Partner:`, error);
                    // Don't fail the webhook - local DB is already updated
                }
            }
        }

        // Log Success
        await supabase.from('webhook_logs').insert({
            source: 'xendit',
            payload: body,
            status: 'processed',
            response_code: 200
        })

        return NextResponse.json({ message: 'Webhook received' }, { status: 200 })

    } catch (error: any) {
        console.error('Webhook Error:', error)

        // Log Failure
        await supabase.from('webhook_logs').insert({
            source: 'xendit',
            payload: body,
            status: 'failed',
            response_code: 500,
            error_message: error.message || 'Unknown error'
        })

        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
