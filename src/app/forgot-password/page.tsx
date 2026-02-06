'use client'

import { useState } from 'react'
import { requestPasswordReset } from '@/lib/auth/forgot-password-actions'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight, Loader2, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || countdown > 0) return

        setIsLoading(true)

        try {
            const res = await requestPasswordReset(email)

            if (res.success) {
                setIsSubmitted(true)
                toast.success('Check your email for reset instructions')

                // Start 60 second countdown
                setCountdown(60)
                const interval = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(interval)
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)
            } else {
                toast.error(res.error || 'Something went wrong')
            }
        } catch (error) {
            toast.error('Failed to send reset email')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4 font-sans text-neo-black relative overflow-hidden">

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-neo-blue rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-neo-green rounded-full blur-[100px]" />
            </div>

            <div className="bg-white border-3 border-neo-black p-8 max-w-md w-full shadow-hard relative z-10">
                {!isSubmitted ? (
                    <>
                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 bg-neo-blue border-3 border-neo-black flex items-center justify-center shadow-hard-sm">
                                <Mail className="w-8 h-8" />
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black uppercase mb-2 italic">Forgot Password</h1>
                            <p className="font-mono text-gray-500 text-sm">
                                Enter your email to receive a password reset link.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block font-bold text-sm uppercase">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-3 border-2 border-neo-black font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue focus:shadow-hard-sm transition-all bg-gray-50"
                                    placeholder="your.email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading || countdown > 0}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || countdown > 0}
                                className="w-full py-4 bg-neo-black text-white font-black uppercase tracking-wider border-2 border-neo-black hover:bg-gray-800 hover:shadow-hard transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : countdown > 0 ? (
                                    `Wait ${countdown}s`
                                ) : (
                                    <>
                                        Send Reset Link
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 text-center space-y-2">
                            <Link href="/admin/login" className="block text-sm font-bold text-gray-500 hover:text-neo-black hover:underline underline-offset-4">
                                ← Back to Login
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 bg-neo-green border-3 border-neo-black flex items-center justify-center shadow-hard-sm">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black uppercase mb-2 italic">Check Your Email</h1>
                            <p className="font-mono text-gray-500 text-sm">
                                If an account exists with <strong>{email}</strong>, we've sent password reset instructions.
                            </p>
                        </div>

                        <div className="bg-neo-yellow border-2 border-neo-black p-4 mb-6">
                            <p className="text-sm font-mono">
                                <strong>📧 Didn't receive the email?</strong><br />
                                Check your spam folder or try again in {countdown > 0 ? countdown : '60'} seconds.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setIsSubmitted(false)
                                    setEmail('')
                                }}
                                disabled={countdown > 0}
                                className="w-full py-3 bg-gray-100 text-black font-bold border-2 border-neo-black hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Try Different Email
                            </button>

                            <Link
                                href="/admin/login"
                                className="block w-full py-3 text-center bg-neo-black text-white font-bold border-2 border-neo-black hover:bg-gray-800 transition-all"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
