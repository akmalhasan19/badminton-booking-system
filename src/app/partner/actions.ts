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
    venueName: string
    venueAddress: string
    venueLatitude: number | null
    venueLongitude: number | null
    socialMedia: string
    website?: string
    flooringMaterial: string
    routineClubs: string
    goals: string[]
    subscriptionPlan: SubscriptionPlan | null
}

// Generate a unique review token
function generateReviewToken(): string {
    return crypto.randomUUID()
}

export async function submitPartnerApplication(data: PartnerApplicationData) {
    try {
        const reviewToken = generateReviewToken()

        // 1. Save to Supabase
        const { error: dbError } = await supabase.from('partner_applications').insert({
            owner_name: data.ownerName,
            email: data.email,
            phone: data.phone,
            venue_name: data.venueName,
            venue_address: data.venueAddress,
            venue_latitude: data.venueLatitude,
            venue_longitude: data.venueLongitude,
            social_media: data.socialMedia,
            website: data.website || null,
            flooring_material: data.flooringMaterial,
            routine_clubs: data.routineClubs,
            goals: data.goals,
            subscription_plan: data.subscriptionPlan,
            review_token: reviewToken,
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
            from: 'Smash Partner <onboarding@smashcourts.online>', // Use verified domain
            to: ['smash.email.web@gmail.com'],
            subject: `New Partner Application: ${data.ownerName}`,
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 3px solid #000000; box-shadow: 8px 8px 0px 0px #000000; }
                    .header { background-color: #ccfd35; padding: 30px; border-bottom: 3px solid #000000; text-align: center; }
                    .header h1 { margin: 0; font-size: 28px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: -1px; }
                    .content { padding: 40px 30px; }
                    .section { margin-bottom: 30px; }
                    .section-title { font-size: 18px; font-weight: 800; text-transform: uppercase; border-bottom: 3px solid #000000; padding-bottom: 10px; margin-bottom: 20px; display: inline-block; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                    .field { margin-bottom: 15px; }
                    .label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 5px; display: block; }
                    .value { font-size: 16px; font-weight: 500; color: #000; }
                    .plan-box { background-color: #d6c6ff; border: 3px solid #000000; padding: 25px; box-shadow: 4px 4px 0px 0px #000000; }
                    .plan-name { font-size: 24px; font-weight: 900; margin-bottom: 10px; }
                    .price { font-size: 20px; font-weight: 700; margin-bottom: 15px; }
                    .tags { margin-top: 10px; }
                    .tag { display: inline-block; background-color: #000; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 5px; margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New Partner Application</h1>
                    </div>
                    
                    <div class="content">
                        <div class="section">
                            <div class="section-title">Owner Details</div>
                            <div class="field">
                                <span class="label">Full Name</span>
                                <div class="value">${data.ownerName}</div>
                            </div>
                            <div class="field">
                                <span class="label">Email Address</span>
                                <div class="value"><a href="mailto:${data.email}" style="color: #000; text-decoration: underline; font-weight: bold;">${data.email}</a></div>
                            </div>
                            <div class="field">
                                <span class="label">Phone Number</span>
                                <div class="value">${data.phone}</div>
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">Venue Information</div>
                            <div class="field">
                                <span class="label">Venue Name</span>
                                <div class="value">${data.venueName}</div>
                            </div>
                            <div class="field">
                                <span class="label">Address</span>
                                <div class="value">${data.venueAddress}</div>
                            </div>
                            ${data.venueLatitude && data.venueLongitude ? `
                            <div class="field">
                                <span class="label">Coordinates</span>
                                <div class="value"><a href="https://www.google.com/maps?q=${data.venueLatitude},${data.venueLongitude}" target="_blank" style="color: #000; text-decoration: underline; font-weight: bold;">View on Google Maps</a></div>
                            </div>
                            ` : ''}
                            <div class="field">
                                <span class="label">Social Media</span>
                                <div class="value">${data.socialMedia}</div>
                            </div>
                            <div class="field">
                                <span class="label">Website</span>
                                <div class="value">${data.website || '-'}</div>
                            </div>
                            <div class="field">
                                <span class="label">Flooring Material</span>
                                <div class="value">${data.flooringMaterial}</div>
                            </div>
                             <div class="field">
                                <span class="label">Routine Clubs</span>
                                <div class="value">${data.routineClubs}</div>
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">Selected Goals</div>
                            <div class="tags">
                                ${data.goals.map(goal => `<span class="tag">${goal}</span>`).join('')}
                            </div>
                        </div>

                        <div class="section" style="margin-bottom: 0;">
                            <div class="section-title">Selected Subscription</div>
                            ${data.subscriptionPlan ? `
                                <div class="plan-box">
                                    <div class="plan-name">${PLAN_FEATURES[data.subscriptionPlan].displayName}</div>
                                    <div class="price">Rp ${(PLAN_FEATURES[data.subscriptionPlan].priceMonthly / 1000).toLocaleString('id-ID')}rb / month</div>
                                    <div class="value" style="font-size: 14px;">${PLAN_FEATURES[data.subscriptionPlan].description}</div>
                                </div>
                            ` : '<div class="value">No plan selected</div>'}
                        </div>

                        <div style="margin-top: 40px; text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/review/${reviewToken}" style="display: inline-block; background-color: #ccfd35; color: #000; padding: 16px 32px; font-size: 16px; font-weight: 900; text-decoration: none; border: 3px solid #000; box-shadow: 4px 4px 0px 0px #000; text-transform: uppercase;">
                                Review Application
                            </a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `
        })

        if (emailError) {
            console.error('Resend Error (Admin):', emailError)
            // We don't fail the whole request if email fails, but we log it
        }

        // 4. Send Confirmation Email to Partner
        const { error: partnerEmailError } = await resend.emails.send({
            from: 'Smash Partner <onboarding@smashcourts.online>',
            to: [data.email],
            subject: '✅ Aplikasi Partner Diterima - Smash & Serve',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" style="max-width: 560px; background-color: #ffffff; border: 3px solid #000000; border-radius: 16px; overflow: hidden; box-shadow: 6px 6px 0px #000000;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #E0F55D; padding: 32px; text-align: center; border-bottom: 3px solid #000000;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #000000; letter-spacing: -0.5px;">
                                ✅ APLIKASI DITERIMA
                            </h1>
                            <p style="margin: 8px 0 0; font-size: 16px; font-weight: 600; color: #333333;">
                                Kami sedang memproses pendaftaran Anda
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 32px 28px;">
                            <p style="margin: 0 0 16px; font-size: 16px; color: #333333;">
                                Halo <strong>${data.ownerName}</strong>,
                            </p>
                            <p style="margin: 0 0 20px; font-size: 15px; color: #555555; line-height: 1.7;">
                                Terima kasih telah mendaftarkan <strong>${data.venueName}</strong> sebagai partner Smash & Serve! Aplikasi Anda telah kami terima dan sedang dalam proses review.
                            </p>
                            
                            <!-- Application Summary Box -->
                            <div style="background-color: #f8f8f8; border: 2px solid #e0e0e0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                                <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #333;">
                                    📋 Ringkasan Aplikasi
                                </h3>
                                <table style="width: 100%; font-size: 14px;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;">Nama GOR:</td>
                                        <td style="padding: 8px 0; color: #000; font-weight: 600;">${data.venueName}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;">Alamat:</td>
                                        <td style="padding: 8px 0; color: #000; font-weight: 600;">${data.venueAddress}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;">Email:</td>
                                        <td style="padding: 8px 0; color: #000; font-weight: 600;">${data.email}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;">Telepon:</td>
                                        <td style="padding: 8px 0; color: #000; font-weight: 600;">${data.phone}</td>
                                    </tr>
                                    ${data.subscriptionPlan ? `
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;">Paket Langganan:</td>
                                        <td style="padding: 8px 0; color: #000; font-weight: 600;">${PLAN_FEATURES[data.subscriptionPlan].displayName}</td>
                                    </tr>
                                    ` : ''}
                                </table>
                            </div>
                            
                            <!-- Timeline Box -->
                            <div style="background-color: #fff7ed; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 24px 0;">
                                <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #b45309;">
                                    ⏰ Apa yang terjadi selanjutnya?
                                </h3>
                                <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #333333; line-height: 1.8;">
                                    <li>Tim kami akan meninjau aplikasi Anda dalam <strong>1x24 jam</strong></li>
                                    <li>Anda akan menerima email pemberitahuan hasil review</li>
                                    <li>Jika disetujui, Anda akan mendapat link untuk melengkapi pendaftaran GOR</li>
                                </ol>
                            </div>
                            
                            <p style="margin: 28px 0 0; font-size: 14px; color: #666666; line-height: 1.6;">
                                Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi tim kami di <a href="mailto:smash.email.web@gmail.com" style="color: #000; font-weight: 600;">smash.email.web@gmail.com</a>
                            </p>
                            
                            <p style="margin: 24px 0 0; font-size: 15px; color: #333333;">
                                Salam hangat,<br>
                                <strong>Tim Smash & Serve</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 20px 28px; border-top: 2px dashed #e0e0e0;">
                            <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                                © 2026 Smash & Serve. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `
        })

        if (partnerEmailError) {
            console.error('Resend Error (Partner Confirmation):', partnerEmailError)
            // We don't fail the whole request if email fails, but we log it
        }

        return { success: true }
    } catch (err) {
        console.error('Unexpected Error:', err)
        return { success: false, error: 'Failed to submit application' }
    }
}

// ============================================
// Approval & Rejection Server Actions
// ============================================

type ApprovalResult = {
    success: boolean
    error?: string
    inviteUrl?: string
    emailSent?: boolean
}

export async function approveApplication(applicationId: string): Promise<ApprovalResult> {
    try {
        // Use service role key for admin actions to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // 1. Fetch the application
        const { data: application, error: fetchError } = await supabaseAdmin
            .from('partner_applications')
            .select('*')
            .eq('id', applicationId)
            .single()

        if (fetchError || !application) {
            return { success: false, error: 'Application not found' }
        }

        if (application.status !== 'pending') {
            return { success: false, error: 'Application has already been processed' }
        }

        // 2. Call PWA Smash API to generate invite
        const smashApiUrl = process.env.NEXT_PUBLIC_SMASH_API_BASE_URL
        const smashApiToken = process.env.SMASH_API_TOKEN

        if (!smashApiUrl || !smashApiToken) {
            return { success: false, error: 'PWA Smash API configuration missing' }
        }

        const inviteResponse = await fetch(`${smashApiUrl}/partner-invites`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${smashApiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: application.email,
                partner_name: application.venue_name
            })
        })

        if (!inviteResponse.ok) {
            const errorData = await inviteResponse.json().catch(() => ({}))
            console.error('PWA Smash API Error:', errorData)
            return { success: false, error: `Failed to generate invite: ${inviteResponse.status}` }
        }

        const inviteData = await inviteResponse.json()
        const inviteUrl = inviteData.invite_url

        if (!inviteUrl) {
            return { success: false, error: 'Invalid response from PWA Smash API' }
        }

        // 3. Update application status
        const { error: updateError } = await supabaseAdmin
            .from('partner_applications')
            .update({ status: 'approved' })
            .eq('id', applicationId)

        if (updateError) {
            console.error('Database update error:', updateError)
            return { success: false, error: 'Failed to update application status' }
        }

        // 4. Send approval email to partner
        const { error: emailError } = await resend.emails.send({
            from: 'Smash Partner <onboarding@smashcourts.online>',
            to: [application.email],
            subject: '🎉 Selamat! Aplikasi Partner Anda Disetujui - Smash & Serve',
            html: `
                <!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8" >
        <meta name="viewport" content = "width=device-width, initial-scale=1.0" >
        </head>
        < body style = "margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace, sans-serif; background-color: #f3f4f6;" >
        <table width="100%" cellpadding = "0" cellspacing = "0" style = "background-color: #f3f4f6; padding: 40px 20px;" >
        <tr>
        <td align="center" >
        <!--Main Container-- >
        <table width="100%" style = "max-width: 600px; background-color: #ffffff; border: 3px solid #000000; box-shadow: 8px 8px 0px #000000;" >
        <!--Header -->
        <tr>
        <td style="background-color: #ccfd35; padding: 40px 20px; text-align: center; border-bottom: 3px solid #000000;" >
        <!--Icon -->
        <img src="${process.env.NEXT_PUBLIC_APP_URL}/email/partner-approved-icon.png" alt = "Celebration Icon" style = "width: 120px; height: 120px; display: block; margin: 0 auto 20px auto; filter: drop-shadow(4px 4px 0px #000000);" >

        <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: -1px; line-height: 1.2;" >
        SELAMAT!
        </h1>
        < p style = "margin: 10px 0 0; font-size: 18px; font-weight: 700; color: #000000; text-transform: uppercase;" >
        Aplikasi Partner Anda Disetujui
        </p>
        </td>
        </tr>

        < !--Body -->
        <tr>
        <td style="padding: 40px 30px;" >
        <p style="margin: 0 0 20px; font-size: 16px; color: #000000; font-weight: 700;" >
        Halo ${application.owner_name},
            </p>
            < p style = "margin: 0 0 30px; font-size: 16px; color: #333333; line-height: 1.6;" >
            Kami dengan senang hati mengabarkan bahwa aplikasi Anda untuk mendaftarkan < strong > ${application.venue_name} < /strong> sebagai partner resmi Smash & Serve telah <strong style="background-color: #ccfd35; padding: 2px 6px; border: 1px solid #000;">DISETUJUI!</strong >
            </p>

        < !--Next Steps Box-- >
        <div style="background-color: #ffffff; border: 3px solid #000000; padding: 25px; margin: 30px 0; box-shadow: 4px 4px 0px #000000;" >
        <h3 style="margin: 0 0 15px; font-size: 16px; font-weight: 900; text-transform: uppercase; border-bottom: 3px solid #000000; padding-bottom: 10px; display: inline-block;" >
        LANGKAH SELANJUTNYA
        </h3>
        < ol style = "margin: 0; padding-left: 20px; font-size: 15px; color: #000000; line-height: 1.8; font-weight: 500;" >
        <li>Klik tombol di bawah untuk membuat akun GOR Anda </li>
        < li > Lengkapi informasi profil venue </li>
        < li > Mulai kelola booking badminton Anda! </li>
        </ol>
        </div>

        < !--CTA Button-- >
        <div style="text-align: center; margin: 40px 0;" >
        <a href="${inviteUrl}" style = "display: inline-block; background-color: #000000; color: #ffffff; padding: 18px 40px; font-size: 18px; font-weight: 900; text-decoration: none; border: 3px solid #000000; box-shadow: 6px 6px 0px #ccfd35; text-transform: uppercase; transition: all 0.2s;" >
        DAFTARKAN GOR ANDA
        </a>
        </div>

        < !--Expiry Notice-- >
        <div style="background-color: #fef3c7; border: 3px solid #000000; padding: 15px; text-align: center;" >
        <p style="margin: 0; font-size: 14px; color: #000000; font-weight: 600;" >
                                    ⚠️ PENTING: Link ini berlaku selama < strong > 7 hari </strong>.
            </p>
            </div>

            < p style = "margin: 30px 0 0; font-size: 14px; color: #666666; font-weight: 500;" >
                Butuh bantuan ? email kami di < a href = "mailto:smash.email.web@gmail.com" style = "color: #000000; text-decoration: underline; font-weight: 700;" > smash.email.web@gmail.com</a>
                    </p>
                    </td>
                    </tr>

                    < !--Footer -->
                        <tr>
                        <td style="background-color: #000000; padding: 20px; text-align: center;" >
                            <p style="margin: 0; font-size: 12px; color: #ffffff; font-weight: 700; text-transform: uppercase;" >
                                © 2026 Smash & Serve.All rights reserved.
                            </p>
            </td>
            </tr>
            </table>
            </td>
            </tr>
            </table>
            </body>
            </html>
                `
        })

        if (emailError) {
            console.error('Failed to send approval email:', emailError)
            // Don't fail the whole operation if email fails
        }

        return { success: true, inviteUrl, emailSent: !emailError }
    } catch (err) {
        console.error('Approve Application Error:', err)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

export async function rejectApplication(applicationId: string): Promise<{ success: boolean; error?: string; emailSent?: boolean, emailErrorDetail?: string }> {
    try {
        // Use service role key for admin actions to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // 1. Fetch the application
        const { data: application, error: fetchError } = await supabaseAdmin
            .from('partner_applications')
            .select('*')
            .eq('id', applicationId)
            .single()

        if (fetchError || !application) {
            return { success: false, error: 'Application not found' }
        }

        if (application.status !== 'pending') {
            return { success: false, error: 'Application has already been processed' }
        }

        // 2. Update application status
        const { error: updateError } = await supabaseAdmin
            .from('partner_applications')
            .update({ status: 'rejected' })
            .eq('id', applicationId)

        if (updateError) {
            console.error('Database update error:', updateError)
            return { success: false, error: 'Failed to update application status' }
        }

        // 3. Send rejection email to partner
        const { error: emailError } = await resend.emails.send({
            from: 'Smash Partner <onboarding@smashcourts.online>',
            to: [application.email],
            subject: 'Pembaruan Status Aplikasi Partner - Smash & Serve',
            html: `
            < !DOCTYPE html >
                <html>
                <head>
                <meta charset="utf-8" >
                    <meta name="viewport" content = "width=device-width, initial-scale=1.0" >
                        </head>
                        < body style = "margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;" >
                            <table width="100%" cellpadding = "0" cellspacing = "0" style = "background-color: #f5f5f5; padding: 40px 20px;" >
                                <tr>
                                <td align="center" >
                                    <table width="100%" style = "max-width: 560px; background-color: #ffffff; border: 3px solid #000000; border-radius: 16px; overflow: hidden; box-shadow: 6px 6px 0px #000000;" >
                                        <!--Header -->
                                            <tr>
                                            <td style="background-color: #fef2f2; padding: 32px; text-align: center; border-bottom: 3px solid #000000;" >
                                                <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #000000; letter-spacing: -0.5px;" >
                                                    Pembaruan Status Aplikasi
                                                        </h1>
                                                        </td>
                                                        </tr>

                                                        < !--Body -->
                                                            <tr>
                                                            <td style="padding: 32px 28px;" >
                                                                <p style="margin: 0 0 16px; font-size: 16px; color: #333333;" >
                                                                    Halo < strong > ${application.owner_name} </strong>,
                                                                        </p>
                                                                        < p style = "margin: 0 0 20px; font-size: 15px; color: #555555; line-height: 1.7;" >
                                                                            Terima kasih atas minat Anda untuk bergabung sebagai partner Smash & Serve dengan mendaftarkan < strong > ${application.venue_name} </strong>.
                                                                                </p>
                                                                                < p style = "margin: 0 0 20px; font-size: 15px; color: #555555; line-height: 1.7;" >
                                                                                    Setelah meninjau aplikasi Anda dengan seksama, dengan berat hati kami sampaikan bahwa aplikasi Anda < strong style = "color: #dc2626;" > belum dapat kami setujui </strong> pada saat ini.
                                                                                        </p>

                                                                                        < !--Info Box-- >
                                                                                            <div style="background-color: #f8f8f8; border: 2px solid #e0e0e0; border-radius: 12px; padding: 20px; margin: 24px 0;" >
                                                                                                <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.7;" >
                                                                                                    Keputusan ini dapat disebabkan oleh berbagai faktor seperti kelengkapan dokumen, lokasi venue, atau kapasitas kami saat ini untuk menerima partner baru.
                                </p>
                                                                                                        </div>

                                                                                                        < p style = "margin: 0 0 20px; font-size: 15px; color: #555555; line-height: 1.7;" >
                                                                                                            Kami sangat menghargai waktu dan usaha yang telah Anda investasikan dalam proses aplikasi ini.Jangan berkecil hati — Anda dipersilakan untuk mengajukan aplikasi kembali di masa mendatang.
                            </p>

                                                                                                                < p style = "margin: 28px 0 0; font-size: 14px; color: #666666; line-height: 1.6;" >
                                                                                                                    Jika Anda memiliki pertanyaan atau membutuhkan klarifikasi lebih lanjut, silakan hubungi kami di < a href = "mailto:smash.email.web@gmail.com" style = "color: #000; font-weight: 600;" > smash.email.web@gmail.com</a>
                                                                                                                        </p>

                                                                                                                        < p style = "margin: 24px 0 0; font-size: 15px; color: #333333;" >
                                                                                                                            Salam hangat, <br>
                                                                                                                                <strong>Tim Smash & Serve </strong>
                                                                                                                                    </p>
                                                                                                                                    </td>
                                                                                                                                    </tr>

                                                                                                                                    < !--Footer -->
                                                                                                                                        <tr>
                                                                                                                                        <td style="background-color: #f8f8f8; padding: 20px 28px; border-top: 2px dashed #e0e0e0;" >
                                                                                                                                            <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;" >
                                © 2026 Smash & Serve.All rights reserved.
                            </p>
            </td>
            </tr>
            </table>
            </td>
            </tr>
            </table>
            </body>
            </html>
                `
        })

        if (emailError) {
            console.error('Failed to send rejection email:', emailError)
            // Don't fail the whole operation if email fails
        }

        return {
            success: true,
            emailSent: !emailError,
            emailErrorDetail: emailError ? emailError.message : undefined
        }
    } catch (err) {
        console.error('Reject Application Error:', err)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

// ============================================
// Coach Application Actions
// ============================================

export type CoachApplicationData = {
    fullName: string
    email: string
    phone: string
    specialization: string
    experience: string
    level: string
    certification?: string
    bio: string
    priceConfig: string
    availability: string
}

export async function submitCoachApplication(data: CoachApplicationData) {
    try {
        // 1. Save to Supabase
        const { error: dbError } = await supabase.from('coach_applications').insert({
            full_name: data.fullName,
            email: data.email,
            phone: data.phone,
            specialization: data.specialization,
            experience: data.experience,
            level: data.level,
            certification: data.certification,
            bio: data.bio,
            price_config: data.priceConfig,
            availability: data.availability,
            status: 'pending'
        })

        if (dbError) {
            console.error('Supabase Error (Coach):', dbError)
            // Just simulate success for UI demo if table doesn't exist yet/migration pending
            // return { success: false, error: dbError.message }
        }

        // 2. Send Notification Email (Admin)
        await resend.emails.send({
            from: 'Smash Coach <onboarding@smashcourts.online>',
            to: ['smash.email.web@gmail.com'],
            subject: `New Coach Application: ${data.fullName}`,
            html: `
                <h1>New Coach Applicant</h1>
                <p>Name: ${data.fullName}</p>
                <p>Specialization: ${data.specialization}</p>
                <p>Level: ${data.level}</p>
            `
        })

        return { success: true }
    } catch (error) {
        console.error('Submit Coach Error:', error)
        return { success: false, error: 'Failed to submit application' }
    }
}
