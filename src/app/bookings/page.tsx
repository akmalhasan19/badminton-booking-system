"use client"

import { PageHeader } from "@/components/PageHeader"
import { Calendar, Clock, MapPin, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

// Mock data for bookings
const bookings = [
    {
        id: "BK-2024-001",
        court: "Court A - Synthetic",
        venue: "Smash Arena Central",
        date: "2026-02-15",
        time: "18:00 - 20:00",
        price: "Rp 150.000",
        status: "upcoming",
        statusLabel: "Upcoming",
        statusColor: "bg-pastel-mint",
    },
    {
        id: "BK-2024-002",
        court: "Court C - Parquet",
        venue: "Smash Arena Central",
        date: "2026-02-01",
        time: "10:00 - 12:00",
        price: "Rp 120.000",
        status: "completed",
        statusLabel: "Completed",
        statusColor: "bg-gray-200",
    },
    {
        id: "BK-2024-003",
        court: "Court B - Synthetic",
        venue: "Smash Arena Central",
        date: "2026-01-20",
        time: "19:00 - 20:00",
        price: "Rp 80.000",
        status: "cancelled",
        statusLabel: "Cancelled",
        statusColor: "bg-red-100",
    }
]

export default function BookingSayaPage() {
    return (
        <main className="min-h-screen bg-white pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4">
                <PageHeader
                    title="Booking Saya"
                    description="Kelola jadwal main dan riwayat booking lapanganmu di sini."
                />

                <div className="space-y-6">
                    {bookings.map((booking, index) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white border-2 border-black rounded-xl p-6 shadow-hard transition-transform hover:-translate-y-1 hover:shadow-hard-lg group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 border-black ${booking.statusColor}`}>
                                            {booking.statusLabel}
                                        </span>
                                        <span className="text-sm font-mono text-gray-500">#{booking.id}</span>
                                    </div>

                                    <h3 className="text-2xl font-display font-bold">{booking.court}</h3>

                                    <div className="flex flex-col sm:flex-row gap-4 text-sm font-medium text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {booking.date}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {booking.time}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {booking.venue}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t-2 md:border-t-0 border-gray-100 md:pl-6 md:border-l-2">
                                    <span className="text-xl font-bold">{booking.price}</span>

                                    {booking.status === 'upcoming' && (
                                        <button className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all border-2 border-transparent hover:border-black hover:bg-white hover:text-black">
                                            View Ticket
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}

                                    {booking.status === 'completed' && (
                                        <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Write Review
                                        </button>
                                    )}

                                    {booking.status === 'cancelled' && (
                                        <div className="flex items-center gap-2 text-xs font-bold text-red-500">
                                            <AlertCircle className="w-4 h-4" />
                                            Refund Processed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {bookings.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-500">Belum ada booking</h3>
                        <p className="text-gray-400">Yuk cari lapangan dan main badminton!</p>
                    </div>
                )}
            </div>
        </main>
    )
}
