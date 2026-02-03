"use client"

import { UserSidebar } from "@/components/UserSidebar"
import { SmashLogo } from "@/components/SmashLogo"
import { getCurrentUser } from "@/lib/auth/actions"
import { ChevronRight, CreditCard, Plus, Wallet, Link as LinkIcon, Smartphone, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PaymentMethodsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await getCurrentUser()
            setUser(userData)
        }
        fetchUser()
    }, [])

    return (
        <main className="min-h-screen bg-white pt-6 pb-12 relative overflow-hidden">
            {/* Grid Background */}
            <div
                className="absolute inset-0 z-0 w-full h-full pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(160, 82, 45, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 82, 45, 0.15) 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}
            />

            {/* Logo Link */}
            <div
                onClick={() => router.push('/')}
                className="absolute top-6 right-8 flex items-center gap-2 cursor-pointer group z-20"
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

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Left Sidebar */}
                    <div className="space-y-6">
                        <UserSidebar user={user} />
                    </div>

                    {/* Right Content */}
                    <div className="space-y-8">
                        <h1 className="text-3xl font-display font-black">Metode Pembayaran</h1>

                        {/* Section 1: Kartu Kredit & Debit */}
                        <div className="space-y-4">
                            <h2 className="font-bold text-lg">Kartu Kredit & Debit</h2>
                            <div className="bg-white border-2 border-black rounded-xl p-1 shadow-hard">
                                {/* Existing Card Example (commented out or can be added) */}

                                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-pastel-acid/20 border border-transparent hover:border-black rounded-lg transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-7 bg-white border-2 border-black rounded flex items-center justify-center">
                                            <CreditCard className="w-4 h-4 text-black" />
                                        </div>
                                        <span className="font-bold text-sm">Tambah Kartu</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Section 2: Linked Account */}
                        <div className="space-y-4">
                            <h2 className="font-bold text-lg">Linked Account</h2>
                            <div className="bg-white border-2 border-black rounded-xl p-6 shadow-hard text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full border-2 border-black flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
                                    <LinkIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium text-sm">Belum ada akun terhubung.</p>
                                <button className="mt-4 px-6 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors">
                                    Hubungkan Akun
                                </button>
                            </div>
                        </div>

                        {/* Section 3: Rekening Bank */}
                        <div className="space-y-4">
                            <h2 className="font-bold text-lg">Rekening Bank</h2>
                            <div className="bg-white border-2 border-black rounded-xl p-1 shadow-hard">
                                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-pastel-blue/20 border border-transparent hover:border-black rounded-lg transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white border-2 border-black rounded flex items-center justify-center">
                                            <span className="font-black text-xs">BANK</span>
                                        </div>
                                        <span className="font-bold text-sm">Tambah Rekening</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    )
}
