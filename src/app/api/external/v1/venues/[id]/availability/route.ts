import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
        return NextResponse.json({ error: 'Date parameter is required (YYYY-MM-DD)' }, { status: 400 })
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const supabase = createServiceClient()

    // 1. Get all active courts for this venue
    const { data: courts, error: courtsError } = await supabase
        .from('courts')
        .select('id, name, court_number')
        .eq('venue_id', id)
        .eq('is_active', true)

    if (courtsError) {
        return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 })
    }

    // 2. Get bookings for that date
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('court_id, start_time, duration, status') // duration might need conversion if it's interval
        .eq('booking_date', date)
        .neq('status', 'cancelled')
    // Filter by courts belonging to this venue implicitly via bookings logic, usually bookings are tied to courts which are tied to venues

    if (bookingsError) {
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    // Filter bookings only for the courts we found (sanity check, though logic should follow DB FK)
    const courtIds = new Set(courts.map(c => c.id))
    const relevantBookings = bookings.filter(b => courtIds.has(b.court_id))

    // 3. Map occupied slots
    const occupied = relevantBookings.map((b: any) => ({
        court_id: b.court_id,
        start_time: b.start_time,
        duration_hours: b.duration // Assuming duration is stored as integer hours or needs conversion. 
        // If stored as interval/string, parse it. 
        // Plan says "duration_hours" for response.
    }))

    return NextResponse.json({
        data: {
            venue_id: id,
            date,
            courts: courts.map(c => ({
                id: c.id,
                name: c.name,
                court_number: c.court_number
            })),
            occupied
        },
        meta: {
            count: occupied.length
        }
    })
}
