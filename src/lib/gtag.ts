import { sendGAEvent } from '@next/third-parties/google'

/**
 * Sends a Google Analytics event.
 * Wrapper around @next/third-parties/google sendGAEvent.
 * 
 * @param action The event name (e.g., 'search', 'login', 'purchase')
 * @param params Optional parameters for the event (e.g., { search_term: 'badminton' })
 */
export function trackEvent(action: string, params?: Record<string, any>) {
    // Only track in production if needed, but the library might handle it.
    // However, the component mostly handles "production only" check via proper usage.
    // The user explicitly requested "Pastikan script ini hanya berjalan di lingkungan production".
    // Usually the component logic handles loading the script only in prod, so sendGAEvent might just no-op if script isn't there.
    // But to be safe and avoid errors if called without script:

    if (process.env.NODE_ENV === 'production') {
        sendGAEvent('event', action, params || {})
    } else {
        console.log(`[GA Event Dev]: ${action}`, params)
    }
}
