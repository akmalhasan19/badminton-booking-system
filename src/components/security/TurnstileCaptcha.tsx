"use client"

import { useEffect, useRef } from "react"

type TurnstileCaptchaProps = {
    siteKey: string
    onTokenChange: (token: string | null) => void
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: Record<string, unknown>) => string
            remove: (widgetId: string) => void
        }
    }
}

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script"
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

export function TurnstileCaptcha({ siteKey, onTokenChange }: TurnstileCaptchaProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const widgetIdRef = useRef<string | null>(null)

    useEffect(() => {
        let cancelled = false

        const renderWidget = () => {
            if (cancelled || !containerRef.current || !window.turnstile) return
            if (widgetIdRef.current) return

            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token: string) => onTokenChange(token),
                "expired-callback": () => onTokenChange(null),
                "error-callback": () => onTokenChange(null),
            })
        }

        const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null
        if (!existingScript) {
            const script = document.createElement("script")
            script.id = TURNSTILE_SCRIPT_ID
            script.src = TURNSTILE_SCRIPT_SRC
            script.async = true
            script.defer = true
            script.onload = () => renderWidget()
            document.head.appendChild(script)
        } else if (window.turnstile) {
            renderWidget()
        } else {
            existingScript.addEventListener("load", renderWidget, { once: true })
        }

        return () => {
            cancelled = true
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current)
                widgetIdRef.current = null
            }
        }
    }, [onTokenChange, siteKey])

    return <div ref={containerRef} />
}
