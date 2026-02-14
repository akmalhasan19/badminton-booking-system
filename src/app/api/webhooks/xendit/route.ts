import { NextResponse } from 'next/server'
import { canRateLimit, ratelimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { handleXenditWebhook } from '@/lib/payments/service'
import { createServiceClient } from '@/lib/supabase/server'
import { getRequestClientIp, shouldLogInvalidWebhookAttempt } from '@/lib/security/abuse-protection'
import { parseJsonBodyWithLimit } from '@/lib/security/request-body'

const getCallbackToken = (request: Request) =>
  request.headers.get('x-callback-token') || request.headers.get('X-CALLBACK-TOKEN')

const getWebhookToken = () => process.env.XENDIT_WEBHOOK_TOKEN || process.env.XENDIT_CALLBACK_TOKEN
const getIpAllowList = () =>
  (process.env.XENDIT_WEBHOOK_IP_ALLOWLIST || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean)

const getRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null

const MAX_WEBHOOK_BODY_BYTES = Number(process.env.MAX_WEBHOOK_JSON_BODY_BYTES || 64 * 1024)

const sanitizePayloadForLog = (payload: unknown) => {
  const record = getRecord(payload)
  if (!record) return null

  return {
    id: record.id,
    event: record.event,
    external_id: record.external_id,
    status: record.status,
    paid_amount: record.paid_amount,
    amount: record.amount,
    payment_request_id: record.payment_request_id,
  }
}

async function appendWebhookLog(params: {
  status: string
  responseCode: number
  payload?: unknown
  errorMessage?: string
}) {
  const supabase = createServiceClient()
  await supabase.from('webhook_logs').insert({
    source: 'xendit',
    payload: sanitizePayloadForLog(params.payload),
    status: params.status,
    response_code: params.responseCode,
    error_message: params.errorMessage,
  })
}

async function appendInvalidWebhookLog(params: {
  ip: string
  status: string
  responseCode: number
  errorMessage: string
}) {
  const shouldLog = await shouldLogInvalidWebhookAttempt(params.ip, params.status)
  if (!shouldLog) {
    return
  }

  await appendWebhookLog({
    status: params.status,
    responseCode: params.responseCode,
    errorMessage: params.errorMessage,
  })
}

export async function POST(request: Request) {
  let payload: unknown = null

  try {
    const ip = getRequestClientIp(request)
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      await appendInvalidWebhookLog({
        ip,
        status: 'rejected',
        responseCode: 415,
        errorMessage: 'Unsupported content-type. JSON required',
      })
      return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })
    }

    const webhookToken = getWebhookToken()
    if (!webhookToken) {
      logger.error('[XenditWebhook] Missing webhook token configuration')
      await appendInvalidWebhookLog({
        ip,
        status: 'failed',
        responseCode: 500,
        errorMessage: 'XENDIT_WEBHOOK_TOKEN is not configured',
      })
      return NextResponse.json({ error: 'Webhook token not configured' }, { status: 500 })
    }

    if (canRateLimit) {
      const rateLimitResult = await ratelimit.limit(`xendit-webhook:${ip}`)
      if (!rateLimitResult.success) {
        await appendInvalidWebhookLog({
          ip,
          status: 'rate_limited',
          responseCode: 429,
          errorMessage: `Rate limited for IP ${ip}`,
        })
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
    }

    const allowList = getIpAllowList()
    if (allowList.length > 0 && !allowList.includes(ip)) {
      await appendInvalidWebhookLog({
        ip,
        status: 'forbidden',
        responseCode: 403,
        errorMessage: `IP ${ip} is not allowlisted`,
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const callbackToken = getCallbackToken(request)
    if (!callbackToken || callbackToken !== webhookToken) {
      logger.warn('[XenditWebhook] Unauthorized callback token')
      await appendInvalidWebhookLog({
        ip,
        status: 'unauthorized',
        responseCode: 401,
        errorMessage: 'Invalid callback token',
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsedBody = await parseJsonBodyWithLimit<unknown>(request, {
      maxBytes: MAX_WEBHOOK_BODY_BYTES,
      requireJsonContentType: false,
    })
    if (!parsedBody.ok) {
      await appendInvalidWebhookLog({
        ip,
        status: 'rejected',
        responseCode: parsedBody.response.status,
        errorMessage: parsedBody.response.status === 413 ? 'Payload too large' : 'Invalid JSON payload',
      })
      return parsedBody.response
    }
    payload = parsedBody.data

    const result = await handleXenditWebhook(payload, request.headers)

    if (result.duplicate) {
      await appendWebhookLog({
        status: 'duplicate',
        responseCode: 200,
        payload,
      })
      return NextResponse.json({ message: 'Duplicate webhook ignored' }, { status: 200 })
    }

    if (result.ignored) {
      await appendWebhookLog({
        status: 'ignored',
        responseCode: 200,
        payload,
        errorMessage: result.reason,
      })
      return NextResponse.json({ message: 'Webhook ignored', reason: result.reason }, { status: 200 })
    }

    await appendWebhookLog({
      status: 'processed',
      responseCode: 200,
      payload,
    })

    logger.info(
      {
        orderId: result.orderId,
        paymentRequestId: result.event.paymentRequestId,
        providerStatus: result.event.providerStatus,
        eventType: result.event.eventType,
      },
      '[XenditWebhook] Webhook processed'
    )

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error({ error }, '[XenditWebhook] Failed processing webhook')

    await appendWebhookLog({
      status: 'failed',
      responseCode: 500,
      payload,
      errorMessage,
    })

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
