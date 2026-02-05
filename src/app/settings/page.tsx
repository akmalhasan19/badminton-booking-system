"use client"

import { PageHeader } from "@/components/PageHeader"
import { MobileHeader } from "@/components/MobileHeader"
import { Moon, Bell, Lock, Globe, ChevronRight, Shield, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import Link from "next/link"
import { UserSidebar } from "@/components/UserSidebar"
import { SmashLogo } from "@/components/SmashLogo"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/actions"

const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
    <button
        onClick={onToggle}
        className={`w-14 h-8 rounded-full border-2 border-black p-1 transition-colors relative ${active ? 'bg-pastel-acid' : 'bg-gray-200'}`}
    >
        <motion.div
            layout
            className="w-5 h-5 bg-black rounded-full border border-black"
            animate={{ x: active ? 22 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
    </button>
)

export default function SettingsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState({
        darkMode: false,
        biometric: false
    })

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await getCurrentUser()
                setUser(userData)
            } catch (error) {
                console.error("Failed to fetch user", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
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

            <MobileHeader title="Pengaturan" backPath="/account" />

            <div className="max-w-7xl mx-auto px-4 relative z-10 pt-6 md:pt-0">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Left Sidebar - Hidden on mobile */}
                    <div className="hidden md:block">
                        <UserSidebar user={user} />
                    </div>

                    {/* Right Content */}
                    <div className="space-y-6">
                        {/* Header for Desktop */}
                        <div className="hidden md:block border-b-2 border-black pb-4 mb-2">
                            {/* Uppercase header as requested "PENGATURAN" */}
                            <h1 className="text-4xl font-display font-black uppercase tracking-tight mb-2">PENGATURAN</h1>
                            <p className="text-gray-600 font-medium">Sesuaikan preferensi aplikasi sesuai kebutuhanmu.</p>
                        </div>

                        {/* Mobile Header replacement for content area (optional, but sticking to consistency with desktop view within the grid) */}
                        {/* Actually, for mobile, the MobileHeader component handles the top bar. The content below should be the settings sections. */}

                        <div className="space-y-8">
                            {/* Tampilan */}
                            <section>
                                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 px-2 tracking-wider">Tampilan</h3>
                                <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-hard">
                                    <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-black">
                                                <Moon className="w-5 h-5 text-black" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">Dark Mode</h4>
                                                <p className="text-xs text-gray-500 font-medium">Gunakan tema gelap</p>
                                            </div>
                                        </div>
                                        <Toggle active={settings.darkMode} onToggle={() => toggle('darkMode')} />
                                    </div>
                                </div>
                            </section>

                            {/* Notifikasi */}
                            <section>
                                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 px-2 tracking-wider">Notifikasi</h3>
                                <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-hard transition-transform hover:-translate-y-1 duration-200">
                                    <Link href="/notifications" className="block w-full p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-pastel-yellow rounded-lg flex items-center justify-center border-2 border-black">
                                                    <Bell className="w-5 h-5 text-black" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg">Notifikasi</h4>
                                                    <p className="text-xs text-gray-500 font-medium">Atur preferensi notifikasimu</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </Link>
                                </div>
                            </section>

                            {/* Keamanan */}
                            <section>
                                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 px-2 tracking-wider">Keamanan</h3>
                                <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-hard divide-y-2 divide-gray-100">
                                    <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-pastel-lilac rounded-lg flex items-center justify-center border-2 border-black">
                                                <Shield className="w-5 h-5 text-black" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">Biometric Login</h4>
                                                <p className="text-xs text-gray-500 font-medium">Login dengan sidik jari/wajah</p>
                                            </div>
                                        </div>
                                        <Toggle active={settings.biometric} onToggle={() => toggle('biometric')} />
                                    </div>
                                </div>
                            </section>

                            <div className="pt-8 pb-4 text-center">
                                <button className="text-red-500 font-bold text-sm hover:underline hover:text-red-600 transition-colors">
                                    Delete Account
                                </button>
                                <p className="text-xs text-gray-400 mt-3 font-mono">Smash App v1.2.0 • Build 20240201</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
