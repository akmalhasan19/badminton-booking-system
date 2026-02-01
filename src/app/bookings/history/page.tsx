"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, MapPin, ArrowRight, Loader2, ArrowLeft, Filter, ArrowUpDown, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { UserSidebar } from "@/components/UserSidebar"
import { getCurrentUser } from "@/lib/auth/actions"
import { getUserBookingHistory } from "../actions"
import { SmashLogo } from "@/components/SmashLogo"
import { useRouter } from "next/navigation"

export default function BookingHistoryPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'completed' | 'cancelled'>('completed')

    useEffect(() => {
        const loadData = async () => {
            try {
                const userData = await getCurrentUser()
                setUser(userData)

                const { data } = await getUserBookingHistory()
                setBookings(data || [])
            } catch (error) {
                console.error("Failed to load data", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const filteredBookings = bookings.filter(b => {
        if (activeTab === 'completed') return b.status === 'completed'
        if (activeTab === 'cancelled') return b.status === 'cancelled'
        return false
    })

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
            >
                <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                    <SmashLogo className="w-full h-full bg-black" />
                </div>
                <span className="text-xl font-display font-bold tracking-tight">Smash<span className="text-pastel-lilac">.</span></span>
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Sidebar */}
                    <div className="md:block">
                        <UserSidebar user={user} />
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Header with Back Button */}
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => router.push('/bookings')}
                                className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline w-fit"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Kembali
                            </button>
                            <h1 className="text-3xl font-display font-black">Riwayat</h1>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('completed')}
                                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'completed'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Pesanan Selesai
                            </button>
                            <button
                                onClick={() => setActiveTab('cancelled')}
                                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'cancelled'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Dibatalkan/Refund
                            </button>
                        </div>

                        {/* Filters & Sorting (Visual only for now matching UI) */}
                        <div className="flex gap-3">
                            <button className="px-4 py-2 border border-gray-300 rounded-full text-sm font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-50">
                                <Filter className="w-4 h-4" />
                                Filter
                            </button>
                            <button className="px-4 py-2 border border-gray-300 rounded-full text-sm font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-50">
                                <ArrowUpDown className="w-4 h-4" />
                                Urutkan
                            </button>
                        </div>

                        {/* History List */}
                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : filteredBookings.length > 0 ? (
                            <div className="grid gap-4">
                                {filteredBookings.map((booking, index) => (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:border-black transition-all group"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${booking.status === 'completed'
                                                            ? 'bg-green-100 text-green-700 border-green-200'
                                                            : 'bg-red-100 text-red-700 border-red-200'
                                                        }`}>
                                                        {booking.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                                                    </span>
                                                    <span className="text-sm font-mono text-gray-500">#{booking.id.slice(0, 8).toUpperCase()}</span>
                                                </div>

                                                <h3 className="text-xl font-bold font-display">{booking.court_name}</h3>

                                                <div className="flex flex-col sm:flex-row gap-4 text-sm font-medium text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(booking.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 md:pl-6 md:border-l">
                                                <span className="text-lg font-bold">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(booking.price)}
                                                </span>

                                                {booking.status === 'completed' ? (
                                                    <button className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                                        Beli Lagi
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Dana dikembalikan
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-48 h-48 mb-6 relative grayscale opacity-70">
                                    <img
                                        src="/tidak-ada-booking.webp"
                                        alt="Belum ada riwayat"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <h3 className="text-xl font-bold font-display text-gray-900 mb-2">
                                    {activeTab === 'completed' ? 'Belum ada pesanan selesai' : 'Tidak ada pesanan dibatalkan'}
                                </h3>
                                <p className="text-gray-500 max-w-xs text-center mb-8">
                                    {activeTab === 'completed' ? 'Kamu belum menyelesaikan pesanan apapun dalam 90 hari terakhir.' : 'Riwayat pembatalanmu kosong.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
