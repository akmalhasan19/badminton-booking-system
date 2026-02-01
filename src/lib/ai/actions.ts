'use server'

/**
 * Server action to handle AI chat
 * This prevents exposing API keys on the client side
 */
export async function chatWithAI(message: string) {
    if (!message) {
        return { error: 'Message is empty' }
    }

    // TODO: Integrate with Google Generative AI (Gemini) or other provider
    // const apiKey = process.env.GOOGLE_AI_API_KEY
    // const result = await mockAIService(message)

    try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        return {
            response: "Oops! My brain isn't connected yet (Missing AI API configuration). But I'd love to help! Try the BOOK tab for court reservations or SHOP for gear! 🎾",
            success: true
        }
    } catch (error) {
        console.error('AI Error:', error)
        return { error: 'Failed to process message' }
    }
}
