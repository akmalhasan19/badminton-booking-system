"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Users, Lock, Globe, Save } from "lucide-react"
import { motion } from "framer-motion"
import { createCommunity } from "../actions"

export default function CreateCommunityPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public')
    const [error, setError] = useState<string | null>(null)

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
            // Redirect to Home page as requested
            router.push('/')
            router.refresh()
        }
    }

    return (
        <main className="min-h-screen bg-white pb-20 pt-20 px-4 font-display">
            {/* Header */}
            <div className="bg-gradient-to-r from-black via-gray-800 to-black text-white px-4 py-4 fixed top-0 left-0 right-0 z-50 flex items-center justify-between shadow-md">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-display font-bold">Create Community</h1>
                <div className="w-10" /> {/* Spacer for centering */}
            </div>

            <form action={handleSubmit} className="max-w-md mx-auto space-y-4">

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-bold border-2 border-red-100">
                        {error}
                    </div>
                )}

                {/* Community Name */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-black" htmlFor="name">Community Name</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        placeholder="e.g. Bandung Badminton Club"
                        required
                        className="w-full p-4 rounded-xl border-2 border-black shadow-hard-sm focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all placeholder:text-gray-400 font-medium"
                    />
                </div>

                {/* City */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-black" htmlFor="city">City / Kota</label>
                    <input
                        type="text"
                        name="city"
                        id="city"
                        placeholder="e.g. Bandung"
                        required
                        className="w-full p-4 rounded-xl border-2 border-black shadow-hard-sm focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all placeholder:text-gray-400 font-medium"
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-black" htmlFor="description">Description</label>
                    <textarea
                        name="description"
                        id="description"
                        rows={4}
                        placeholder="Tell us about your community..."
                        className="w-full p-4 rounded-xl border-2 border-black shadow-hard-sm focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all placeholder:text-gray-400 font-medium resize-none"
                    />
                </div>

                <div className="h-px bg-gray-200 my-6" />

                {/* Privacy Section */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-black flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Community Privacy
                    </label>

                    <div className="grid grid-cols-1 gap-3">
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
                                        <span className="font-bold text-black">Open Community</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Anyone can find and join this community. Best for growing your club.
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
                                        <span className="font-bold text-black">Private Community</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Only people invited by admin can join. Good for private groups.
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
                        className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Community
                            </>
                        )}
                    </button>
                </div>

            </form>
        </main>
    )
}
