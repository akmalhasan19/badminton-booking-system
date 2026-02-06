import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

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
        const body = await request.json()
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
