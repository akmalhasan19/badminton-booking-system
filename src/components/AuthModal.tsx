"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Zap, Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react"
import { signIn, signUp, getGoogleAuthUrl, getCurrentUser } from "@/lib/auth/actions"

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: { name: string; email: string; avatar_url?: string }) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: ''
    })

    if (!isOpen) return null;

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        const result = await getGoogleAuthUrl();

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else if (result.url) {
            // Redirect to Google OAuth
            window.location.href = result.url;
        }
    }

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (mode === 'register') {
                if (formData.password !== formData.confirmPassword) {
                    setError("Passwords do not match");
                    setIsLoading(false);
                    return;
                }

                const result = await signUp({
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.name,
                    phone: formData.phone
                });

                if (result.error) {
                    setError(result.error);
                    setIsLoading(false);
                    return;
                }

                // If session was not created immediately, it means email confirmation is required
                if (!result.isSessionCreated) {
                    setIsLoading(false);
                    // Show a success message
                    setSuccessMessage('Account created! Please check your email to confirm your account before logging in.');
                    return;
                }

                // Auto sign in after registration (only if session was created)
                const signInResult = await signIn({
                    email: formData.email,
                    password: formData.password
                });

                if (signInResult.error) {
                    setError(signInResult.error);
                    setIsLoading(false);
                    return;
                }
            } else {
                const result = await signIn({
                    email: formData.email,
                    password: formData.password
                });

                if (result.error) {
                    setError(result.error);
                    setIsLoading(false);
                    return;
                }
            }

            // Success - fetch the actual user data from database
            const currentUser = await getCurrentUser();
            if (currentUser) {
                onLoginSuccess({
                    name: currentUser.name,
                    email: currentUser.email,
                    avatar_url: currentUser.avatar_url
                });
            }
            onClose();
        } catch (err) {
            console.error("Auth error:", err); // Log error to console for debugging
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md"
                onClick={() => !isLoading && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-[2.5rem] p-6 md:p-8 w-full max-w-[400px] shadow-2xl border-2 border-black relative overflow-y-auto max-h-[85vh]"
                >
                    {/* Close Button */}
                    {!isLoading && (
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-[80]"
                        >
                            <X className="w-6 h-6 text-black" />
                        </button>
                    )}

                    {/* Header */}
                    <div className="text-center mb-6 relative z-10">
                        <div className="w-12 h-12 bg-pastel-acid rounded-2xl border-2 border-black flex items-center justify-center shadow-hard mx-auto mb-4 transform -rotate-3">
                            <Zap className="w-6 h-6 text-black" />
                        </div>
                        <h3 className="text-2xl font-display font-black text-black uppercase mb-1 tracking-tight">
                            {mode === 'login' ? 'Welcome Back' : 'Join the Squad'}
                        </h3>
                        <p className="text-gray-500 font-medium">
                            {mode === 'login' ? 'Ready to smash some shuttles?' : 'Create an account to start booking.'}
                        </p>

                        {/* Error Display */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600 font-medium text-left">
                                    {typeof error === 'object' ? JSON.stringify(error) : error}
                                </p>
                            </div>
                        )}

                        {/* Success Display */}
                        {successMessage && (
                            <div className="mt-4 p-3 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-2">
                                <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-green-600 font-medium text-left">{successMessage}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 relative z-10">
                        {/* Google Button - Temporarily disabled until Google OAuth is configured in Supabase */}
                        {/* <button
                            onClick={handleGoogleAuth}
                            disabled={isLoading}
                            className="w-full bg-white border-2 border-gray-200 rounded-xl px-6 py-3 font-bold text-gray-700 hover:border-black hover:text-black transition-all hover:bg-gray-50 flex items-center justify-center gap-3 group"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-gray-400 border-t-black rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-4 text-gray-500 font-bold uppercase tracking-widest text-xs">Or</span>
                            </div>
                        </div> */}

                        {/* Email Form */}
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            {mode === 'register' && (
                                <>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 font-bold focus:outline-none focus:border-black focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                        <input
                                            type="tel"
                                            placeholder="Phone Number (Optional)"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 font-bold focus:outline-none focus:border-black focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 font-bold focus:outline-none focus:border-black focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-12 py-3 font-bold focus:outline-none focus:border-black focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            {mode === 'register' && (
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Re-enter Password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-12 py-3 font-bold focus:outline-none focus:border-black focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors focus:outline-none"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-black text-white border-2 border-black rounded-xl px-6 py-3 font-bold text-lg hover:bg-pastel-acid hover:text-black shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        {mode === 'login' ? 'Log In' : 'Create Account'}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Toggle Mode */}
                        <div className="text-center pt-2">
                            <button
                                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
                            >
                                {mode === 'login' ? (
                                    <>Don't have an account? <span className="font-bold underline text-black">Register</span></>
                                ) : (
                                    <>Already have an account? <span className="font-bold underline text-black">Log In</span></>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
