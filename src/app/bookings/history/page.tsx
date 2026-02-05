"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Loader2, AlertTriangle } from "lucide-react"
import { UserSidebar } from "@/components/UserSidebar"
import { MobileHeader } from "@/components/MobileHeader"
import { getCurrentUser } from "@/lib/auth/actions"
import { getUserBookingHistory } from "../actions"
import { SmashLogo } from "@/components/SmashLogo"
import { useRouter } from "next/navigation"

export default function BookingHistoryPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'completed' | 'cancelled' | 'pending'>('pending')

    const [searchParams] = useState(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''));

    useEffect(() => {
        const loadData = async () => {
            try {
                const userData = await getCurrentUser()
                setUser(userData)

                // Check for payment confirmation
                const paymentStatus = searchParams.get('payment')
                const bookingId = searchParams.get('booking_id')

                if (paymentStatus === 'success' && bookingId) {
                    setLoading(true)
                    const { confirmBookingPayment } = await import('@/lib/api/actions')
                    await confirmBookingPayment(bookingId)
                    window.history.replaceState({}, '', '/bookings/history')
                }

                const { data } = await getUserBookingHistory()
                setBookings(data || [])
            } catch (error) {
                console.error("Failed to load data", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [searchParams])

    const filteredBookings = bookings.filter(b => {
        if (activeTab === 'completed') return b.status === 'completed' || b.status === 'confirmed'
        if (activeTab === 'cancelled') return b.status === 'cancelled'
        if (activeTab === 'pending') return b.status === 'pending'
        return false
    })

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

            {/* Logo Link - Hidden on Mobile */}
            <div
                onClick={() => router.push('/')}
                className="absolute top-6 right-8 hidden md:flex items-center gap-2 cursor-pointer group z-20"
                title="Kembali ke Beranda"
            >
                <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                    <SmashLogo className="w-full h-full bg-black" />
                </div>
                <span className="text-xl font-display font-bold tracking-tight">Smash<span className="text-pastel-lilac">.</span></span>
                <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                    Kembali ke Beranda
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-black transform rotate-45"></div>
                </div>
            </div>

            {/* Mobile Header */}
            <MobileHeader title="Riwayat Pemesanan" backPath="/bookings" />

            <div className="max-w-7xl mx-auto px-3 md:px-4 relative z-10 pt-4 md:pt-0">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Sidebar - Hidden on Mobile */}
                    <div className="hidden md:block">
                        <UserSidebar user={user} />
                    </div>

                    {/* Main Content */}
                    <div className="space-y-4 md:space-y-6">
                        {/* Desktop Title */}
                        <h1 className="hidden md:block text-3xl font-display font-black">Riwayat Pemesanan</h1>

                        {/* Tabs - Full Width on Mobile */}
                        <div className="flex border-b-2 border-gray-100 -mx-3 md:mx-0">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`flex-1 px-2 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap text-center ${activeTab === 'pending'
                                    ? 'border-yellow-500 text-yellow-600'
                                    : 'border-transparent text-gray-400 hover:text-gray-700'
                                    }`}
                            >
                                Menunggu
                            </button>
                            <button
                                onClick={() => setActiveTab('completed')}
                                className={`flex-1 px-2 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap text-center ${activeTab === 'completed'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-400 hover:text-gray-700'
                                    }`}
                            >
                                Selesai
                            </button>
                            <button
                                onClick={() => setActiveTab('cancelled')}
                                className={`flex-1 px-2 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap text-center ${activeTab === 'cancelled'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-400 hover:text-gray-700'
                                    }`}
                            >
                                Dibatalkan
                            </button>
                        </div>

                        {/* History List */}
                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : filteredBookings.length > 0 ? (
                            <div className="grid gap-3">
                                {filteredBookings.map((booking, index) => (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white border-2 border-black rounded-xl p-3 md:p-5 shadow-hard transition-transform hover:-translate-y-1 hover:shadow-hard-lg relative overflow-hidden"
                                    >
                                        {/* Status Badge */}
                                        <div className={`absolute top-0 right-0 text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 md:py-1 border-l-2 border-b-2 border-black rounded-bl-xl ${booking.status === 'completed' || booking.status === 'confirmed'
                                            ? 'bg-green-300'
                                            : booking.status === 'pending'
                                                ? 'bg-yellow-300'
                                                : 'bg-red-300'
                                            }`}>
                                            {booking.status === 'completed' ? 'SELESAI' : (booking.status === 'confirmed' ? 'LUNAS' : (booking.status === 'pending' ? 'BELUM BAYAR' : 'DIBATALKAN'))}
                                        </div>

                                        <div className="flex flex-col gap-2 mt-1">
                                            {/* Booking ID */}
                                            <span className="text-[10px] md:text-xs font-mono text-gray-400">
                                                #{booking.id.slice(0, 8).toUpperCase()}
                                            </span>

                                            {/* Court Name */}
                                            <h3 className="text-base md:text-lg font-display font-bold leading-tight">
                                                {booking.court_name}
                                            </h3>

                                            {/* Date & Time */}
                                            <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-500 font-medium">
                                                <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                {new Date(booking.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>

                                            {/* Price & Action Row */}
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-gray-200">
                                                <span className="text-sm md:text-base font-bold">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(booking.price)}
                                                </span>

                                                {booking.status === 'completed' || booking.status === 'confirmed' ? (
                                                    <button
                                                        onClick={() => router.push('/booking')}
                                                        className="px-3 py-1.5 bg-pastel-acid text-black border-2 border-black rounded-lg text-[10px] md:text-xs font-bold shadow-hard-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                                    >
                                                        Booking Lagi
                                                    </button>
                                                ) : booking.status === 'pending' ? (
                                                    <a
                                                        href={booking.payment_url || `/bookings/history?payment=success&booking_id=${booking.id}`}
                                                        className="px-3 py-1.5 bg-black text-white border-2 border-black rounded-lg text-[10px] md:text-xs font-bold shadow-hard-sm hover:bg-gray-800 transition-all"
                                                    >
                                                        Bayar Sekarang
                                                    </a>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-400 font-medium">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Refunded
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 md:py-20 bg-white border-2 border-dashed border-gray-300 rounded-xl">
                                <div className="w-32 h-32 md:w-48 md:h-48 mb-4 md:mb-6 relative grayscale opacity-60">
                                    <img
                                        src="/tidak-ada-booking.webp"
                                        alt="Belum ada riwayat"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold font-display text-gray-900 mb-2 text-center">
                                    {activeTab === 'completed' ? 'Belum ada pesanan selesai' : (activeTab === 'pending' ? 'Tidak ada tagihan' : 'Tidak ada pesanan dibatalkan')}
                                </h3>
                                <p className="text-gray-500 text-sm max-w-xs text-center px-4">
                                    {activeTab === 'completed' ? 'Kamu belum menyelesaikan pesanan apapun.' : (activeTab === 'pending' ? 'Semua pesananmu sudah lunas!' : 'Riwayat pembatalanmu kosong.')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
