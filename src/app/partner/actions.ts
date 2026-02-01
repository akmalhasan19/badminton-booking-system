"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export type PartnerApplicationData = {
    ownerName: string
    email: string
    phone: string
    socialMedia: string
    website?: string
    flooringMaterial: string
    routineClubs: string
}

export async function submitPartnerApplication(data: PartnerApplicationData) {
    try {
        const { error } = await supabase.from('partner_applications').insert({
            owner_name: data.ownerName,
            email: data.email,
            phone: data.phone,
            social_media: data.socialMedia,
            website: data.website || null,
            flooring_material: data.flooringMaterial,
            routine_clubs: data.routineClubs,
            status: 'pending'
        })

        if (error) {
            console.error('Supabase Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (err) {
        console.error('Unexpected Error:', err)
        return { success: false, error: 'Failed to submit application' }
    }
}
