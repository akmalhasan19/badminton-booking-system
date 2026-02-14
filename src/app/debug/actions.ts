'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { createInvoice, getInvoicesByExternalId } from '@/lib/xendit/client'
import { checkDebugAccess } from '@/lib/security/debug-access'
import { enforceDebugActionCooldown } from '@/lib/security/abuse-protection'

async function assertDebugAccess() {
    const access = await checkDebugAccess()
    if (!access.allowed) {
        return { error: access.error }
    }

    return null
}

async function assertDebugCooldown(actionKey: string) {
    const cooldown = await enforceDebugActionCooldown(actionKey)
    if (!cooldown.allowed) {
        const suffix = cooldown.retryAfterSeconds ? ` Retry after ${cooldown.retryAfterSeconds}s.` : ''
        return { error: `${cooldown.error}${suffix}` }
    }

    return null
}

export async function getPendingBookings(): Promise<{ data: any[]; error?: string }> {
    const accessError = await assertDebugAccess()
    if (accessError) {
        return { data: [], error: accessError.error }
    }

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
        return { data: [], error: 'Failed' }
    }

    return { data: data || [] }
}

export async function simulateWebhookTrigger(bookingId: string): Promise<{ success: boolean; error?: string }> {
    const accessError = await assertDebugAccess()
    if (accessError) {
        return { success: false, error: accessError.error }
    }

    const cooldownError = await assertDebugCooldown('simulate-webhook')
    if (cooldownError) {
        return { success: false, error: cooldownError.error }
    }

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
        return { success: false, error: error.message }
    }
}

export async function testCreateInvoice(): Promise<{ success: boolean; data?: unknown; error?: string; details?: string }> {
    const accessError = await assertDebugAccess()
    if (accessError) {
        return { success: false, error: accessError.error }
    }

    const cooldownError = await assertDebugCooldown('test-invoice')
    if (cooldownError) {
        return { success: false, error: cooldownError.error }
    }

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

export async function getWebhookLogs(limit: number = 20): Promise<{ data: any[]; error?: string }> {
    const accessError = await assertDebugAccess()
    if (accessError) {
        return { data: [], error: accessError.error }
    }

    const supabase = createServiceClient()

    // We need to fetch data from the new table
    const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching webhook logs:', error)
        return { data: [], error: 'Failed to fetch logs' }
    }

    return { data: data || [] }
}

export async function verifyPaymentExternal(bookingId: string) {
    const accessError = await assertDebugAccess()
    if (accessError) {
        return { success: false, error: accessError.error }
    }

    const cooldownError = await assertDebugCooldown('verify-payment')
    if (cooldownError) {
        return { success: false, error: cooldownError.error }
    }

    const supabase = createServiceClient()

    try {
        console.log(`[ManualVerify] Verifying payment for ${bookingId}`)

        // Fetch invoice from Xendit (Platform Account Only)
        console.log(`[ManualVerify] Searching Xendit in Platform Account`)
        const invoice = await getInvoicesByExternalId(bookingId)

        // Xendit might return an array if multiple invoices exist with same external_id
        // We usually care about the latest one
        const latestInvoice = invoice && invoice.length > 0 ? invoice[0] : null;

        if (!latestInvoice) {
            console.log(`[ManualVerify] No invoice found.`)
            return {
                success: false,
                message: 'No invoice found in Xendit for this Booking ID.'
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
