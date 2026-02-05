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

        const response = await fetch(SYNC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-pwa-signature': signature
            },
            body: payloadString
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            console.error('[Partner Sync] Failed:', error);
            return false;
        }

        console.log('[Partner Sync] Success for booking:', data.booking_id);
        return true;

    } catch (error) {
        console.error('[Partner Sync] Error:', error);
        return false;
    }
}
