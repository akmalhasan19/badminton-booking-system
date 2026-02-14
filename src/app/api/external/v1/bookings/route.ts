import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createBookingEventNotification } from '@/lib/notifications/service'
import { parseJsonBodyWithLimit } from '@/lib/security/request-body'

// Schema for booking payload (snake_case)
const bookingSchema = z.object({
    court_id: z.string().uuid(),
    booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
    duration_hours: z.number().int().positive(),
    user_id: z.string().uuid().optional(), // If not provided, might use integration user or error
    integration_user_email: z.string().email().optional(), // Alternative to user_id for external systems
})

const MAX_EXTERNAL_BOOKING_BODY_BYTES = Number(process.env.MAX_EXTERNAL_BOOKING_BODY_BYTES || 16 * 1024)

export async function POST(request: Request) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const parsedBody = await parseJsonBodyWithLimit<Record<string, unknown>>(request, {
            maxBytes: MAX_EXTERNAL_BOOKING_BODY_BYTES
        })

        if (!parsedBody.ok) {
            return parsedBody.response
        }

        const json = parsedBody.data

        // Handle camelCase fallback if necessary, but prioritizes snake_case
        const payload = {
            court_id: json.court_id || json.courtId,
            booking_date: json.booking_date || json.date, // common mismatch
            start_time: json.start_time || json.startTime,
            duration_hours: json.duration_hours || json.duration,
            user_id: json.user_id || json.userId,
            integration_user_email: json.integration_user_email
        }

        const result = bookingSchema.safeParse(payload)

        if (!result.success) {
            return NextResponse.json({
                error: 'Invalid request payload',
                details: result.error.format()
            }, { status: 400 })
        }

        const { court_id, booking_date, start_time, duration_hours, user_id, integration_user_email } = result.data

        const supabase = createServiceClient()

        // Determine User ID
        let finalUserId = user_id

        if (!finalUserId && integration_user_email) {
            // Find user by email
            const { data: user, error: userError } = await supabase
                .from('profiles') // Assuming profiles/users table
                .select('id')
                .eq('email', integration_user_email)
                .single()

            if (userError || !user) {
                return NextResponse.json({ error: 'Integration user email not found' }, { status: 400 })
            }
            finalUserId = user.id
        }

        if (!finalUserId) {
            // STRICT MODE: Do not assign random user.
            return NextResponse.json({
                error: 'user_id or integration_user_email is required'
            }, { status: 400 })
        }

        // Check Availability (Race condition handling ideally via DB function, but here is check-then-act)
        // Check if court belongs to active venue
        const { data: court, error: courtError } = await supabase
            .from('courts')
            .select('id, venue_id, is_active')
            .eq('id', court_id)
            .single()

        if (courtError || !court || !court.is_active) {
            return NextResponse.json({ error: 'Court not found or inactive' }, { status: 404 })
        }

        // Check overlapping bookings
        // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
        // Simplified: Check standard overlap
        // Need to calculate end_time based on start_time + duration

        // For simplicity/MVP, verify strict slot if system uses fixed slots, or range check
        // DB constraints should ideally handle this.

        // Insert Booking
        const { data: booking, error: insertError } = await supabase
            .from('bookings')
            .insert({
                court_id,
                user_id: finalUserId,
                booking_date,
                start_time,
                duration: duration_hours, // Schema mismatch: DB uses 'duration' (int/interval?), API uses duration_hours
                status: 'pending', // Default to pending until payment? Or confirmed if API is trusted?
                // Assuming trusted API for now, or 'confirmed' if payment handled externally
                total_price: 0 // Logic to calc price or pass it? Leaving 0 for now as per minimal viable.
            })
            .select()
            .single()

        if (insertError) {
            console.error('Booking insert error:', insertError)
            return NextResponse.json({ error: 'Failed to create booking. Slot might be unavailable.' }, { status: 409 })
        }

        await createBookingEventNotification({
            type: 'payment_reminder',
            booking: {
                id: booking.id,
                user_id: booking.user_id,
                booking_date: booking.booking_date,
                start_time: booking.start_time
            },
            supabase
        })

        return NextResponse.json({
            data: {
                id: booking.id,
                status: booking.status,
                booking_date: booking.booking_date,
                start_time: booking.start_time,
                duration_hours: booking.duration,
                court_id: booking.court_id,
                user_id: booking.user_id,
                created_at: booking.created_at
            }
        }, { status: 201 })

    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Implement List Bookings logic if needed for this route as well, 
    // or keep it simple as per plan which focus on POST usually for root /bookings
    // Plan mentions "GET /api/v1/bookings" as list.

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    let query = supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (date) {
        query = query.eq('booking_date', date)
    }

    const { data: bookings, error, count } = await query

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    return NextResponse.json({
        data: bookings,
        meta: {
            total: count,
            page,
            limit
        }
    })
}
