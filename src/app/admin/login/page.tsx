'use client'

import { useState } from 'react'
import { signIn } from '@/lib/auth/actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight, Loader2, Lock } from 'lucide-react'

export default function AdminLoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await signIn(formData)

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Welcome back, Admin!')
                router.push('/admin')
                router.refresh()
            }
        } catch (error) {
            toast.error('Something went wrong')
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
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-neo-yellow border-3 border-neo-black flex items-center justify-center shadow-hard-sm">
                        <Lock className="w-8 h-8" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black uppercase mb-2 italic">Admin Login</h1>
                    <p className="font-mono text-gray-500 text-sm">Secure checkpoint using database credentials.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block font-bold text-sm uppercase">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full p-3 border-2 border-neo-black font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue focus:shadow-hard-sm transition-all bg-gray-50"
                            placeholder="admin@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block font-bold text-sm uppercase">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full p-3 border-2 border-neo-black font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue focus:shadow-hard-sm transition-all bg-gray-50"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-neo-black text-white font-black uppercase tracking-wider border-2 border-neo-black hover:bg-gray-800 hover:shadow-hard transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                Enter Dashboard
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 text-center">
                    <Link href="/" className="text-sm font-bold text-gray-500 hover:text-neo-black hover:underline underline-offset-4">
                        ← Back to Website
                    </Link>
                </div>
            </div>
        </div>
    )
}
