export function validateApiKey(request: Request): boolean {
    const apiKey = request.headers.get('x-api-key')
    const validApiKey = process.env.API_KEY_SMASH_PWA

    if (!validApiKey) {
        console.error('API_KEY_SMASH_PWA is not defined in environment variables.')
        return false
    }

    return apiKey === validApiKey
}
