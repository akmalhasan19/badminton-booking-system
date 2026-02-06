'use client'

import { useState, useEffect, Suspense } from 'react'
import { verifyResetToken, resetPassword } from '@/lib/auth/forgot-password-actions'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight, Loader2, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [isVerifying, setIsVerifying] = useState(true)
    const [isValidToken, setIsValidToken] = useState(false)
    const [email, setEmail] = useState('')
    const [tokenError, setTokenError] = useState('')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Verify token on mount
    useEffect(() => {
        if (!token) {
            setTokenError('No reset token provided')
            setIsVerifying(false)
            return
        }

        const checkToken = async () => {
            const result = await verifyResetToken(token)

            if (result.valid && result.email) {
                setIsValidToken(true)
                setEmail(result.email)
            } else {
                setTokenError(result.error || 'Invalid token')
            }
            setIsVerifying(false)
        }

        checkToken()
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (!token) return

        setIsLoading(true)

        try {
            const res = await resetPassword(token, password)

            if (res.success) {
                toast.success('Password updated successfully!')
                setTimeout(() => {
                    router.push('/admin/login')
                }, 1500)
            } else {
                toast.error(res.error || 'Failed to reset password')
            }
        } catch (error) {
            toast.error('An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    // Loading state
    if (isVerifying) {
        return (
            <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4">
                <div className="bg-white border-3 border-neo-black p-12 shadow-hard">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto" />
                    <p className="text-center font-mono mt-4">Verifying token...</p>
                </div>
            </div>
        )
    }

    // Invalid token state
    if (!isValidToken) {
        return (
            <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4 font-sans text-neo-black">
                <div className="bg-white border-3 border-neo-black p-8 max-w-md w-full shadow-hard">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-red-100 border-3 border-neo-black flex items-center justify-center shadow-hard-sm">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black uppercase mb-2 italic">Invalid Link</h1>
                        <p className="font-mono text-gray-500 text-sm">{tokenError}</p>
                    </div>

                    <div className="bg-red-50 border-2 border-red-200 p-4 mb-6">
                        <p className="text-sm font-mono text-red-800">
                            <strong>Common reasons:</strong><br />
                            • Link has expired (1 hour limit)<br />
                            • Link was already used<br />
                            • Invalid or malformed link
                        </p>
                    </div>

                    <Link
                        href="/forgot-password"
                        className="block w-full py-4 text-center bg-neo-black text-white font-black uppercase border-2 border-neo-black hover:bg-gray-800 hover:shadow-hard transition-all"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        )
    }

    // Password strength indicator
    const getPasswordStrength = () => {
        if (password.length === 0) return null
        if (password.length < 8) return { label: 'Too Short', color: 'red' }
        if (password.length < 12) return { label: 'Good', color: 'yellow' }
        return { label: 'Strong', color: 'green' }
    }

    const strength = getPasswordStrength()

    // Valid token - show reset form
    return (
        <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4 font-sans text-neo-black relative overflow-hidden">

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-neo-blue rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-neo-green rounded-full blur-[100px]" />
            </div>

            <div className="bg-white border-3 border-neo-black p-8 max-w-md w-full shadow-hard relative z-10">
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-neo-green border-3 border-neo-black flex items-center justify-center shadow-hard-sm">
                        <Lock className="w-8 h-8" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black uppercase mb-2 italic">Reset Password</h1>
                    <p className="font-mono text-gray-500 text-sm">
                        Choose a new password for <strong>{email}</strong>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block font-bold text-sm uppercase">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full p-3 pr-12 border-2 border-neo-black font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue focus:shadow-hard-sm transition-all bg-gray-50"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {strength && (
                            <div className="flex items-center gap-2 text-xs font-mono">
                                <div className={`h-1 flex-1 rounded ${strength.color === 'red' ? 'bg-red-500' :
                                    strength.color === 'yellow' ? 'bg-yellow-500' :
                                        'bg-green-500'
                                    }`} />
                                <span className={
                                    strength.color === 'red' ? 'text-red-600' :
                                        strength.color === 'yellow' ? 'text-yellow-600' :
                                            'text-green-600'
                                }>{strength.label}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block font-bold text-sm uppercase">Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full p-3 border-2 border-neo-black font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue focus:shadow-hard-sm transition-all bg-gray-50"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {confirmPassword && (
                            <div className="flex items-center gap-2 text-xs font-mono">
                                {password === confirmPassword ? (
                                    <><CheckCircle className="w-4 h-4 text-green-600" /> <span className="text-green-600">Passwords match</span></>
                                ) : (
                                    <><XCircle className="w-4 h-4 text-red-600" /> <span className="text-red-600">Passwords don't match</span></>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || password !== confirmPassword || password.length < 8}
                        className="w-full py-4 bg-neo-black text-white font-black uppercase tracking-wider border-2 border-neo-black hover:bg-gray-800 hover:shadow-hard transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Reset Password
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 text-center">
                    <Link href="/admin/login" className="text-sm font-bold text-gray-500 hover:text-neo-black hover:underline underline-offset-4">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}

// Loading fallback component
function ResetPasswordLoading() {
    return (
        <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4">
            <div className="bg-white border-3 border-neo-black p-12 shadow-hard">
                <Loader2 className="w-12 h-12 animate-spin mx-auto" />
                <p className="text-center font-mono mt-4">Loading...</p>
            </div>
        </div>
    )
}

// Main exported page component with Suspense boundary
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetPasswordLoading />}>
            <ResetPasswordContent />
        </Suspense>
    )
}
