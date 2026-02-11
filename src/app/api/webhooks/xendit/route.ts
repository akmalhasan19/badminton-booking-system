import { NextResponse } from 'next/server'
import { canRateLimit, ratelimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { handleXenditWebhook } from '@/lib/payments/service'
import { createServiceClient } from '@/lib/supabase/server'

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return request.headers.get('x-real-ip') || 'unknown'
}

const getCallbackToken = (request: Request) =>
  request.headers.get('x-callback-token') || request.headers.get('X-CALLBACK-TOKEN')

const getWebhookToken = () => process.env.XENDIT_WEBHOOK_TOKEN || process.env.XENDIT_CALLBACK_TOKEN
const getIpAllowList = () =>
  (process.env.XENDIT_WEBHOOK_IP_ALLOWLIST || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean)

async function appendWebhookLog(params: {
  status: string
  responseCode: number
  payload?: unknown
  errorMessage?: string
}) {
  const supabase = createServiceClient()
  await supabase.from('webhook_logs').insert({
    source: 'xendit',
    payload: params.payload,
    status: params.status,
    response_code: params.responseCode,
    error_message: params.errorMessage,
  })
}

export async function POST(request: Request) {
  let payload: unknown = null

  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      await appendWebhookLog({
        status: 'rejected',
        responseCode: 415,
        errorMessage: 'Unsupported content-type. JSON required',
      })
      return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })
    }

    const webhookToken = getWebhookToken()
    if (!webhookToken) {
      logger.error('[XenditWebhook] Missing webhook token configuration')
      await appendWebhookLog({
        status: 'failed',
        responseCode: 500,
        errorMessage: 'XENDIT_WEBHOOK_TOKEN is not configured',
      })
      return NextResponse.json({ error: 'Webhook token not configured' }, { status: 500 })
    }

    if (canRateLimit) {
      const ip = getClientIp(request)
      const rateLimitResult = await ratelimit.limit(`xendit-webhook:${ip}`)
      if (!rateLimitResult.success) {
        await appendWebhookLog({
          status: 'rate_limited',
          responseCode: 429,
          errorMessage: `Rate limited for IP ${ip}`,
        })
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
    }

    const ip = getClientIp(request)
    const allowList = getIpAllowList()
    if (allowList.length > 0 && !allowList.includes(ip)) {
      await appendWebhookLog({
        status: 'forbidden',
        responseCode: 403,
        errorMessage: `IP ${ip} is not allowlisted`,
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const callbackToken = getCallbackToken(request)
    if (!callbackToken || callbackToken !== webhookToken) {
      logger.warn({ callbackToken }, '[XenditWebhook] Unauthorized callback token')
      await appendWebhookLog({
        status: 'unauthorized',
        responseCode: 401,
        errorMessage: 'Invalid callback token',
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      payload = await request.json()
    } catch {
      await appendWebhookLog({
        status: 'rejected',
        responseCode: 400,
        errorMessage: 'Invalid JSON payload',
      })
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

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
