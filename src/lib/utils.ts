import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getAppUrl() {
    let url =
        process.env.NEXT_PUBLIC_APP_URL ?? // Set this to your site URL in production env.
        process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
        'http://localhost:3000'

    // Make sure to include `https://` when not localhost.
    if (!url.includes('http')) {
        url = `https://${url}`
    }// Make sure to remove trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url.slice(0, -1) : url

    // Hard fallback for production if env vars fail
    if (url === 'http://localhost:3000' && process.env.NODE_ENV === 'production') {
        return 'https://smash-web.vercel.app'
    }

    return url
}
