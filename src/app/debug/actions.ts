'use server'

import { createServiceClient } from '@/lib/supabase/server'

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
