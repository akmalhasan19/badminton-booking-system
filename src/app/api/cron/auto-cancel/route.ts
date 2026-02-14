import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { createBookingEventNotification } from '@/lib/notifications/service';
import { timingSafeEqual } from 'node:crypto';

export const dynamic = 'force-dynamic';

function getBearerToken(request: Request) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader) {
        return null;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
        return null;
    }

    return token.trim();
}

function safeTokenMatch(candidate: string, expected: string) {
    const candidateBuffer = Buffer.from(candidate);
    const expectedBuffer = Buffer.from(expected);

    if (candidateBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return timingSafeEqual(candidateBuffer, expectedBuffer);
}

export async function GET(request: Request) {
    try {
        const cronSecret = process.env.CRON_SECRET?.trim();
        if (!cronSecret) {
            logger.error('CRON_SECRET is not configured. Auto-cancel cron execution denied.');
            return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
        }

        const bearerToken = getBearerToken(request);
        if (!bearerToken || !safeTokenMatch(bearerToken, cronSecret)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServiceClient();

        // 15 minutes ago
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

        // Update pending bookings older than 15 minutes (single round-trip)
        const { data: bookings, error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('status', 'pending')
            .lt('created_at', fifteenMinutesAgo)
            .select('id, user_id, booking_date, start_time, venue_name, court_name');

        if (error) {
            logger.error({ error }, 'Error updating expired bookings');
            return NextResponse.json({ error: 'Failed to process expired bookings' }, { status: 500 });
        }

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ message: 'No expired bookings found', count: 0 });
        }

        await Promise.all(
            bookings.map((booking) =>
                createBookingEventNotification({
                    type: 'booking_cancelled',
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

        return NextResponse.json({
            message: 'Successfully cancelled expired bookings',
            count: bookings.length
        });

    } catch (error) {
        logger.error({ error }, 'Unexpected error in auto-cancel cron');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
