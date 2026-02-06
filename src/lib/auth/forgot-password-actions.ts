'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { sendPasswordResetEmail } from '@/lib/email/email-service'
import crypto from 'crypto'

/**
 * Request a password reset email
 * Returns success regardless of whether email exists (security)
 */
export async function requestPasswordReset(email: string) {
    try {
        const supabase = createServiceClient()

        // Check if user exists
        const { data: user } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', email.toLowerCase())
            .single()

        // If user doesn't exist, still return success (don't reveal)
        if (!user) {
            console.log(`[PasswordReset] Email not found: ${email}`)
            return { success: true, message: 'If that email exists, we sent you a reset link.' }
        }

        // Generate secure random token
        const token = crypto.randomBytes(32).toString('hex')

        // Set expiration to 1 hour from now
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

        // Delete any existing tokens for this email
        await supabase
            .from('password_reset_tokens')
            .delete()
            .eq('email', email.toLowerCase())

        // Store token in database
        const { error: insertError } = await supabase
            .from('password_reset_tokens')
            .insert({
                user_id: user.id,
                email: email.toLowerCase(),
                token,
                expires_at: expiresAt
            })

        if (insertError) {
            console.error('[PasswordReset] Failed to store token:', insertError)
            throw new Error('Failed to create reset token')
        }

        // Send email with reset link
        await sendPasswordResetEmail(email, token)

        console.log(`[PasswordReset] Reset email sent to: ${email}`)
        return { success: true, message: 'If that email exists, we sent you a reset link.' }

    } catch (error: any) {
        console.error('[PasswordReset] Error:', error)
        return { success: false, error: 'An error occurred. Please try again.' }
    }
}

/**
 * Verify if a reset token is valid
 */
export async function verifyResetToken(token: string) {
    try {
        const supabase = createServiceClient()

        const { data: resetToken, error } = await supabase
            .from('password_reset_tokens')
            .select('*')
            .eq('token', token)
            .single()

        if (error || !resetToken) {
            return { valid: false, error: 'Invalid reset token' }
        }

        // Check if token is expired
        if (new Date(resetToken.expires_at) < new Date()) {
            return { valid: false, error: 'Reset token has expired' }
        }

        return {
            valid: true,
            email: resetToken.email,
            userId: resetToken.user_id
        }

    } catch (error: any) {
        console.error('[PasswordReset] Verify error:', error)
        return { valid: false, error: 'Invalid reset token' }
    }
}

/**
 * Reset password using valid token
 */
export async function resetPassword(token: string, newPassword: string) {
    try {
        const supabase = createServiceClient()

        // Verify token first
        const verification = await verifyResetToken(token)
        if (!verification.valid || !verification.userId) {
            return { success: false, error: verification.error || 'Invalid token' }
        }

        // Update password via Supabase Auth
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            verification.userId,
            { password: newPassword }
        )

        if (updateError) {
            console.error('[PasswordReset] Failed to update password:', updateError)
            return { success: false, error: 'Failed to update password' }
        }

        // Delete the used token
        await supabase
            .from('password_reset_tokens')
            .delete()
            .eq('token', token)

        console.log(`[PasswordReset] Password updated for user: ${verification.email}`)
        return { success: true, message: 'Password updated successfully' }

    } catch (error: any) {
        console.error('[PasswordReset] Reset error:', error)
        return { success: false, error: 'Failed to reset password' }
    }
}
