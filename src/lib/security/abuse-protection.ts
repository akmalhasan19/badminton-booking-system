import 'server-only'

import { headers } from 'next/headers'

import {
    canRateLimit,
    coachSubmissionEmailRatelimit,
    coachSubmissionIpRatelimit,
    debugActionCooldownRatelimit,
    partnerSubmissionEmailRatelimit,
    partnerSubmissionIpRatelimit,
    webhookInvalidLogRatelimit,
} from '@/lib/rate-limit'

type RateLimitResult = {
    success: boolean
    reset?: number
}

function parseForwardedIp(forwardedFor: string | null) {
    if (!forwardedFor) return null
    const first = forwardedFor.split(',')[0]
    return first?.trim() || null
}

function toRetryAfterSeconds(result: RateLimitResult) {
    if (!result.reset) return undefined
    const delta = Math.ceil((result.reset - Date.now()) / 1000)
    return delta > 0 ? delta : undefined
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

export async function getServerActionClientIp() {
    const requestHeaders = await headers()

    return (
        parseForwardedIp(requestHeaders.get('x-forwarded-for')) ||
        requestHeaders.get('x-real-ip') ||
        'unknown'
    )
}

export function getRequestClientIp(request: Request) {
    return (
        parseForwardedIp(request.headers.get('x-forwarded-for')) ||
        request.headers.get('x-real-ip') ||
        'unknown'
    )
}

async function checkRateLimit(resultPromise: Promise<RateLimitResult>) {
    if (!canRateLimit) {
        return { allowed: true as const }
    }

    const result = await resultPromise
    if (result.success) {
        return { allowed: true as const }
    }

    return {
        allowed: false as const,
        retryAfterSeconds: toRetryAfterSeconds(result),
    }
}

export async function enforcePartnerSubmissionRateLimit(email: string) {
    if (!canRateLimit) {
        return { allowed: true as const }
    }

    const ip = await getServerActionClientIp()
    const normalizedEmail = normalizeEmail(email)

    const [ipCheck, emailCheck] = await Promise.all([
        checkRateLimit(partnerSubmissionIpRatelimit.limit(`partner:${ip}`)),
        checkRateLimit(partnerSubmissionEmailRatelimit.limit(`partner:${normalizedEmail}`)),
    ])

    if (!ipCheck.allowed) {
        return {
            allowed: false as const,
            error: 'Too many submissions from this network. Please try again later.',
            retryAfterSeconds: ipCheck.retryAfterSeconds,
        }
    }

    if (!emailCheck.allowed) {
        return {
            allowed: false as const,
            error: 'This email has reached the submission limit. Please try again later.',
            retryAfterSeconds: emailCheck.retryAfterSeconds,
        }
    }

    return { allowed: true as const }
}

export async function enforceCoachSubmissionRateLimit(email: string) {
    if (!canRateLimit) {
        return { allowed: true as const }
    }

    const ip = await getServerActionClientIp()
    const normalizedEmail = normalizeEmail(email)

    const [ipCheck, emailCheck] = await Promise.all([
        checkRateLimit(coachSubmissionIpRatelimit.limit(`coach:${ip}`)),
        checkRateLimit(coachSubmissionEmailRatelimit.limit(`coach:${normalizedEmail}`)),
    ])

    if (!ipCheck.allowed) {
        return {
            allowed: false as const,
            error: 'Too many submissions from this network. Please try again later.',
            retryAfterSeconds: ipCheck.retryAfterSeconds,
        }
    }

    if (!emailCheck.allowed) {
        return {
            allowed: false as const,
            error: 'This email has reached the submission limit. Please try again later.',
            retryAfterSeconds: emailCheck.retryAfterSeconds,
        }
    }

    return { allowed: true as const }
}

export async function enforceDebugActionCooldown(actionKey: string) {
    if (!canRateLimit) {
        return { allowed: true as const }
    }

    const ip = await getServerActionClientIp()
    const result = await checkRateLimit(debugActionCooldownRatelimit.limit(`debug:${actionKey}:${ip}`))

    if (!result.allowed) {
        return {
            allowed: false as const,
            error: 'Action is on cooldown. Please wait before trying again.',
            retryAfterSeconds: result.retryAfterSeconds,
        }
    }

    return { allowed: true as const }
}

export async function shouldLogInvalidWebhookAttempt(ip: string, status: string) {
    if (!canRateLimit) {
        return true
    }

    const result = await webhookInvalidLogRatelimit.limit(`invalid:${status}:${ip}`)
    return result.success
}
