"use client"

import { PageHeader } from "@/components/PageHeader"
import { Moon, Bell, Lock, Globe, ChevronRight, Shield } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

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
    const [settings, setSettings] = useState({
        darkMode: false,
        emailNotif: true,
        pushNotif: true,
        biometric: false
    })

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <main className="min-h-screen bg-white pt-24 pb-12">
            <div className="max-w-2xl mx-auto px-4">
                <PageHeader
                    title="Pengaturan"
                    description="Sesuaikan preferensi aplikasi sesuai kebutuhanmu."
                />

                <div className="space-y-8">
                    {/* Tampilan */}
                    <section>
                        <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 px-2">Tampilan</h3>
                        <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-hard">
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-black">
                                        <Moon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Dark Mode</h4>
                                        <p className="text-xs text-gray-500">Gunakan tema gelap</p>
                                    </div>
                                </div>
                                <Toggle active={settings.darkMode} onToggle={() => toggle('darkMode')} />
                            </div>
                        </div>
                    </section>

                    {/* Notifikasi */}
                    <section>
                        <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 px-2">Notifikasi</h3>
                        <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-hard divide-y-2 divide-gray-100">
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-pastel-yellow rounded-lg flex items-center justify-center border-2 border-black">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Email Notification</h4>
                                        <p className="text-xs text-gray-500">Terima update via email</p>
                                    </div>
                                </div>
                                <Toggle active={settings.emailNotif} onToggle={() => toggle('emailNotif')} />
                            </div>
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-pastel-mint rounded-lg flex items-center justify-center border-2 border-black">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Push Notification</h4>
                                        <p className="text-xs text-gray-500">Notifikasi di HP</p>
                                    </div>
                                </div>
                                <Toggle active={settings.pushNotif} onToggle={() => toggle('pushNotif')} />
                            </div>
                        </div>
                    </section>

                    {/* Keamanan */}
                    <section>
                        <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 px-2">Keamanan</h3>
                        <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-hard divide-y-2 divide-gray-100">
                            <button className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors text-left">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-pastel-pink rounded-lg flex items-center justify-center border-2 border-black">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Ubah Password</h4>
                                        <p className="text-xs text-gray-500">Update kata sandi akunmu</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-pastel-lilac rounded-lg flex items-center justify-center border-2 border-black">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Biometric Login</h4>
                                        <p className="text-xs text-gray-500">Login dengan sidik jari/wajah</p>
                                    </div>
                                </div>
                                <Toggle active={settings.biometric} onToggle={() => toggle('biometric')} />
                            </div>
                        </div>
                    </section>

                    <div className="pt-4 text-center">
                        <button className="text-red-500 font-bold text-sm hover:underline">
                            Delete Account
                        </button>
                        <p className="text-xs text-gray-400 mt-2">Smash App v1.2.0 • Build 20240201</p>
                    </div>
                </div>
            </div>
        </main>
    )
}
