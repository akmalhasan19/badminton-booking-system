import { createServiceClient } from '@/lib/supabase/server'
import { calculateBookingPrice, validateOperationalHours } from '@/lib/api/bookings'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createServiceClient()
    const results = []

    // 1. Fetch a court
    const { data: courts } = await supabase.from('courts').select('id, name').limit(1)
    if (!courts || courts.length === 0) {
        return NextResponse.json({ error: 'No courts found' })
    }
    const court = courts[0]
    results.push(`Testing with court: ${court.name}`)

    // 2. Test Pricing
    // Feb 4 2026 = Wednesday, Feb 7 2026 = Saturday
    const validPrice = await calculateBookingPrice(supabase, court.id, '2026-02-04', 1)
    results.push(`Weekday Price (1h): ${validPrice.price} (Error: ${validPrice.error})`)

    const weekendPrice = await calculateBookingPrice(supabase, court.id, '2026-02-07', 2)
    results.push(`Weekend Price (2h): ${weekendPrice.price} (Error: ${weekendPrice.error})`)

    // 3. Test Ops Hours
    const validTime = await validateOperationalHours(supabase, '2026-02-04', '10:00', 1)
    results.push(`10:00 OK? ${validTime.isValid} (${validTime.error})`)

    const tooEarly = await validateOperationalHours(supabase, '2026-02-04', '06:00', 1)
    results.push(`06:00 OK? ${tooEarly.isValid} (${tooEarly.error})`)

    return NextResponse.json({ results })
}
