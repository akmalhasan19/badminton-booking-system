"use client"

import { UserSidebar } from "@/components/UserSidebar"
import { MobileHeader } from "@/components/MobileHeader"
import { SmashLogo } from "@/components/SmashLogo"
import { getCurrentUser } from "@/lib/auth/actions"
import { fetchNotifications, markAllNotificationsAsRead, markNotificationAsRead, Notification, NotificationType } from "@/lib/api/actions"
import { Bell, Info, AlertTriangle, Check, CreditCard, Calendar, Gift, Loader2, BellOff } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

// Map notification types to icons
const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case 'booking_confirmed':
            return Calendar
        case 'booking_cancelled':
            return AlertTriangle
        case 'payment_reminder':
            return CreditCard
        case 'points_earned':
            return Check
        case 'promo':
            return Gift
        case 'system':
        default:
            return Info
    }
}

// Map notification types to colors
const getNotificationColor = (type: NotificationType) => {
    switch (type) {
        case 'booking_confirmed':
        case 'points_earned':
            return 'bg-pastel-mint'
        case 'booking_cancelled':
        case 'payment_reminder':
            return 'bg-pastel-yellow'
        case 'promo':
            return 'bg-pastel-lilac'
        case 'system':
        default:
            return 'bg-gray-200'
    }
}

// Format relative time
const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays < 7) return `${diffDays} hari lalu`
    return `${diffWeeks} minggu lalu`
}

export default function NotificationsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMarkingAll, setIsMarkingAll] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const [userData, notifData] = await Promise.all([
                    getCurrentUser(),
                    fetchNotifications()
                ])
                setUser(userData)
                setNotifications(notifData)
            } catch (error) {
                console.error('Failed to fetch notifications:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleMarkAllAsRead = async () => {
        setIsMarkingAll(true)
        try {
            const result = await markAllNotificationsAsRead()
            if (result.success) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        } finally {
            setIsMarkingAll(false)
        }
    }

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            const result = await markNotificationAsRead(notificationId)
            if (result.success) {
                setNotifications(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
                )
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications]
    )

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

            {/* Logo Link */}
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

            <MobileHeader title="Notifikasi" backPath="/account" />

            <div className="max-w-7xl mx-auto px-4 relative z-10 pt-8 md:pt-0">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Left Sidebar - Hidden on mobile */}
                    <div className="hidden md:block space-y-6">
                        <UserSidebar user={user} />
                    </div>

                    {/* Right Content */}
                    <div className="space-y-8">
                        <div className="border-b-2 border-black/5 pb-4">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-display font-black uppercase">Notifikasi</h1>
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                                {notifications.length > 0 && unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        disabled={isMarkingAll}
                                        className="text-xs font-bold text-white bg-black px-3 py-1 rounded-full hover:scale-105 active:scale-95 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        {isMarkingAll && <Loader2 className="w-3 h-3 animate-spin" />}
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-500 font-medium">Update terbaru seputar booking dan akunmu.</p>
                        </div>

                        {/* Loading State */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
                                <p className="text-gray-500 font-medium">Memuat notifikasi...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <BellOff className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-display font-bold text-gray-600 mb-2">Belum Ada Notifikasi</h3>
                                <p className="text-gray-500 font-medium text-center max-w-sm">
                                    Notifikasi tentang booking, promo, dan update penting lainnya akan muncul di sini.
                                </p>
                            </div>
                        ) : (
                            /* Notifications List */
                            <div className="space-y-4">
                                {notifications.map((notif, index) => {
                                    const IconComponent = getNotificationIcon(notif.type)
                                    const bgColor = getNotificationColor(notif.type)

                                    return (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                                            className={`p-4 border-2 border-black rounded-xl shadow-hard flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${notif.read ? 'bg-white' : 'bg-blue-50'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-lg border-2 border-black flex items-center justify-center shrink-0 ${bgColor}`}>
                                                <IconComponent className="w-6 h-6 text-black" />
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
                                                    {formatRelativeTime(notif.created_at)}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
