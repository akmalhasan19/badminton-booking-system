import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const supabase = createServiceClient();

        // 15 minutes ago
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

        // Check for header authorization for cron (optional but recommended)
        const authHeader = req.headers.get('authorization');
        // In Vercel Cron, the request comes from an authorized source. 
        // You might want to add a CRON_SECRET check here if strictly needed.

        // Update pending bookings older than 15 minutes (single round-trip)
        const { data: bookings, error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('status', 'pending')
            .lt('created_at', fifteenMinutesAgo)
            .select('id');

        if (error) {
            logger.error({ error }, 'Error updating expired bookings');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ message: 'No expired bookings found', count: 0 });
        }

        const bookingIds = bookings.map(b => b.id);

        return NextResponse.json({
            message: 'Successfully cancelled expired bookings',
            count: bookingIds.length,
            ids: bookingIds
        });

    } catch (error) {
        logger.error({ error }, 'Unexpected error in auto-cancel cron');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
