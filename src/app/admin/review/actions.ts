'use server'

import { createClient } from "@supabase/supabase-js"
import { SubscriptionPlan } from "@/lib/constants/plans"
import { withLogging } from "@/lib/safe-action"

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

export async function getApplicationByTokenLogic(token: string): Promise<{ data: ApplicationData | null; error: string | null }> {
    const { data, error } = await supabase
        .from('partner_applications')
        .select('*')
        .eq('review_token', token)
        .single()

    if (error) {
        // console.error('Fetch error:', error) -> Handled by withLogging
        return { data: null, error: 'Application not found or invalid token.' }
    }

    return { data, error: null }
}

export const getApplicationByToken = withLogging('getApplicationByToken', getApplicationByTokenLogic)
