"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, MapPin, ArrowRight, Loader2 } from "lucide-react"
import { UserSidebar } from "@/components/UserSidebar"
import { getCurrentUser } from "@/lib/auth/actions"
import { getUserActiveBookings } from "./actions"
import { SmashLogo } from "@/components/SmashLogo"
import { useRouter } from "next/navigation"

export default function BookingSayaPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const userData = await getCurrentUser()
                setUser(userData)

                const { data } = await getUserActiveBookings()
                setBookings(data || [])
            } catch (error) {
                console.error("Failed to load data", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
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

            {/* Logo Link - Absolute Top Right */}
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
                    {/* Sidebar */}
                    <div className="md:block">
                        <UserSidebar user={user} />
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pb-2">
                            <h1 className="text-3xl font-display font-black">Booking Saya</h1>
                            <div className="h-8 w-[2px] bg-gray-200 hidden sm:block"></div>
                            <button
                                onClick={() => router.push('/bookings/history')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-black rounded-full text-xs font-bold border-2 border-transparent hover:border-gray-200 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" /><path d="M3 3v9h9" /><path d="M12 7v5l4 2" /></svg>
                                Riwayat Pemesanan
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : bookings.length > 0 ? (
                            <div className="grid gap-4">
                                {bookings.map((booking, index) => (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white border-2 border-black rounded-xl p-6 shadow-hard transition-transform hover:-translate-y-1 hover:shadow-hard-lg group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 bg-pastel-mint text-xs font-bold px-3 py-1 border-l-2 border-b-2 border-black rounded-bl-xl">
                                            MENUNGGU TANGGAL MAIN
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-mono text-gray-500">#{booking.id.slice(0, 8).toUpperCase()}</span>
                                                </div>

                                                <h3 className="text-2xl font-display font-bold">{booking.court_name}</h3>

                                                <div className="flex flex-col sm:flex-row gap-4 text-sm font-medium text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(booking.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t-2 md:border-t-0 border-gray-100 md:pl-6 md:border-l-2">
                                                <button className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all border-2 border-transparent hover:border-black hover:bg-white hover:text-black shadow-hard-sm">
                                                    Lihat E-Ticket
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-gray-300 rounded-xl">
                                <div className="w-64 h-64 mb-6 relative">
                                    <img
                                        src="/tidak-ada-booking.webp"
                                        alt="Belum ada booking"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <h3 className="text-xl font-bold font-display text-gray-900 mb-2">Belum ada jadwal main</h3>
                                <p className="text-gray-500 max-w-xs text-center mb-8">
                                    Sepertinya kamu belum booking lapangan nih. Yuk cari lapangan kosong dan mulai main!
                                </p>
                                <button
                                    onClick={() => router.push('/booking')}
                                    className="px-8 py-3 bg-pastel-acid text-black border-2 border-black rounded-xl font-bold shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2"
                                >
                                    Booking Sekarang
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
