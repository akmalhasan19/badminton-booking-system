"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Calendar, CreditCard, Bell, Settings, HelpCircle, LogOut, ChevronRight, Gift, Star, ArrowLeft, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { SmashLogo } from "@/components/SmashLogo"
import { getCurrentUser, signOut } from "@/lib/auth/actions"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export default function AccountPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [user, setUser] = useState<{
        name: string;
        email: string;
        avatar_url?: string;
        skill_score?: number;
        skill_review_count?: number;
    } | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function checkAuth() {
            const currentUser = await getCurrentUser()
            if (currentUser) {
                setUser({
                    name: currentUser.name,
                    email: currentUser.email,
                    avatar_url: currentUser.avatar_url,
                    skill_score: currentUser.skill_score,
                    skill_review_count: currentUser.skill_review_count
                })
            } else {
                router.push('/')
            }
            setIsLoading(false)
        }
        checkAuth()
    }, [router])

    const handleLogout = async () => {
        await signOut()
        router.push('/')
        router.refresh()
    }

    const menuItems = [
        {
            icon: Calendar,
            label: t.my_bookings || "My Bookings",
            path: "/bookings",
            bgColor: "bg-pastel-mint/30",
            hoverColor: "hover:bg-pastel-mint/50"
        },
        {
            icon: Users,
            label: t.communities || "Communities",
            path: "/communities",
            bgColor: "bg-pastel-blue/30",
            hoverColor: "hover:bg-pastel-blue/50"
        },
        {
            icon: User,
            label: t.edit_profile || "Edit Profile",
            path: "/profile",
            bgColor: "bg-pastel-lilac/30",
            hoverColor: "hover:bg-pastel-lilac/50"
        },
        {
            icon: CreditCard,
            label: t.payment_methods || "Payment Methods",
            path: "/payment-methods",
            bgColor: "bg-pastel-pink/30",
            hoverColor: "hover:bg-pastel-pink/50"
        },
    ]

    const secondaryMenuItems = [
        {
            icon: Bell,
            label: t.notifications || "Notifications",
            path: "/notifications",
            bgColor: "bg-pastel-yellow/30",
            hoverColor: "hover:bg-pastel-yellow/50",
            badge: 3
        },
        {
            icon: Settings,
            label: t.settings || "Settings",
            path: "/settings",
            bgColor: "bg-gray-100",
            hoverColor: "hover:bg-gray-200"
        },
        {
            icon: HelpCircle,
            label: t.help_center || "Help Center",
            path: "/help",
            bgColor: "bg-pastel-acid/30",
            hoverColor: "hover:bg-pastel-acid/50"
        },
    ]

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    const skillScore = user.skill_score ?? 0
    const skillReviewCount = user.skill_review_count ?? 0
    const formattedSkillScore = skillReviewCount > 0 ? skillScore.toFixed(1) : '0'

    return (
        <main className="min-h-screen bg-white">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-black via-gray-800 to-black">
                {/* Top Navigation */}
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 cursor-pointer group"
                    >
                        <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                            <SmashLogo className="w-full h-full bg-white" />
                        </div>
                        <span className="text-xl font-display font-bold tracking-tight text-white">Smash<span className="text-pastel-lilac">.</span></span>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="px-6 pb-6 pt-2">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-pastel-acid rounded-full border-3 border-white flex items-center justify-center shadow-lg overflow-hidden">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-black" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-white text-xl">{user.name}</p>
                            <button className="flex items-center gap-1 mt-1 hover:bg-white/10 px-2 py-0.5 rounded transition-colors -ml-2 cursor-pointer">
                                <Star className="w-4 h-4 text-pastel-yellow fill-pastel-yellow" />
                                <span className="text-sm text-gray-300">{t.smash_member || "Smash Member"}</span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Points Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => router.push('/rewards')}
                        className="mt-5 flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 cursor-pointer hover:bg-white/20 transition-colors"
                    >
                        <div className="w-8 h-8 bg-pastel-yellow rounded-full flex items-center justify-center border-2 border-black">
                            <Gift className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-white font-bold">{formattedSkillScore} Keterampilan</span>
                        <span className="text-gray-400 text-sm ml-auto">{skillReviewCount} review</span>
                    </motion.div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-4 py-6 space-y-2">
                {menuItems.map((item, index) => (
                    <motion.button
                        key={item.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        onClick={() => router.push(item.path)}
                        className={`w-full px-4 py-4 text-left text-sm font-semibold text-gray-700 ${item.hoverColor} transition-colors flex items-center gap-4 rounded-xl group`}
                    >
                        <div className={`w-11 h-11 ${item.bgColor} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform border-2 border-black/5`}>
                            <item.icon className="w-5 h-5 text-gray-700" />
                        </div>
                        <span className="flex-1 text-base">{item.label}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.button>
                ))}

                <div className="border-t border-gray-100 my-4" />

                {secondaryMenuItems.map((item, index) => (
                    <motion.button
                        key={item.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + index * 0.05 }}
                        onClick={() => router.push(item.path)}
                        className={`w-full px-4 py-4 text-left text-sm font-semibold text-gray-700 ${item.hoverColor} transition-colors flex items-center gap-4 rounded-xl group`}
                    >
                        <div className={`w-11 h-11 ${item.bgColor} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform border-2 border-black/5`}>
                            <item.icon className="w-5 h-5 text-gray-700" />
                        </div>
                        <span className="flex-1 text-base">{item.label}</span>
                        {item.badge && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{item.badge}</span>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.button>
                ))}
            </div>

            {/* Logout Button */}
            <div className="px-4 pb-8">
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={handleLogout}
                    className="w-full px-4 py-4 text-left font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-4 rounded-xl"
                >
                    <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center border-2 border-red-100">
                        <LogOut className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-base">{t.logout || "Logout"}</span>
                </motion.button>
            </div>
        </main>
    )
}
