"use server"

import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { PLAN_FEATURES, SubscriptionPlan } from "@/lib/constants/plans"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const resend = new Resend(process.env.RESEND_API_KEY)

export type PartnerApplicationData = {
    ownerName: string
    email: string
    phone: string
    socialMedia: string
    website?: string
    flooringMaterial: string
    routineClubs: string
    goals: string[]
    subscriptionPlan: SubscriptionPlan | null
}

export async function submitPartnerApplication(data: PartnerApplicationData) {
    try {
        // 1. Save to Supabase (existing logic)
        const { error: dbError } = await supabase.from('partner_applications').insert({
            owner_name: data.ownerName,
            email: data.email,
            phone: data.phone,
            social_media: data.socialMedia,
            website: data.website || null,
            flooring_material: data.flooringMaterial,
            routine_clubs: data.routineClubs,
            goals: data.goals,
            // subscription_plan: data.subscriptionPlan, // If you want to save JSON to DB, ensure column exists
            status: 'pending'
        })

        if (dbError) {
            console.error('Supabase Error:', dbError)
            return { success: false, error: dbError.message }
        }

        // 2. Prepare Plan Details
        let planDetails = '<p>No plan selected</p>'
        if (data.subscriptionPlan && PLAN_FEATURES[data.subscriptionPlan]) {
            const plan = PLAN_FEATURES[data.subscriptionPlan]
            planDetails = `
                <p><strong>Plan Name:</strong> ${plan.displayName}</p>
                <p><strong>Price:</strong> Rp ${(plan.priceMonthly / 1000).toLocaleString('id-ID')}rb / bulan</p>
                <p><strong>Description:</strong> ${plan.description}</p>
            `
        }

        // 3. Send Email Notification via Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Smash Partner <onboarding@resend.dev>', // Use resend.dev for testing unless domain is verified
            to: ['smash.email.web@gmail.com'],
            subject: `New Partner Application: ${data.ownerName}`,
            html: `
        <h1>New Partner Application</h1>
        <p><strong>Owner Name:</strong> ${data.ownerName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Social Media:</strong> ${data.socialMedia}</p>
        <p><strong>Website:</strong> ${data.website || '-'}</p>
        <p><strong>Flooring Material:</strong> ${data.flooringMaterial}</p>
        <p><strong>Routine Clubs:</strong> ${data.routineClubs}</p>
        
        <h2>Goals</h2>
        <ul>
          ${data.goals.map(goal => `<li>${goal}</li>`).join('')}
        </ul>

        <h2>Selected Plan</h2>
        ${planDetails}
      `
        })

        if (emailError) {
            console.error('Resend Error:', emailError)
            // We don't fail the whole request if email fails, but we log it
        }

        return { success: true }
    } catch (err) {
        console.error('Unexpected Error:', err)
        return { success: false, error: 'Failed to submit application' }
    }
}
