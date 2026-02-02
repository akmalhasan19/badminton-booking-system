"use client"

import { User, Mail, Phone, MapPin, Camera, Calendar, CreditCard, Bell, Settings, HelpCircle, LogOut, ChevronRight, Gift } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"

interface UserSidebarProps {
    user: {
        name: string;
        email: string; // Used for "Google" placeholder text replacement if needed, or just showing role
        avatar_url?: string;
        role?: string;
    } | null;
}

export function UserSidebar({ user }: UserSidebarProps) {
    const router = useRouter()
    const pathname = usePathname()

    const menuItems = [
        { label: "Booking Saya", icon: Calendar, path: "/bookings" },
        { label: "Ubah Profil", icon: User, path: "/profile" },
        { label: "Metode Pembayaran", icon: CreditCard, path: "/payment-methods" },
        { label: "Notifikasi", icon: Bell, path: "/notifications" },
        { label: "Pengaturan", icon: Settings, path: "/settings" },
        { label: "Pusat Bantuan", icon: HelpCircle, path: "/help" },
    ]

    const handleLogout = async () => {
        // Assuming logout logic is handled via a global handler or passed as prop. 
        // For now, we can redirect to /auth/logout or trigger a signout.
        // But since we don't have the auth actions imported here, let's keep it simple or import it.
        // Importing actions in client component is fine.
        const { signOut } = await import("@/lib/auth/actions")
        await signOut()
        router.refresh()
        router.push('/')
    }

    return (
        <div className="space-y-6">
            {/* Profile Summary Card */}
            <div className="bg-white border-2 border-black rounded-xl p-6 shadow-hard text-center flex flex-col items-center">
                <div className="relative mb-4 group cursor-pointer">
                    <div className="w-20 h-20 bg-gray-100 rounded-full border-2 border-black flex items-center justify-center overflow-hidden">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-display font-bold text-2xl text-gray-400">
                                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AH'}
                            </span>
                        )}
                    </div>
                </div>
                <h2 className="font-bold text-xl">{user?.name || 'User'}</h2>
                <p className="text-gray-500 text-sm font-medium">{user?.role === 'admin' ? 'Admin' : 'Member'}</p>
            </div>

            {/* Member Tier Banner */}
            <div className="bg-[#C19A6B] border-2 border-black rounded-xl p-4 shadow-hard text-white relative overflow-hidden group cursor-pointer hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <p className="text-xs font-bold uppercase opacity-80">Member Status</p>
                        <p className="font-display font-black text-lg">Bronze Priority</p>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                </div>
            </div>

            {/* Points Balance */}
            <div className="bg-white border-2 border-black rounded-xl p-4 shadow-hard flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pastel-yellow border-2 border-black flex items-center justify-center">
                    <Gift className="w-4 h-4 text-black" />
                </div>
                <div>
                    <p className="font-display font-black text-lg leading-none">0</p>
                    <p className="text-xs font-bold text-gray-500">Poin</p>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white border-2 border-black rounded-xl shadow-hard overflow-hidden">
                {menuItems.map((item, index) => {
                    const isActive = pathname === item.path || (item.path === '/profile' && pathname === '/settings');

                    return (
                        <button
                            key={index}
                            onClick={() => router.push(item.path)}
                            className={`w-full text-left px-5 py-4 border-b border-gray-100 last:border-0 transition-colors flex items-center gap-3 font-bold text-sm 
                                ${isActive ? 'bg-pastel-acid/20 text-black' : 'hover:bg-gray-50 text-gray-700'}
                            `}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                            {item.label}
                        </button>
                    )
                })}
            </div>

            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-red-600 font-bold py-3 hover:bg-red-50 rounded-xl transition-colors"
            >
                <LogOut className="w-4 h-4" />
                Log Out
            </button>
        </div>
    )
}
