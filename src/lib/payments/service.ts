import { createBookingEventNotification } from '@/lib/notifications/service'
import { syncBookingToPartner } from '@/lib/partner-sync'
import { createServiceClient } from '@/lib/supabase/server'
import {
  createPaymentRequest,
  CreatePaymentRequestPayload,
  getPaymentRequest,
} from '@/lib/xendit/xendit-client'
import { logger } from '@/lib/logger'

export type InternalPaymentStatus = 'PENDING_USER_ACTION' | 'PAID' | 'FAILED' | 'EXPIRED'

export type NormalizedPaymentAction = {
  type: string
  descriptor: string | null
  value: string
}

export type InitiateOrderPaymentInput = {
  orderId: string
  amount: number
  channelCode: string
  currency?: string
  country?: string
  description?: string
  channelProperties?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export type InitiateOrderPaymentResult = {
  orderId: string
  paymentRequestId: string
  referenceId: string
  status: InternalPaymentStatus
  providerStatus: string
  actions: NormalizedPaymentAction[]
  expiresAt: string | null
}

type BookingForPayment = {
  id: string
  status: string
  user_id: string
  venue_id: string | null
  venue_name: string | null
  court_name: string | null
  booking_date: string | null
  start_time: string | null
  net_venue_price: number | null
  users?: {
    full_name?: string | null
    phone?: string | null
  } | null
}

type PaymentWebhookEvent = {
  eventType: string | null
  providerEventId: string | null
  webhookId: string | null
  paymentRequestId: string | null
  referenceId: string | null
  providerStatus: string
  internalStatus: InternalPaymentStatus
  amount: number | null
  channelCode: string | null
  dedupeKey: string
}

const TERMINAL_PAYMENT_STATUSES = new Set<InternalPaymentStatus>(['PAID', 'FAILED', 'EXPIRED'])
const REDIRECT_ACTION_TYPE = 'REDIRECT_CUSTOMER'

const str = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const num = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getRecord = (value: unknown): Record<string, unknown> | null => (isRecord(value) ? value : null)

const toIsoStringOrNull = (value: unknown): string | null => {
  const text = str(value)
  if (!text) return null

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const actionValueToString = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const parseActions = (actions: unknown): NormalizedPaymentAction[] => {
  if (!Array.isArray(actions)) return []

  return actions
    .map((action): NormalizedPaymentAction | null => {
      if (!isRecord(action)) return null
      const type = str(action.type) || 'UNKNOWN'
      const descriptor = str(action.descriptor)
      const value = actionValueToString(action.value)
      return { type, descriptor, value }
    })
    .filter((action): action is NormalizedPaymentAction => Boolean(action && action.value))
}

const getRedirectUrl = (actions: NormalizedPaymentAction[]): string | null => {
  const redirectAction = actions.find((action) => action.type === REDIRECT_ACTION_TYPE)
  return redirectAction?.value || null
}

const buildReferenceId = (orderId: string) => `booking_${orderId}`

export const parseOrderIdFromReference = (referenceId: string): string => {
  if (referenceId.startsWith('booking_')) {
    return referenceId.replace('booking_', '')
  }
  return referenceId
}

export function mapXenditStatusToInternal(status: string): InternalPaymentStatus {
  const normalized = status.toUpperCase()

  if (normalized === 'REQUIRES_ACTION' || normalized === 'PENDING') {
    return 'PENDING_USER_ACTION'
  }

  if (normalized === 'SUCCEEDED' || normalized === 'COMPLETED' || normalized === 'PAID' || normalized === 'SETTLED') {
    return 'PAID'
  }

  if (normalized === 'FAILED' || normalized === 'CANCELLED' || normalized === 'CANCELED') {
    return 'FAILED'
  }

  if (normalized === 'EXPIRED') {
    return 'EXPIRED'
  }

  return 'PENDING_USER_ACTION'
}

const getAppUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const buildDefaultChannelProperties = (orderId: string): Record<string, unknown> => {
  const appUrl = getAppUrl()

  return {
    success_return_url: `${appUrl}/bookings/history?payment=success&booking_id=${orderId}`,
    failure_return_url: `${appUrl}/bookings/history?payment=failed&booking_id=${orderId}`,
  }
}

const getPaymentChannelCode = (channelCode?: string | null): string =>
  channelCode || process.env.XENDIT_DEFAULT_CHANNEL_CODE || 'QRIS'

const getCountry = (country?: string) => country || process.env.XENDIT_COUNTRY || 'ID'
const getCurrency = (currency?: string) => currency || process.env.XENDIT_CURRENCY || 'IDR'

export async function createPaymentRequestForOrder(input: InitiateOrderPaymentInput): Promise<InitiateOrderPaymentResult> {
  const supabase = createServiceClient()

  const referenceId = buildReferenceId(input.orderId)
  const channelCode = getPaymentChannelCode(input.channelCode)
  const country = getCountry(input.country)
  const currency = getCurrency(input.currency)

  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from('payments')
    .select('payment_request_id, reference_id, status, provider_status, actions_json, expires_at')
    .eq('order_id', input.orderId)
    .maybeSingle()

  if (existingPaymentError) {
    logger.error(
      { existingPaymentError, orderId: input.orderId },
      '[Payments] failed checking existing payment'
    )
    throw new Error(`Failed checking existing payment: ${existingPaymentError.message}`)
  }

  if (
    existingPayment?.payment_request_id &&
    existingPayment.status &&
    !TERMINAL_PAYMENT_STATUSES.has(existingPayment.status as InternalPaymentStatus)
  ) {
    return {
      orderId: input.orderId,
      paymentRequestId: existingPayment.payment_request_id,
      referenceId: existingPayment.reference_id || referenceId,
      status: existingPayment.status as InternalPaymentStatus,
      providerStatus: existingPayment.provider_status || 'REQUIRES_ACTION',
      actions: parseActions(existingPayment.actions_json),
      expiresAt: toIsoStringOrNull(existingPayment.expires_at),
    }
  }

  const payload: CreatePaymentRequestPayload = {
    reference_id: referenceId,
    type: 'PAY',
    country,
    currency,
    request_amount: input.amount,
    channel_code: channelCode,
    channel_properties: {
      ...buildDefaultChannelProperties(input.orderId),
      ...(input.channelProperties || {}),
    },
    description: input.description,
    metadata: {
      order_id: input.orderId,
      ...(input.metadata || {}),
    },
  }

  const paymentRequest = await createPaymentRequest(payload)
  const providerStatus = str(paymentRequest.status) || 'REQUIRES_ACTION'
  const status = mapXenditStatusToInternal(providerStatus)
  const actions = parseActions(paymentRequest.actions)
  const expiresAt = toIsoStringOrNull(paymentRequest.expires_at)
  const paymentRequestId = paymentRequest.id
  const redirectUrl = getRedirectUrl(actions)

  const { error: paymentError } = await supabase
    .from('payments')
    .upsert(
      {
        order_id: input.orderId,
        provider: 'xendit',
        reference_id: referenceId,
        payment_request_id: paymentRequestId,
        channel_code: channelCode,
        amount: input.amount,
        currency,
        status,
        provider_status: providerStatus,
        actions_json: actions,
        expires_at: expiresAt,
      },
      { onConflict: 'order_id' }
    )

  if (paymentError) {
    logger.error({ paymentError, orderId: input.orderId, referenceId }, '[Payments] failed to upsert payment row')
    throw new Error(`Failed to save payment: ${paymentError.message}`)
  }

  const bookingUpdatePayload: Record<string, unknown> = {
    payment_state: status,
    payment_method: channelCode,
  }

  if (redirectUrl) {
    bookingUpdatePayload.payment_url = redirectUrl
  }

  const { error: bookingError } = await supabase
    .from('bookings')
    .update(bookingUpdatePayload)
    .eq('id', input.orderId)

  if (bookingError) {
    logger.error({ bookingError, orderId: input.orderId }, '[Payments] failed to update booking payment metadata')
    throw new Error(`Failed to update booking payment metadata: ${bookingError.message}`)
  }

  return {
    orderId: input.orderId,
    paymentRequestId,
    referenceId,
    status,
    providerStatus,
    actions,
    expiresAt,
  }
}

async function getBookingForPayment(orderId: string): Promise<BookingForPayment | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, user_id, venue_id, venue_name, court_name, booking_date, start_time, net_venue_price, users ( full_name, phone )')
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    logger.error({ error, orderId }, '[Payments] failed to fetch booking')
    return null
  }

  return (data as BookingForPayment | null) ?? null
}

export async function getPaymentRequestStatus(paymentRequestId: string) {
  const paymentRequest = await getPaymentRequest(paymentRequestId)
  const providerStatus = str(paymentRequest.status) || 'REQUIRES_ACTION'
  const status = mapXenditStatusToInternal(providerStatus)
  const actions = parseActions(paymentRequest.actions)
  const expiresAt = toIsoStringOrNull(paymentRequest.expires_at)

  return {
    paymentRequestId,
    status,
    providerStatus,
    actions,
    expiresAt,
    channelCode: str(paymentRequest.channel_code),
    referenceId: str(paymentRequest.reference_id),
    requestAmount: num(paymentRequest.request_amount),
  }
}

export async function applyPaymentStateTransition(params: {
  orderId: string
  status: InternalPaymentStatus
  providerStatus: string
  paymentRequestId?: string | null
  referenceId?: string | null
  channelCode?: string | null
  actions?: NormalizedPaymentAction[]
  amount?: number | null
  expiresAt?: string | null
}): Promise<void> {
  const supabase = createServiceClient()

  const booking = await getBookingForPayment(params.orderId)
  if (!booking) {
    logger.warn({ orderId: params.orderId }, '[Payments] booking not found during state transition')
    return
  }

  const paymentUpdatePayload: Record<string, unknown> = {
    status: params.status,
    provider_status: params.providerStatus,
  }

  if (params.channelCode) paymentUpdatePayload.channel_code = params.channelCode
  if (params.actions) paymentUpdatePayload.actions_json = params.actions
  if (params.expiresAt !== undefined) paymentUpdatePayload.expires_at = params.expiresAt

  if (params.paymentRequestId) {
    const paymentUpsertPayload: Record<string, unknown> = {
      order_id: params.orderId,
      provider: 'xendit',
      reference_id: params.referenceId || buildReferenceId(params.orderId),
      payment_request_id: params.paymentRequestId,
      amount: params.amount ?? 0,
      currency: getCurrency(),
      ...paymentUpdatePayload,
    }

    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .upsert(paymentUpsertPayload, { onConflict: 'order_id' })

    if (paymentUpdateError) {
      logger.error({ paymentUpdateError, params }, '[Payments] failed updating payment by payment_request_id')
    }
  }

  const bookingUpdate: Record<string, unknown> = {
    payment_state: params.status,
  }

  if (params.channelCode) {
    bookingUpdate.payment_method = params.channelCode
  }

  if (params.actions) {
    const redirectUrl = getRedirectUrl(params.actions)
    if (redirectUrl) {
      bookingUpdate.payment_url = redirectUrl
    }
  }

  if (params.status === 'PAID') {
    bookingUpdate.status = 'confirmed'
  }

  if (params.status === 'FAILED' || params.status === 'EXPIRED') {
    bookingUpdate.status = 'cancelled'
  }

  const { error: bookingUpdateError } = await supabase
    .from('bookings')
    .update(bookingUpdate)
    .eq('id', params.orderId)

  if (bookingUpdateError) {
    logger.error({ bookingUpdateError, params }, '[Payments] failed to update booking payment state')
    return
  }

  if (params.status === 'PAID' && booking.status !== 'confirmed') {
    await createBookingEventNotification({
      type: 'booking_confirmed',
      booking: {
        id: booking.id,
        user_id: booking.user_id,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        venue_name: booking.venue_name,
        court_name: booking.court_name,
      },
      supabase,
    })

    if (booking.venue_id) {
      const totalAmount = params.amount ?? 0
      const revenue = booking.net_venue_price ?? totalAmount

      await syncBookingToPartner({
        event: 'booking.paid',
        booking_id: booking.id,
        venue_id: booking.venue_id,
        status: 'LUNAS',
        payment_status: 'PAID',
        total_amount: totalAmount,
        paid_amount: revenue,
        payment_method: params.channelCode || 'XENDIT',
        customer_name: booking.users?.full_name || 'PWA User',
        customer_phone: booking.users?.phone || undefined,
      })
    }
  }

  if ((params.status === 'FAILED' || params.status === 'EXPIRED') && booking.status !== 'cancelled') {
    await createBookingEventNotification({
      type: 'booking_cancelled',
      booking: {
        id: booking.id,
        user_id: booking.user_id,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        venue_name: booking.venue_name,
        court_name: booking.court_name,
      },
      supabase,
    })
  }
}

export async function getOrderPaymentStatus(orderId: string, options?: { syncFromProvider?: boolean }) {
  const supabase = createServiceClient()

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, payment_state')
    .eq('id', orderId)
    .maybeSingle()

  if (bookingError) {
    throw new Error(`Failed to fetch booking: ${bookingError.message}`)
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('order_id, reference_id, payment_request_id, status, provider_status, actions_json, expires_at, channel_code, amount, currency, updated_at')
    .eq('order_id', orderId)
    .maybeSingle()

  if (paymentError) {
    throw new Error(`Failed to fetch payment: ${paymentError.message}`)
  }

  let paymentRow = payment

  if (
    options?.syncFromProvider &&
    paymentRow?.payment_request_id &&
    !TERMINAL_PAYMENT_STATUSES.has((paymentRow.status as InternalPaymentStatus) || 'PENDING_USER_ACTION')
  ) {
    try {
      const providerSnapshot = await getPaymentRequestStatus(paymentRow.payment_request_id)

      await applyPaymentStateTransition({
        orderId,
        status: providerSnapshot.status,
        providerStatus: providerSnapshot.providerStatus,
        paymentRequestId: paymentRow.payment_request_id,
        referenceId: providerSnapshot.referenceId,
        channelCode: providerSnapshot.channelCode,
        actions: providerSnapshot.actions,
        amount: providerSnapshot.requestAmount,
        expiresAt: providerSnapshot.expiresAt,
      })

      const { data: refreshedPayment } = await supabase
        .from('payments')
        .select('order_id, reference_id, payment_request_id, status, provider_status, actions_json, expires_at, channel_code, amount, currency, updated_at')
        .eq('order_id', orderId)
        .maybeSingle()

      paymentRow = refreshedPayment
    } catch (error) {
      logger.error({ error, orderId }, '[Payments] failed to sync payment status from provider')
    }
  }

  return {
    orderId,
    orderStatus: booking?.status || null,
    paymentStatus: paymentRow?.status || booking?.payment_state || null,
    providerStatus: paymentRow?.provider_status || null,
    paymentRequestId: paymentRow?.payment_request_id || null,
    referenceId: paymentRow?.reference_id || null,
    channelCode: paymentRow?.channel_code || null,
    amount: paymentRow?.amount || null,
    currency: paymentRow?.currency || null,
    actions: parseActions(paymentRow?.actions_json),
    expiresAt: toIsoStringOrNull(paymentRow?.expires_at),
    updatedAt: toIsoStringOrNull(paymentRow?.updated_at),
  }
}

export function normalizeWebhookEvent(payload: unknown, headers: Headers): PaymentWebhookEvent {
  const body = getRecord(payload) || {}

  const captureValue = getRecord(getRecord(body.paymentCapture)?.value)
  const authorizationValue = getRecord(getRecord(body.paymentAuthorization)?.value)
  const failureValue = getRecord(getRecord(body.paymentFailure)?.value)

  const nestedData =
    getRecord(body.data) ||
    getRecord(captureValue?.data) ||
    getRecord(authorizationValue?.data) ||
    getRecord(failureValue?.data) ||
    body

  const providerStatus =
    str(nestedData.status) ||
    str(captureValue?.status) ||
    str(authorizationValue?.status) ||
    str(failureValue?.status) ||
    str(body.status) ||
    'REQUIRES_ACTION'

  const paymentRequestId = str(nestedData.payment_request_id) || str(body.payment_request_id)
  const referenceId = str(nestedData.reference_id) || str(nestedData.external_id) || str(body.reference_id) || str(body.external_id)

  const headerWebhookId =
    str(headers.get('x-webhook-id')) ||
    str(headers.get('webhook-id')) ||
    str(headers.get('x-callback-id')) ||
    str(headers.get('x-callback-idempotency-key'))

  const webhookId = headerWebhookId || str(body.id)
  const providerEventId = str(nestedData.payment_id) || str(body.event_id)

  const eventType = str(body.event) || str(captureValue?.event) || str(authorizationValue?.event) || str(failureValue?.event)

  const internalStatus = mapXenditStatusToInternal(providerStatus)
  const amount = num(nestedData.request_amount) || num(nestedData.paid_amount) || num(nestedData.amount)
  const channelCode = str(nestedData.channel_code) || str(body.channel_code)

  const dedupeKey = providerEventId || webhookId || `${paymentRequestId || referenceId || 'unknown'}:${providerStatus}`

  return {
    eventType,
    providerEventId,
    webhookId,
    paymentRequestId,
    referenceId,
    providerStatus,
    internalStatus,
    amount,
    channelCode,
    dedupeKey,
  }
}

export async function persistWebhookEvent(payload: unknown, event: PaymentWebhookEvent): Promise<{ duplicate: boolean }> {
  const supabase = createServiceClient()

  const { error } = await supabase.from('webhook_events').insert({
    provider: 'xendit',
    dedupe_key: event.dedupeKey,
    provider_event_id: event.providerEventId,
    webhook_id: event.webhookId,
    payment_request_id: event.paymentRequestId,
    reference_id: event.referenceId,
    status: event.providerStatus,
    payload_json: payload,
  })

  if (!error) {
    return { duplicate: false }
  }

  if ((error as { code?: string }).code === '23505') {
    return { duplicate: true }
  }

  throw new Error(`Failed to persist webhook event: ${error.message}`)
}

async function resolveOrderIdFromWebhookEvent(event: PaymentWebhookEvent): Promise<string | null> {
  if (event.referenceId) {
    return parseOrderIdFromReference(event.referenceId)
  }

  if (!event.paymentRequestId) {
    return null
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('payments')
    .select('order_id')
    .eq('payment_request_id', event.paymentRequestId)
    .maybeSingle()

  if (error) {
    logger.error({ error, paymentRequestId: event.paymentRequestId }, '[Payments] failed to resolve order by payment_request_id')
    return null
  }

  return str(data?.order_id)
}

export async function handleXenditWebhook(payload: unknown, headers: Headers) {
  const event = normalizeWebhookEvent(payload, headers)
  const persisted = await persistWebhookEvent(payload, event)

  if (persisted.duplicate) {
    return {
      duplicate: true,
      ignored: true,
      reason: 'duplicate_event',
      event,
    }
  }

  const orderId = await resolveOrderIdFromWebhookEvent(event)

  if (!orderId) {
    logger.warn({ event }, '[Payments] webhook ignored: cannot resolve order id')
    return {
      duplicate: false,
      ignored: true,
      reason: 'order_not_found',
      event,
    }
  }

  await applyPaymentStateTransition({
    orderId,
    status: event.internalStatus,
    providerStatus: event.providerStatus,
    paymentRequestId: event.paymentRequestId,
    referenceId: event.referenceId,
    channelCode: event.channelCode,
    amount: event.amount,
  })

  return {
    duplicate: false,
    ignored: false,
    orderId,
    event,
  }
}
