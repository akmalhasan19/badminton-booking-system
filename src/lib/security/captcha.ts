import 'server-only'

import { logger } from '@/lib/logger'

import { getServerActionClientIp } from '@/lib/security/abuse-protection'

type CaptchaVerificationParams = {
    token?: string | null
}

function isCaptchaEnabled() {
    const explicit = process.env.CAPTCHA_ENABLED
    if (explicit === 'true') return true
    if (explicit === 'false') return false

    return process.env.NODE_ENV === 'production'
}

export async function verifySubmissionCaptcha({ token }: CaptchaVerificationParams) {
    if (!isCaptchaEnabled()) {
        return { success: true as const }
    }

    const captchaToken = token?.trim()
    if (!captchaToken) {
        return { success: false as const, error: 'Captcha verification is required.' }
    }

    const provider = (process.env.CAPTCHA_PROVIDER || 'turnstile').toLowerCase()
    if (provider !== 'turnstile') {
        logger.error({ provider }, 'Unsupported CAPTCHA provider')
        return { success: false as const, error: 'Captcha provider is not supported.' }
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY || process.env.CAPTCHA_SECRET_KEY
    if (!secretKey) {
        logger.error('Captcha secret is missing while CAPTCHA is enabled.')
        return { success: false as const, error: 'Captcha is not configured on server.' }
    }

    const clientIp = await getServerActionClientIp()

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            secret: secretKey,
            response: captchaToken,
            remoteip: clientIp,
        }),
        cache: 'no-store',
    })

    if (!response.ok) {
        logger.error({ status: response.status }, 'Failed CAPTCHA verification request')
        return { success: false as const, error: 'Captcha verification failed.' }
    }

    const payload = (await response.json()) as {
        success?: boolean
        ['error-codes']?: string[]
    }

    if (!payload.success) {
        logger.warn({ errorCodes: payload['error-codes'] }, 'Captcha rejected')
        return { success: false as const, error: 'Captcha validation failed.' }
    }

    return { success: true as const }
}
