import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'
import { calculateBookingPrice, validateOperationalHours } from '@/lib/api/bookings'

export async function POST(request: Request) {
    // 0. Rate Limiting
    // We use a simplified IP check here. In production with a proxy this might need 'x-forwarded-for' parsing.
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { ratelimit } = await import('@/lib/rate-limit')
        const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
        const { success, limit, reset, remaining } = await ratelimit.limit(ip)

        if (!success) {
            return NextResponse.json(
                { error: "Too Many Requests" },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString()
                    }
                }
            )
        }
    }

    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { courtId, bookingDate, startTime, duration, customerName, phone } = body

        if (!courtId || !bookingDate || !startTime || !duration || !customerName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = createServiceClient()

        // 1. Validate Operational Hours
        const opsCheck = await validateOperationalHours(supabase, bookingDate, startTime, duration)
        if (!opsCheck.isValid) {
            return NextResponse.json({ error: opsCheck.error }, { status: 400 })
        }

        // 2. Calculate Price Correctly
        const priceCalc = await calculateBookingPrice(supabase, courtId, bookingDate, duration)
        if (priceCalc.error) {
            return NextResponse.json({ error: priceCalc.error }, { status: 400 })
        }

        // Calculate end_time based on duration
        const [hours, minutes] = startTime.split(':').map(Number)
        const endHours = hours + duration
        const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

        // 3. Insert Booking
        const bookingPayload = {
            court_id: courtId,
            booking_date: bookingDate,
            start_time: startTime,
            end_time: endTime,
            duration_hours: duration, // DB column might be duration_hours
            total_price: priceCalc.price,
            status: 'pending',
            notes: `External Booking: ${customerName} (${phone || 'No phone'})`
        }

        // We need a user_id. Let's fetch one integration user or just the first user found to attach it to.
        const { data: users } = await supabase.from('users').select('id').limit(1)
        if (users && users.length > 0) {
            Object.assign(bookingPayload, { user_id: users[0].id })
        } else {
            // Fallback if no users exist (unlikely in prod but possible in fresh dev db)
            // We can tries to create a system user, or fail.
        }

        const { data, error } = await supabase
            .from('bookings')
            .insert(bookingPayload)
            .select()
            .single()

        if (error) {
            console.error('Booking Creation Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data
        })

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
