// lib/partner-sync.ts
import crypto from 'crypto';

const SYNC_URL = process.env.SMASHPARTNER_SYNC_URL || 'https://smashpartner.online/api/webhooks/pwa-sync';
const SECRET = process.env.PWA_WEBHOOK_SECRET || '';

interface SyncPayload {
    event: 'booking.paid';
    booking_id: string;
    venue_id: string;
    payment_status: 'PAID';
    total_amount: number;
    paid_amount: number;
    payment_method: string;
    customer_name: string;
    customer_phone?: string;
    timestamp?: string;
}

function generateSignature(payload: string): string {
    if (!SECRET) {
        console.warn('[Partner Sync] PWA_WEBHOOK_SECRET is not set');
        return '';
    }
    return crypto
        .createHmac('sha256', SECRET)
        .update(payload)
        .digest('hex');
}

export async function syncBookingToPartner(data: Omit<SyncPayload, 'timestamp'>): Promise<boolean> {
    try {
        const payload: SyncPayload = {
            ...data,
            timestamp: new Date().toISOString()
        };

        const payloadString = JSON.stringify(payload);
        const signature = generateSignature(payloadString);

        console.log(`[Partner Sync] Initiating sync to: ${SYNC_URL}`);
        console.log(`[Partner Sync] Venue ID: ${data.venue_id}, Booking ID: ${data.booking_id}`);
        // console.log('[Partner Sync] Full Payload:', payloadString); // Uncomment if needed deeply

        const response = await fetch(SYNC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-pwa-signature': signature
            },
            body: payloadString
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Partner Sync] Failed! Status: ${response.status} ${response.statusText}`);
            console.error(`[Partner Sync] Response Body: ${errorText}`);
            return false;
        }

        const responseData = await response.json();
        console.log('[Partner Sync] Success! Partner response:', responseData);
        return true;

    } catch (error) {
        console.error('[Partner Sync] Error:', error);
        return false;
    }
}
