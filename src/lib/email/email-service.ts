import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Smash & Serve <noreply@smashpartner.online>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Send password reset email with verification link
 */
export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', monospace; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 40px auto; padding: 20px;">
        <div style="background: #ffffff; border: 3px solid #000000; padding: 40px; box-shadow: 8px 8px 0px #000000;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: -1px;">
                    SMASH<span style="color: #a855f7;">.</span>
                </h1>
            </div>

            <!-- Title -->
            <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; color: #000;">
                Reset Your Password
            </h2>

            <!-- Body -->
            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #333;">
                We received a request to reset your password. Click the button below to choose a new password:
            </p>

            <!-- Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; 
                          padding: 16px 40px; 
                          background: #000000; 
                          color: #ffffff; 
                          text-decoration: none; 
                          font-weight: 900; 
                          border: 2px solid #000000; 
                          text-transform: uppercase; 
                          font-size: 14px;
                          letter-spacing: 1px;
                          box-shadow: 4px 4px 0px #a855f7;">
                    RESET PASSWORD
                </a>
            </div>

            <!-- Warning -->
            <div style="background: #fef3c7; border: 2px solid #000000; padding: 15px; margin-top: 30px;">
                <p style="font-size: 12px; margin: 0; color: #92400e; font-weight: bold;">
                    ⚠️ This link expires in 1 hour
                </p>
            </div>

            <!-- Footer -->
            <p style="font-size: 12px; color: #666; margin-top: 30px; line-height: 1.5;">
                If you didn't request this password reset, you can safely ignore this email. 
                Your password will remain unchanged.
            </p>

            <hr style="border: none; border-top: 2px dashed #ccc; margin: 30px 0;">

            <p style="font-size: 11px; color: #999; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} Smash & Serve. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim()

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Reset Your Password - Smash & Serve',
            html: htmlContent,
        })

        if (error) {
            console.error('[Email] Failed to send password reset email:', error)
            throw new Error('Failed to send email')
        }

        console.log('[Email] Password reset email sent:', data?.id)
        return { success: true, emailId: data?.id }

    } catch (error: any) {
        console.error('[Email] Error sending password reset email:', error)
        throw error
    }
}
