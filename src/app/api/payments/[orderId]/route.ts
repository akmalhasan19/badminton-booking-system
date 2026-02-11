import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrderPaymentStatus } from '@/lib/payments/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { orderId } = await params
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, status')
    .eq('id', orderId)
    .maybeSingle()

  if (bookingError) {
    return NextResponse.json({ error: `Failed to fetch order: ${bookingError.message}` }, { status: 500 })
  }

  if (!booking) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const url = new URL(request.url)
    const syncFromProvider = url.searchParams.get('sync') === 'true'
    const status = await getOrderPaymentStatus(orderId, { syncFromProvider })

    return NextResponse.json({
      orderId: status.orderId,
      orderStatus: status.orderStatus,
      payment: {
        status: status.paymentStatus,
        providerStatus: status.providerStatus,
        paymentRequestId: status.paymentRequestId,
        referenceId: status.referenceId,
        channelCode: status.channelCode,
        amount: status.amount,
        currency: status.currency,
        actions: status.actions,
        expiresAt: status.expiresAt,
        updatedAt: status.updatedAt,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to get payment status: ${errorMessage}` }, { status: 500 })
  }
}
