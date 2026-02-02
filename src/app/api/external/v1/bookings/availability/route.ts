import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const venueId = searchParams.get('venueId') // Optional if we only have one venue

    if (!date) {
        return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Get all courts first
    const { data: courts, error: courtsError } = await supabase
        .from('courts')
        .select('id, name, court_number')
        .eq('is_active', true)

    if (courtsError) {
        return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 })
    }

    // 2. Get bookings for that date
    // Note: status 'cancelled' should be ignored. 'pending' often blocks the slot too.
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('court_id, start_time, duration')
        .eq('booking_date', date)
        .neq('status', 'cancelled')

    if (bookingsError) {
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    // 3. Map occupied slots
    const occupied = bookings.map((b: any) => ({
        courtId: b.court_id,
        startTime: b.start_time,
        duration: b.duration
    }))

    return NextResponse.json({
        data: {
            date,
            venueId: venueId || 'default',
            courts,
            occupied
        },
        meta: {
            count: occupied.length
        }
    })
}
