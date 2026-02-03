'use server'

import { createClient } from "@supabase/supabase-js"
import { SubscriptionPlan } from "@/lib/constants/plans"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key to bypass RLS for token-based access
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export type ApplicationData = {
    id: string
    owner_name: string
    email: string
    phone: string
    venue_name: string
    venue_address: string
    venue_latitude: number | null
    venue_longitude: number | null
    social_media: string
    website: string | null
    flooring_material: string
    routine_clubs: string
    goals: string[]
    subscription_plan: SubscriptionPlan | null
    status: string
    created_at: string
}

export async function getApplicationByToken(token: string): Promise<{ data: ApplicationData | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('partner_applications')
            .select('*')
            .eq('review_token', token)
            .single()

        if (error) {
            console.error('Fetch error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            })
            // Debugging: Check if key is loaded (log only first 5 chars)
            console.log('Service Key loaded:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 5)}...` : 'NO KEY')

            return { data: null, error: `Debug Error: ${error.message} (Code: ${error.code})` }
        }

        return { data, error: null }
    } catch (err: any) {
        console.error('Unexpected error:', err)
        return { data: null, error: `Unexpected Error: ${err.message || err}` }
    }
}
