"use client"

import { UserSidebar } from "@/components/UserSidebar"
import { SmashLogo } from "@/components/SmashLogo"
import { getCurrentUser } from "@/lib/auth/actions"
import { Bell, Info, AlertTriangle, Check, CreditCard, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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
            >
                <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                    <SmashLogo className="w-full h-full bg-black" />
                </div>
                <span className="text-xl font-display font-bold tracking-tight">Smash<span className="text-pastel-lilac">.</span></span>
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Left Sidebar */}
                    <div className="space-y-6">
                        <UserSidebar user={user} />
                    </div>

                    {/* Right Content */}
                    <div className="space-y-8">
                        <div className="border-b-2 border-black/5 pb-4">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-display font-black uppercase">Notifikasi</h1>
                                <button className="text-xs font-bold text-white bg-black px-3 py-1 rounded-full hover:scale-105 active:scale-95 transition-transform cursor-pointer">
                                    Mark all as read
                                </button>
                            </div>
                            <p className="text-gray-500 font-medium">Update terbaru seputar booking dan akunmu.</p>
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
                </div>
            </div>
        </main>
    )
}
