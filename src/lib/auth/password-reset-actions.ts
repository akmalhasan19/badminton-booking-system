'use server'

import { createClient } from '@/lib/supabase/server'
import { sendPasswordResetOTP } from '@/lib/resend'

/**
 * Generate a 6-digit OTP code
 */
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send password reset OTP to user's email
 */
export async function sendPasswordResetCode(email: string) {
    const supabase = await createClient()

    // 1. Check if email exists in our system
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('email', email.toLowerCase())
        .single()

    if (userError || !user) {
        // Don't reveal if email exists or not for security
        return { success: true, message: 'Jika email terdaftar, kode verifikasi akan dikirim' }
    }

    // 2. Check rate limiting - max 1 request per 60 seconds
    const { data: existingToken } = await supabase
        .from('password_reset_tokens')
        .select('created_at')
        .eq('email', email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (existingToken) {
        const lastRequest = new Date(existingToken.created_at).getTime()
        const now = Date.now()
        const timeDiff = now - lastRequest
        const RATE_LIMIT = 60 * 1000 // 60 seconds

        if (timeDiff < RATE_LIMIT) {
            const remainingSeconds = Math.ceil((RATE_LIMIT - timeDiff) / 1000)
            return { error: `Tunggu ${remainingSeconds} detik sebelum meminta kode baru` }
        }
    }

    // 3. Generate OTP and set expiry (10 minutes)
    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // 4. Delete old tokens for this email
    await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('email', email.toLowerCase())

    // 5. Store new token
    const { error: insertError } = await supabase
        .from('password_reset_tokens')
        .insert({
            user_id: user.id,
            email: email.toLowerCase(),
            token: otpCode,
            expires_at: expiresAt.toISOString()
        })

    if (insertError) {
        console.error('Failed to store OTP:', insertError)
        return { error: 'Gagal membuat kode verifikasi' }
    }

    // 6. Send email via Resend
    const emailResult = await sendPasswordResetOTP({
        to: email,
        otpCode: otpCode,
        userName: user.full_name
    })

    if (emailResult.error) {
        return { error: emailResult.error }
    }

    return { success: true, message: 'Kode verifikasi telah dikirim ke email Anda' }
}

/**
 * Verify OTP code
 */
export async function verifyPasswordResetCode(email: string, code: string) {
    const supabase = await createClient()

    // 1. Find the token
    const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('token', code)
        .single()

    if (tokenError || !tokenData) {
        return { error: 'Kode verifikasi tidak valid' }
    }

    // 2. Check if token is expired
    const expiresAt = new Date(tokenData.expires_at).getTime()
    if (Date.now() > expiresAt) {
        // Delete expired token
        await supabase
            .from('password_reset_tokens')
            .delete()
            .eq('id', tokenData.id)

        return { error: 'Kode verifikasi sudah kadaluarsa' }
    }

    return { success: true, userId: tokenData.user_id }
}

/**
 * Update password after OTP verification
 */
export async function updatePasswordWithOTP(
    email: string,
    code: string,
    newPassword: string
) {
    const supabase = await createClient()

    // 1. Verify the OTP first
    const verifyResult = await verifyPasswordResetCode(email, code)
    if (verifyResult.error) {
        return { error: verifyResult.error }
    }

    // 2. Validate password strength
    if (newPassword.length < 8) {
        return { error: 'Password harus minimal 8 karakter' }
    }

    // 3. Update password using Supabase Admin API
    // Note: We need to use service role for this
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (updateError) {
        console.error('Failed to update password:', updateError)
        return { error: 'Gagal memperbarui password' }
    }

    // 4. Delete the used token
    await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('email', email.toLowerCase())

    return { success: true, message: 'Password berhasil diubah' }
}
