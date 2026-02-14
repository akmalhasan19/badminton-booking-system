import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createBookingEventNotification } from '@/lib/notifications/service'
import { parseJsonBodyWithLimit } from '@/lib/security/request-body'

const MAX_EXTERNAL_PAYMENT_UPDATE_BODY_BYTES = Number(process.env.MAX_EXTERNAL_PAYMENT_UPDATE_BODY_BYTES || 8 * 1024)

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    try {
        const parsedBody = await parseJsonBodyWithLimit<Record<string, unknown>>(request, {
            maxBytes: MAX_EXTERNAL_PAYMENT_UPDATE_BODY_BYTES
        })
        if (!parsedBody.ok) {
            return parsedBody.response
        }

        const body = parsedBody.data
        const { status } = body

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 })
        }

        // Map external status to internal status
        // Guide says: "LUNAS", "DP", "BELUM_BAYAR", "pending", "cancelled"
        // Internal: 'pending' | 'confirmed' | 'cancelled' | 'completed'

        let internalStatus = 'pending'

        switch (status) {
            case 'LUNAS':
            case 'confirmed':
            case 'completed':
                internalStatus = 'confirmed'
                break
            case 'cancelled':
                internalStatus = 'cancelled'
                break
            case 'pending':
                internalStatus = 'pending'
                break
            case 'DP': // Treating DP as pending or confirmed? Usually DP confirms the slot.
                internalStatus = 'confirmed'
                break
            default:
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const supabase = createServiceClient()

        // Update the booking
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: internalStatus })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            logger.error({ bookingId: id, error }, 'Error updating booking')
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (internalStatus === 'confirmed' || internalStatus === 'cancelled') {
            await createBookingEventNotification({
                type: internalStatus === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
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
        }

        return NextResponse.json({
            success: true,
            message: `Booking ${id} status updated to ${status} (internal: ${internalStatus})`,
            data
        })

    } catch (error) {
        logger.error({ error, bookingId: id }, 'API Error')
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
