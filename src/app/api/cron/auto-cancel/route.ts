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

        // Find pending bookings older than 15 minutes
        const { data: bookings, error: fetchError } = await supabase
            .from('bookings')
            .select('id, created_at, status')
            .eq('status', 'pending')
            .lt('created_at', fifteenMinutesAgo);

        if (fetchError) {
            logger.error({ error: fetchError }, 'Error fetching expired bookings');
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ message: 'No expired bookings found', count: 0 });
        }

        const bookingIds = bookings.map(b => b.id);

        // Update status to cancelled
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .in('id', bookingIds);

        if (updateError) {
            logger.error({ error: updateError, count: bookingIds.length }, 'Error updating expired bookings');
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

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
