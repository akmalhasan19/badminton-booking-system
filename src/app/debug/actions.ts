'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { createInvoice, getInvoicesByExternalId } from '@/lib/xendit/client'
import { smashApi } from '@/lib/smash-api'

export async function getPendingBookings() {
    const supabase = createServiceClient()

    // Fetch RECENT bookings (any status), ordered by date desc
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            id,
            booking_date,
            total_price,
            status,
            created_at,
            users (
                name,
                email
            ),
            courts (
                name
            )
        `)
        // Removed status filter to see everything
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('Error fetching pending bookings:', error)
        return { error: 'Failed' }
    }

    return { data }
}

export async function simulateWebhookTrigger(bookingId: string) {
    const token = process.env.XENDIT_CALLBACK_TOKEN
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    console.log(`Simulating webhook for ${bookingId} to ${baseUrl}/api/webhooks/xendit`)

    try {
        const res = await fetch(`${baseUrl}/api/webhooks/xendit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-callback-token': token || ''
            },
            body: JSON.stringify({
                external_id: bookingId,
                status: 'PAID',
                amount: 100000, // Dummy amount
                id: `wbhk_${Date.now()}` // Dummy Webhook ID
            })
        })

        if (!res.ok) {
            const text = await res.text()
            throw new Error(`Webhook failed: ${res.status} ${text}`)
        }

        return { success: true }
    } catch (error: any) {
        console.error('Simulation failed:', error)
        return { error: error.message }
    }
}

export async function testCreateInvoice() {
    try {
        const timestamp = Date.now()
        const externalId = `debug_test_${timestamp}`

        console.log(`[Debug] Testing createInvoice with externalId: ${externalId}`)

        const invoice = await createInvoice({
            externalId: externalId,
            amount: 10000, // Rp 10.000
            description: 'Debug Test Invoice',
            payerEmail: 'test@example.com',
            successRedirectUrl: 'https://example.com/success',
            failureRedirectUrl: 'https://example.com/failure'
        })

        console.log('[Debug] Invoice created successfully:', invoice)
        return { success: true, data: invoice }

    } catch (error: any) {
        console.error('[Debug] Failed to create invoice:', error)
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            details: JSON.stringify(error)
        }
    }
}

export async function getWebhookLogs(limit: number = 20) {
    const supabase = createServiceClient()

    // We need to fetch data from the new table
    const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching webhook logs:', error)
        return { error: 'Failed to fetch logs' }
    }

    return { data }
}

export async function verifyPaymentExternal(bookingId: string) {
    const supabase = createServiceClient()

    try {
        console.log(`[ManualVerify] Verifying payment for ${bookingId}`)

        // 0. Fetch Booking Context (to find Sub-Account ID)
        const { data: booking } = await supabase
            .from('bookings')
            .select('venue_id')
            .eq('id', bookingId)
            .single()

        let forUserId = undefined;
        let venueName = 'Unknown Venue';

        if (booking?.venue_id) {
            console.log(`[ManualVerify] Found venue_id: ${booking.venue_id}`)
            try {
                const venue = await smashApi.getVenueDetails(booking.venue_id);
                console.log(`[ManualVerify] Venue fetch result:`, venue ? `Found: ${venue.name}` : 'Null');
                if (venue?.xendit_account_id) {
                    forUserId = venue.xendit_account_id;
                    venueName = venue.name;
                    console.log(`[ManualVerify] Venue has Xendit Sub-Account: ${forUserId}`)
                } else {
                    console.log(`[ManualVerify] Venue has NO xendit_account_id`)
                }
            } catch (err) {
                console.error('[ManualVerify] Failed to fetch venue details:', err)
            }
        } else {
            console.log(`[ManualVerify] No venue_id found on booking ${bookingId}`)
        }

        // 1. Fetch from Xendit (Try Sub-Account first if available)
        console.log(`[ManualVerify] Searching Xendit in: ${forUserId || 'Platform Only'}`)
        let invoice = await getInvoicesByExternalId(bookingId, forUserId)

        // If not found in Sub-Account, maybe try Platform Account? (Fallback)
        if ((!invoice || invoice.length === 0) && forUserId) {
            console.log('[ManualVerify] Not found in Sub-Account, trying Platform Account...')
            invoice = await getInvoicesByExternalId(bookingId, undefined)
        }

        // Xendit might return an array if multiple invoices exist with same external_id
        // We usually care about the latest one
        const latestInvoice = invoice && invoice.length > 0 ? invoice[0] : null;

        if (!latestInvoice) {
            console.log(`[ManualVerify] No invoice found.`)
            return {
                success: false,
                message: forUserId
                    ? `No invoice found in Xendit for this Booking ID (Checked Venue: ${venueName} & Platform).`
                    : 'No invoice found in Xendit for this Booking ID.'
            }
        }

        console.log(`[ManualVerify] Invoice Found! Status: ${latestInvoice.status}`)

        // 2. Check status
        if (latestInvoice.status === 'PAID' || latestInvoice.status === 'SETTLED') {
            // 3. Force Sync if it's paid
            // We can trigger the simulation to force the sync logic

            await simulateWebhookTrigger(bookingId)

            return {
                success: true,
                status: latestInvoice.status,
                invoice: latestInvoice,
                message: 'Invoice is PAID in Xendit. Attempted to force sync via webhook simulation.'
            }
        }

        return {
            success: true,
            status: latestInvoice.status,
            invoice: latestInvoice,
            message: `Invoice status is ${latestInvoice.status}`
        }

    } catch (error: any) {
        console.error('Verification failed:', error)
        return { success: false, error: error.message }
    }
}
