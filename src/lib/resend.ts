import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

interface SendOTPEmailParams {
    to: string
    otpCode: string
    userName?: string
}

export async function sendPasswordResetOTP({ to, otpCode, userName }: SendOTPEmailParams) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Smash & Serve <noreply@smashserve.id>',
            to: to,
            subject: 'Kode Verifikasi Reset Password',
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
                <table width="100%" max-width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 3px solid #000000; border-radius: 16px; overflow: hidden; box-shadow: 6px 6px 0px #000000;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #E0F55D; padding: 24px; text-align: center; border-bottom: 3px solid #000000;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #000000; letter-spacing: -0.5px;">
                                🏸 Smash & Serve
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 32px 24px;">
                            <p style="margin: 0 0 16px; font-size: 16px; color: #333333;">
                                Halo${userName ? ` <strong>${userName}</strong>` : ''},
                            </p>
                            <p style="margin: 0 0 24px; font-size: 15px; color: #666666; line-height: 1.6;">
                                Kami menerima permintaan untuk reset password akun Anda. Gunakan kode verifikasi berikut:
                            </p>
                            
                            <!-- OTP Code Box -->
                            <div style="background-color: #f8f8f8; border: 3px solid #000000; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
                                <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #000000; font-family: monospace;">
                                    ${otpCode}
                                </span>
                            </div>
                            
                            <p style="margin: 0 0 8px; font-size: 13px; color: #999999; text-align: center;">
                                ⏱️ Kode ini berlaku selama <strong>10 menit</strong>
                            </p>
                            <p style="margin: 0; font-size: 13px; color: #999999; text-align: center;">
                                Jika Anda tidak meminta reset password, abaikan email ini.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 20px 24px; border-top: 2px dashed #e0e0e0;">
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
            `,
        })

        if (error) {
            console.error('Resend error:', error)
            return { error: error.message }
        }

        return { success: true, emailId: data?.id }
    } catch (error) {
        console.error('Failed to send email:', error)
        return { error: 'Gagal mengirim email verifikasi' }
    }
}
