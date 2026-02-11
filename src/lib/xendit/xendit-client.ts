import { logger } from '@/lib/logger'

const XENDIT_BASE_URL = process.env.XENDIT_BASE_URL || 'https://api.xendit.co'
const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY
const XENDIT_API_VERSION = process.env.XENDIT_API_VERSION

export type XenditPaymentAction = {
  type?: string
  descriptor?: string
  value?: unknown
  [key: string]: unknown
}

export type XenditPaymentRequest = {
  id: string
  reference_id: string
  status: string
  channel_code?: string
  country?: string
  currency?: string
  request_amount?: number
  actions?: XenditPaymentAction[]
  channel_properties?: Record<string, unknown>
  created?: string
  updated?: string
  created_at?: string
  updated_at?: string
  expires_at?: string
  [key: string]: unknown
}

export type CreatePaymentRequestPayload = {
  reference_id: string
  type: 'PAY'
  country: string
  currency: string
  request_amount: number
  channel_code: string
  channel_properties?: Record<string, unknown>
  description?: string
  metadata?: Record<string, unknown>
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function buildXenditBasicAuthHeader(secretKey: string): string {
  const authString = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${authString}`
}

function assertSecretKey(): string {
  if (!XENDIT_SECRET_KEY) {
    throw new Error('XENDIT_SECRET_KEY is not configured')
  }
  return XENDIT_SECRET_KEY
}

async function requestXendit<T>(
  path: string,
  init: RequestInit,
  { maxRetries = 2 }: { maxRetries?: number } = {}
): Promise<T> {
  const secretKey = assertSecretKey()

  let attempt = 0
  while (true) {
    attempt += 1

    try {
      const response = await fetch(`${XENDIT_BASE_URL}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: buildXenditBasicAuthHeader(secretKey),
          ...(XENDIT_API_VERSION ? { 'api-version': XENDIT_API_VERSION } : {}),
          ...(init.headers || {}),
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        const shouldRetry = response.status >= 500 && attempt <= maxRetries

        logger.error(
          {
            path,
            attempt,
            status: response.status,
            body: errorText,
          },
          '[XenditClient] request failed'
        )

        if (shouldRetry) {
          await sleep(250 * attempt)
          continue
        }

        throw new Error(`Xendit API error ${response.status}: ${errorText}`)
      }

      return (await response.json()) as T
    } catch (error) {
      const shouldRetry = attempt <= maxRetries
      logger.error({ error, path, attempt }, '[XenditClient] network failure')

      if (!shouldRetry) {
        throw error
      }

      await sleep(250 * attempt)
    }
  }
}

export async function createPaymentRequest(payload: CreatePaymentRequestPayload): Promise<XenditPaymentRequest> {
  return requestXendit<XenditPaymentRequest>(
    '/v3/payment_requests',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    },
    { maxRetries: 2 }
  )
}

export async function getPaymentRequest(paymentRequestId: string): Promise<XenditPaymentRequest> {
  return requestXendit<XenditPaymentRequest>(
    `/v3/payment_requests/${paymentRequestId}`,
    {
      method: 'GET',
      cache: 'no-store',
    },
    { maxRetries: 1 }
  )
}
