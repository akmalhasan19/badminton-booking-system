import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentRequestForOrder } from '@/lib/payments/service'
import { parseJsonBodyWithLimit } from '@/lib/security/request-body'

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

const normalizeChannelCode = (value: unknown) => (typeof value === 'string' ? value.trim().toUpperCase() : '')
const MAX_PAYMENT_INITIATE_BODY_BYTES = Number(process.env.MAX_PAYMENT_INITIATE_BODY_BYTES || 16 * 1024)

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (process.env.FEATURE_XENDIT_V3_PAYMENTS === 'false') {
    return NextResponse.json({ error: 'Xendit v3 payment feature is disabled' }, { status: 503 })
  }

  const parsedBody = await parseJsonBodyWithLimit<{
    orderId?: unknown
    amount?: unknown
    channelCode?: unknown
    country?: unknown
    currency?: unknown
    channelProperties?: unknown
  }>(request, {
    maxBytes: MAX_PAYMENT_INITIATE_BODY_BYTES,
  })
  if (!parsedBody.ok) {
    return parsedBody.response
  }

  const body = parsedBody.data

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
  const channelCode = normalizeChannelCode(body.channelCode)

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  if (!channelCode) {
    return NextResponse.json({ error: 'channelCode is required' }, { status: 400 })
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, total_price, venue_name, court_name')
    .eq('id', orderId)
    .maybeSingle()

  if (bookingError) {
    return NextResponse.json({ error: `Failed to fetch booking: ${bookingError.message}` }, { status: 500 })
  }

  if (!booking) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const amount = isPositiveNumber(body.amount) ? body.amount : Number(booking.total_price)
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
  }

  const country = typeof body.country === 'string' ? body.country.trim().toUpperCase() : undefined
  const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : undefined
  const channelProperties =
    typeof body.channelProperties === 'object' && body.channelProperties !== null
      ? (body.channelProperties as Record<string, unknown>)
      : undefined

  try {
    const result = await createPaymentRequestForOrder({
      orderId,
      amount,
      channelCode,
      country,
      currency,
      channelProperties,
      description: `Booking ${booking.venue_name || 'Venue'} - ${booking.court_name || 'Court'}`,
      metadata: {
        initiated_by: user.id,
      },
    })

    return NextResponse.json({
      paymentRequestId: result.paymentRequestId,
      referenceId: result.referenceId,
      status: result.status,
      actions: result.actions,
      expiresAt: result.expiresAt,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to initiate payment: ${errorMessage}` }, { status: 500 })
  }
}
