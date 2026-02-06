// lib/partner-sync.ts
import crypto from 'crypto';

const SYNC_URL = process.env.SMASHPARTNER_SYNC_URL || 'https://smashpartner.online/api/webhooks/pwa-sync';
const SECRET = process.env.PWA_WEBHOOK_SECRET || '';

interface SyncPayload {
    event: 'booking.paid';
    booking_id: string;
    venue_id: string;
    status: 'LUNAS' | 'DP' | 'BELUM_BAYAR';  // CRITICAL: Partner requires this
    payment_status: 'PAID';
    total_amount: number;
    paid_amount: number;
    payment_method: string;
    customer_name: string;
    customer_phone?: string;
    items?: Array<{ name: string }>;
    payment_details?: {
        xendit_transaction_id?: string;
        xendit_fee?: number;
        platform_fee?: number;
        total_fees?: number;
    };
    timestamp?: string;  // ALWAYS included for audit trail
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
            // TEMPORARY: Commented out to prevent 500 Error (Missing column in Partner DB)
            // items: data.items,
            // payment_details: data.payment_details, 
            timestamp: new Date().toISOString()  // ALWAYS include for audit trail
        };

        // Remove these keys explicitly if they exist in `data` to be safe
        delete payload.payment_details;
        delete payload.items;

        const payloadString = JSON.stringify(payload);
        const signature = generateSignature(payloadString);

        console.log(`[Partner Sync] Initiating sync to: ${SYNC_URL}`);
        console.log(`[Partner Sync] Booking: ${data.booking_id}, Venue: ${data.venue_id}, Status: ${data.status}`);
        console.log(`[Partner Sync] Amount: ${data.paid_amount}, Timestamp: ${payload.timestamp}`);

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
