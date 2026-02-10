import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'
import { createBookingEventNotification } from '@/lib/notifications/service'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const supabase = createServiceClient()

    const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
            *,
            court:courts (
                id,
                name,
                venue:venues (
                    id,
                    name
                )
            )
        `)
        .eq('id', id)
        .single()

    if (error) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ data: booking })
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const supabase = createServiceClient()

    // Soft delete or status update 'cancelled'
    const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select('id, status, user_id, booking_date, start_time, venue_name, court_name')
        .single()

    if (error) {
        return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
    }

    await createBookingEventNotification({
        type: 'booking_cancelled',
        booking: {
            id: data.id,
            user_id: data.user_id,
            booking_date: data.booking_date,
            start_time: data.start_time,
            venue_name: data.venue_name,
            court_name: data.court_name
        },
        supabase
    })

    return NextResponse.json({
        message: 'Booking cancelled successfully',
        data: {
            id: data.id,
            status: data.status
        }
    })
}
