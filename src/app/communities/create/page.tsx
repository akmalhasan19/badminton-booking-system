"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, Lock, Globe, Save, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { UserSidebar } from "@/components/UserSidebar"
import { MobileHeader } from "@/components/MobileHeader"
import { SmashLogo } from "@/components/SmashLogo"
import { getCurrentUser } from "@/lib/auth/actions"
import { createCommunity } from "../actions"

export default function CreateCommunityPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await getCurrentUser()
            setUser(userData)
        }
        fetchUser()
    }, [])

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        // Append privacy state to formData since it's controlled
        formData.append('privacy', privacy)

        const result = await createCommunity(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            // Redirect to communities page to show the new community
            router.push('/communities')
            router.refresh()
        }
    }

    return (
        <main className="min-h-screen bg-white pt-0 md:pt-6 pb-12 relative overflow-hidden">
            {/* Grid Background */}
            <div
                className="absolute inset-0 z-0 w-full h-full pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(160, 82, 45, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 82, 45, 0.15) 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}
            />

            {/* Logo Link - Absolute Top Right */}
            <div
                onClick={() => router.push('/')}
                className="absolute top-6 right-8 hidden md:flex items-center gap-2 cursor-pointer group z-20"
                title="Kembali ke Beranda"
            >
                <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                    <SmashLogo className="w-full h-full bg-black" />
                </div>
                <span className="text-xl font-display font-bold tracking-tight">Smash<span className="text-pastel-lilac">.</span></span>
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                    Kembali ke Beranda
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-black transform rotate-45"></div>
                </div>
            </div>

            <MobileHeader title="Create Community" backPath="/communities" />

            <div className="max-w-7xl mx-auto px-4 relative z-10 pt-6 md:pt-0">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Sidebar - Hidden on mobile */}
                    <div className="hidden md:block">
                        <UserSidebar user={user} />
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-xl md:text-3xl font-display font-black">Buat Komunitas</h1>
                            <p className="text-sm text-gray-500 font-medium">Buat komunitas badminton kamu sendiri dan undang pemain lain.</p>
                        </div>

                        {/* Form Card */}
                        <div className="bg-white border-2 border-black rounded-xl shadow-hard p-6 md:p-8">
                            <form action={handleSubmit} className="space-y-6">

                                {error && (
                                    <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-bold border-2 border-red-100">
                                        {error}
                                    </div>
                                )}

                                {/* Community Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600" htmlFor="name">Nama Komunitas</label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        placeholder="e.g. Bandung Badminton Club"
                                        required
                                        className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none transition-all placeholder:text-gray-400 font-medium"
                                    />
                                </div>

                                {/* City */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600" htmlFor="city">Kota</label>
                                    <input
                                        type="text"
                                        name="city"
                                        id="city"
                                        placeholder="e.g. Bandung"
                                        required
                                        className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none transition-all placeholder:text-gray-400 font-medium"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600" htmlFor="description">Deskripsi</label>
                                    <textarea
                                        name="description"
                                        id="description"
                                        rows={4}
                                        placeholder="Ceritakan tentang komunitas kamu..."
                                        className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none transition-all placeholder:text-gray-400 font-medium resize-none"
                                    />
                                </div>

                                <div className="h-px bg-gray-200" />

                                {/* Privacy Section */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Privasi Komunitas
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Open Community Option */}
                                        <div
                                            onClick={() => setPrivacy('public')}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${privacy === 'public'
                                                ? 'bg-pastel-mint border-black shadow-hard-sm'
                                                : 'bg-white border-gray-200 hover:border-black'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${privacy === 'public' ? 'border-black bg-black' : 'border-gray-300'
                                                    }`}>
                                                    {privacy === 'public' && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Globe className="w-4 h-4" />
                                                        <span className="font-bold text-black">Komunitas Terbuka</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 leading-relaxed">
                                                        Siapapun bisa menemukan dan bergabung. Cocok untuk mengembangkan komunitas.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Private Community Option */}
                                        <div
                                            onClick={() => setPrivacy('private')}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${privacy === 'private'
                                                ? 'bg-pastel-yellow border-black shadow-hard-sm'
                                                : 'bg-white border-gray-200 hover:border-black'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${privacy === 'private' ? 'border-black bg-black' : 'border-gray-300'
                                                    }`}>
                                                    {privacy === 'private' && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Lock className="w-4 h-4" />
                                                        <span className="font-bold text-black">Komunitas Privat</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 leading-relaxed">
                                                        Hanya yang diundang admin yang bisa bergabung. Cocok untuk grup privat.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full md:w-auto px-8 py-4 bg-pastel-acid text-black rounded-xl font-bold text-lg border-2 border-black shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Simpan Komunitas
                                            </>
                                        )}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
