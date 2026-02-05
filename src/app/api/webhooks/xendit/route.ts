import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
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
                console.error('[Webhook] Failed to fetch booking details for sync:', fetchError)
                // We don't fail the webhook, but we log the sync failure
            } else {
                // 4. Sync to Partner API via Webhook (New Methodology)
                const customerName = bookingData.users?.full_name || 'PWA User'
                const customerPhone = bookingData.users?.phone

                // Calculate Net Revenue based on Xendit Fee Structure
                // Xendit Invoice/VA fee: IDR 4,000 (most common banks - BNI, BRI, Mandiri, Permata, BSI, etc.)
                // Reference: https://www.xendit.co/en-id/pricing/
                const XENDIT_FEE = 4000;
                const PLATFORM_FEE = 2000;
                const TOTAL_FEE = XENDIT_FEE + PLATFORM_FEE; // Total: 6,000

                const totalPaid = paid_amount;
                const netRevenue = totalPaid - TOTAL_FEE;

                console.log(`[Webhook] Processing payment for booking ${external_id}`);
                console.log(`[Webhook] Financials - Gross: Rp ${totalPaid.toLocaleString('id-ID')}, Xendit Fee: Rp ${XENDIT_FEE.toLocaleString('id-ID')}, Platform Fee: Rp ${PLATFORM_FEE.toLocaleString('id-ID')}, Net Revenue: Rp ${netRevenue.toLocaleString('id-ID')}`);

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
                    console.error(`[Webhook] Booking data:`, JSON.stringify(bookingData, null, 2));
                    return NextResponse.json({
                        message: 'Webhook processed but sync skipped: missing venue_id',
                        warning: 'Revenue will not appear on Partner dashboard'
                    }, { status: 200 })
                }

                console.log(`[Webhook] Preparing sync - Venue: ${bookingData.venue_id}, Customer: ${customerName}, Phone: ${customerPhone || 'N/A'}, Court: ${courtName}`);

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
                        // timestamp will be added automatically in syncBookingToPartner
                    });
                    console.log(`[Webhook] ✅ Successfully synced booking ${external_id} to Partner dashboard`);
                    console.log(`[Webhook] Expected revenue on Partner dashboard: Rp ${netRevenue.toLocaleString('id-ID')}`);
                } catch (error) {
                    console.error(`[Webhook] ❌ Failed to sync booking ${external_id} to Partner:`, error);
                    // Don't fail the webhook - local DB is already updated
                    // This ensures Xendit receives 200 OK even if Partner sync fails
                    // TODO: Consider implementing retry queue or alerting for failed syncs
                }
            }
        }

        return NextResponse.json({ message: 'Webhook received' }, { status: 200 })

    } catch (error) {
        console.error('Webhook Error:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
