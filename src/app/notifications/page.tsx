"use client"

import { PageHeader } from "@/components/PageHeader"
import { Bell, Info, AlertTriangle, Check, CreditCard, Calendar } from "lucide-react"
import { motion } from "framer-motion"

const notifications = [
    {
        id: 1,
        type: "success",
        title: "Booking Confirmed",
        message: "Your booking for Court A on Feb 15 has been confirmed.",
        time: "2 hours ago",
        read: false,
        icon: Calendar
    },
    {
        id: 2,
        type: "info",
        title: "Points Earned",
        message: "You earned 50 points from your last booking!",
        time: "1 day ago",
        read: false,
        icon: Check
    },
    {
        id: 3,
        type: "warning",
        title: "Payment Reminder",
        message: "Please complete payment for booking #BK-2024-005 within 30 minutes.",
        time: "2 days ago",
        read: true,
        icon: CreditCard
    },
    {
        id: 4,
        type: "system",
        title: "System Maintenance",
        message: "Smash will be undergoing maintenance on Feb 20 from 02:00 - 04:00 AM.",
        time: "1 week ago",
        read: true,
        icon: Info
    }
]

export default function NotificationsPage() {
    return (
        <main className="min-h-screen bg-white pt-24 pb-12">
            <div className="max-w-2xl mx-auto px-4">
                <div className="flex justify-between items-start mb-8">
                    <PageHeader
                        title="Notifikasi"
                        description="Update terbaru seputar booking dan akunmu."
                        showBack={true}
                    />
                    <button className="text-sm font-bold text-pastel-acid bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                        Mark all as read
                    </button>
                </div>

                <div className="space-y-4">
                    {notifications.map((notif, index) => (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 border-2 border-black rounded-xl shadow-hard flex gap-4 ${notif.read ? 'bg-white' : 'bg-blue-50'}`}
                        >
                            <div className={`w-12 h-12 rounded-lg border-2 border-black flex items-center justify-center shrink-0 
                                ${notif.type === 'success' ? 'bg-pastel-mint' :
                                    notif.type === 'warning' ? 'bg-pastel-yellow' :
                                        notif.type === 'info' ? 'bg-pastel-lilac' : 'bg-gray-200'}`}
                            >
                                <notif.icon className="w-6 h-6 text-black" />
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-lg leading-tight ${!notif.read ? 'text-black' : 'text-gray-600'}`}>
                                        {notif.title}
                                    </h3>
                                    {!notif.read && (
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    )}
                                </div>
                                <p className="text-gray-600 font-medium text-sm leading-relaxed mb-2">
                                    {notif.message}
                                </p>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {notif.time}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </main>
    )
}
