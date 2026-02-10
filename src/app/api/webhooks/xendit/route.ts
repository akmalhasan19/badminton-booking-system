import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { syncBookingToPartner } from '@/lib/partner-sync'
import { logger } from '@/lib/logger'
import { createBookingEventNotification } from '@/lib/notifications/service'

type XenditWebhookPayload = {
    external_id?: string
    status?: string
    paid_amount?: number
    payment_method?: string
    id?: string
    [key: string]: unknown
}

export async function POST(req: Request) {
    let body: XenditWebhookPayload = {}
    let external_id = ''
    let status = ''

    const supabase = createServiceClient()

    try {
        const callbackToken = req.headers.get('x-callback-token')
        const webhookToken = process.env.XENDIT_CALLBACK_TOKEN

        // Security Check: Verify webhook token (Platform account only)
        if (!callbackToken || callbackToken !== webhookToken) {
            logger.error({ auth: { callbackToken } }, 'Unauthorized webhook attempt. Token mismatch.')

            // Log unauthorized attempt
            await supabase.from('webhook_logs').insert({
                source: 'xendit',
                status: 'unauthorized',
                response_code: 401,
                error_message: `Invalid callback token`
            })

            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        body = await req.json() as XenditWebhookPayload
        external_id = typeof body.external_id === 'string' ? body.external_id : ''
        status = typeof body.status === 'string' ? body.status : ''
        const paid_amount = typeof body.paid_amount === 'number' ? body.paid_amount : 0
        const payment_method = typeof body.payment_method === 'string' ? body.payment_method : ''
        const invoice_id = typeof body.id === 'string' ? body.id : ''

        // Log incoming webhook
        logger.info({
            event: 'xendit_webhook_received',
            bookingId: external_id,
            status
        }, `Received webhook for booking ${external_id}: ${status}`)

        // 2. Process only relevant statuses (PAID or SETTLED)
        if (status === 'PAID' || status === 'SETTLED') {

            // 3. Update local database
            if (!payment_method) {
                logger.warn({ bookingId: external_id, invoice_id }, 'Payment method not provided in webhook, defaulting to XENDIT');
            }
            const { error } = await supabase
                .from('bookings')
                .update({
                    status: 'confirmed',
                    payment_method: payment_method || 'XENDIT' // Save payment method or default
                })
                .eq('id', external_id)

            if (error) {
                logger.error({ bookingId: external_id, error }, 'Failed to update local booking status')
                throw new Error(`Database update failed: ${error.message}`)
            }

            logger.info({ bookingId: external_id }, `Booking ${external_id} confirmed in local database.`)

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
                logger.error({ bookingId: external_id, error: fetchError }, '[Webhook] Failed to fetch booking details for sync')
                // We don't fail the webhook, but we log the sync failure
            } else {
                await createBookingEventNotification({
                    type: 'booking_confirmed',
                    booking: {
                        id: bookingData.id,
                        user_id: bookingData.user_id,
                        booking_date: bookingData.booking_date,
                        start_time: bookingData.start_time,
                        venue_name: bookingData.venue_name,
                        court_name: bookingData.court_name
                    },
                    supabase
                })

                // 4. Sync to Partner API via Webhook (New Methodology)
                const customerName = bookingData.users?.full_name || 'PWA User'
                const customerPhone = bookingData.users?.phone

                // Revenue = Net Venue Price (from DB) or fallback to paid_amount
                // User paid: `paid_amount` (Total Bill)
                // Venue receives: `net_venue_price`
                const revenue = bookingData.net_venue_price || paid_amount

                logger.info({
                    bookingId: external_id,
                    paidAmount: paid_amount,
                    revenue
                }, `[Webhook] Processing payment for booking ${external_id}`)

                // Validate venue_id before sync (CRITICAL)
                if (!bookingData.venue_id) {
                    logger.error({ bookingId: external_id }, `[Webhook] ❌ CRITICAL: venue_id is missing for booking ${external_id}`)

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

                logger.info({
                    bookingId: external_id,
                    venueId: bookingData.venue_id,
                    customer: customerName
                }, `[Webhook] Preparing sync`)

                // Sync to Partner with full court price as revenue
                try {
                    await syncBookingToPartner({
                        event: 'booking.paid',
                        booking_id: external_id,
                        venue_id: bookingData.venue_id,
                        status: 'LUNAS',
                        payment_status: 'PAID',
                        total_amount: paid_amount, // User Total Bill
                        paid_amount: revenue,      // Venue Net Revenue
                        payment_method: payment_method || 'XENDIT',
                        customer_name: customerName,
                        customer_phone: customerPhone,
                    });
                    logger.info({ bookingId: external_id }, `[Webhook] ✅ Successfully synced booking ${external_id} to Partner dashboard`)
                } catch (error) {
                    logger.error({ bookingId: external_id, error }, `[Webhook] ❌ Failed to sync booking ${external_id} to Partner`)
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

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error({ error }, 'Webhook Error')

        // Log Failure
        await supabase.from('webhook_logs').insert({
            source: 'xendit',
            payload: body,
            status: 'failed',
            response_code: 500,
            error_message: errorMessage
        })

        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
