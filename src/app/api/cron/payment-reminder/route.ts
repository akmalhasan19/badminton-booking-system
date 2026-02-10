import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { createBookingEventNotification } from '@/lib/notifications/service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers.get('authorization');

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServiceClient();
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('id, user_id, booking_date, start_time, venue_name, court_name')
            .eq('status', 'pending')
            .lt('created_at', tenMinutesAgo);

        if (error) {
            logger.error({ error }, 'Error fetching pending bookings for payment reminder');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({
                message: 'No pending bookings eligible for reminder',
                count: 0
            });
        }

        const results = await Promise.all(
            bookings.map((booking) =>
                createBookingEventNotification({
                    type: 'payment_reminder',
                    booking: {
                        id: booking.id,
                        user_id: booking.user_id,
                        booking_date: booking.booking_date,
                        start_time: booking.start_time,
                        venue_name: booking.venue_name,
                        court_name: booking.court_name
                    },
                    supabase
                })
            )
        );

        const createdCount = results.filter(result => result.success && !result.skipped).length;

        return NextResponse.json({
            message: 'Payment reminder cron executed',
            scanned: bookings.length,
            created: createdCount
        });

    } catch (error) {
        logger.error({ error }, 'Unexpected error in payment reminder cron');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
