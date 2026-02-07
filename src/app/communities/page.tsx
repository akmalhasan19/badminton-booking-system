"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Users, Shield, Search, Loader2 } from "lucide-react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { UserSidebar } from "@/components/UserSidebar"
import { MobileHeader } from "@/components/MobileHeader"
import { SmashLogo } from "@/components/SmashLogo"
import { getCurrentUser } from "@/lib/auth/actions"

export default function CommunitiesPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'player' | 'admin'>('player')
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    // Animation Variants
    const menuVariants: Variants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: -10,
            transition: {
                duration: 0.2,
                ease: "easeInOut"
            }
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut",
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: -10,
            transition: {
                duration: 0.2,
                ease: "easeInOut"
            }
        }
    }

    const itemVariants: Variants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    }

    const [communities, setCommunities] = useState<any[]>([])

    // Fetch User and Communities
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [userData] = await Promise.all([
                    getCurrentUser()
                ])
                setUser(userData)

                // Dynamically import the server action to avoid build issues if not available yet
                const { getCommunitiesForUser } = await import('./actions')
                const { data, error } = await getCommunitiesForUser(activeTab === 'admin' ? 'admin' : undefined)

                if (data) {
                    const formattedData = data.map((community: any) => ({
                        ...community,
                        initials: (() => {
                            const words = community.name.trim().split(/\s+/);
                            if (words.length >= 2) {
                                return (words[0][0] + words[1][0]).toUpperCase();
                            }
                            return community.name.substring(0, 2).toUpperCase();
                        })(),
                        color: ['bg-pastel-mint', 'bg-pastel-lilac', 'bg-pastel-yellow', 'bg-pastel-pink', 'bg-pastel-blue'][community.name.length % 5]
                    }))
                    setCommunities(formattedData)
                }
            } catch (error) {
                console.error("Failed to fetch data", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [activeTab])

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

            {/* Logo Link - Absolute Top Right */}
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

            <MobileHeader title="Komunitas" backPath="/account" />

            <div className="max-w-7xl mx-auto px-4 relative z-10 pt-2 md:pt-0">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Sidebar - Hidden on mobile */}
                    <div className="hidden md:block">
                        <UserSidebar user={user} />
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-row items-center justify-between md:justify-start gap-2 md:gap-6 pb-2">
                                <h1 className="text-xl md:text-3xl font-display font-black">Komunitas</h1>
                                <div className="h-8 w-[2px] bg-gray-200 hidden sm:block"></div>

                                {/* Menu Container */}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className={`flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-full text-xs font-bold border-2 transition-all ${isMenuOpen
                                            ? 'bg-black text-white border-black'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-black border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        <Plus className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-45' : ''}`} />
                                        Tambah
                                    </button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {isMenuOpen && (
                                            <motion.div
                                                variants={menuVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border-2 border-black shadow-hard-lg overflow-hidden z-50 p-1"
                                            >
                                                <motion.button
                                                    variants={itemVariants}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                                                    onClick={() => {
                                                        setIsMenuOpen(false)
                                                        // router.push('/communities/find') 
                                                    }}
                                                >
                                                    <div className="w-10 h-10 bg-pastel-mint rounded-lg border-2 border-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Search className="w-5 h-5 text-black" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-black">Find & Join</p>
                                                        <p className="text-[10px] text-gray-500 font-medium">Discover communities</p>
                                                    </div>
                                                </motion.button>

                                                <motion.div variants={itemVariants} className="h-[1px] bg-gray-100 mx-2 my-1" />

                                                <motion.button
                                                    variants={itemVariants}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                                                    onClick={() => {
                                                        setIsMenuOpen(false)
                                                        router.push('/communities/create')
                                                    }}
                                                >
                                                    <div className="w-10 h-10 bg-pastel-yellow rounded-lg border-2 border-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Plus className="w-5 h-5 text-black" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-black">Create New</p>
                                                        <p className="text-[10px] text-gray-500 font-medium">Start your own club</p>
                                                    </div>
                                                </motion.button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Toggle Switch */}
                        <div className="relative flex gap-1 bg-gray-100 p-1.5 rounded-xl border-2 border-black">
                            {/* Sliding Background Indicator */}
                            <motion.div
                                layoutId="activeTab"
                                className={`absolute top-1.5 bottom-1.5 rounded-lg border-2 border-black shadow-hard-sm ${activeTab === 'player' ? 'bg-pastel-mint' : 'bg-pastel-lilac'}`}
                                style={{
                                    width: 'calc(50% - 4px)',
                                    left: activeTab === 'player' ? '6px' : 'calc(50% + 2px)'
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30
                                }}
                            />
                            <button
                                onClick={() => setActiveTab('player')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors relative z-10 ${activeTab === 'player'
                                    ? 'text-black'
                                    : 'text-gray-500 hover:text-black'
                                    }`}
                            >
                                As Player
                            </button>
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors relative z-10 ${activeTab === 'admin'
                                    ? 'text-black'
                                    : 'text-gray-500 hover:text-black'
                                    }`}
                            >
                                As Admin
                            </button>
                        </div>

                        {/* Content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {loading ? (
                                    <div className="flex h-64 items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                    </div>
                                ) : communities.length > 0 ? (
                                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {communities.map((community) => (
                                            <motion.div
                                                key={community.id}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="p-2 cursor-pointer transition-all flex flex-col items-center text-center group"
                                                onClick={() => router.push(`/communities/${community.id}`)}
                                            >


                                                <div className="relative z-10 flex flex-col items-center">
                                                    <div className={`w-14 h-14 ${community.color} rounded-xl border-2 border-black flex items-center justify-center font-bold text-xl shadow-sm mb-3 overflow-hidden bg-white`}>
                                                        {community.logo_url ? (
                                                            <img
                                                                src={community.logo_url}
                                                                alt={community.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            community.initials
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-sm text-black leading-tight line-clamp-2 mb-1">{community.name}</h3>
                                                </div>
                                                {community.role && (
                                                    <span className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full capitalize mb-2">
                                                        {community.role}
                                                    </span>
                                                )}
                                                <div className="flex items-center text-xs text-gray-500 font-medium">
                                                    <Users className="w-3 h-3 mr-1" />
                                                    {community.members_count || 1}
                                                </div>
                                            </motion.div>
                                        ))}

                                        {/* Add New Community Card */}
                                        <motion.div
                                            whileHover={{ scale: 1.03, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => router.push('/communities/create')}
                                            className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-black hover:bg-gray-50 transition-all flex flex-col items-center justify-center text-center min-h-[140px]"
                                        >
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                                <Plus className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500">Tambah Baru</span>
                                        </motion.div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-gray-300 rounded-xl">
                                        <div className="w-20 h-20 bg-gray-50 border-2 border-black rounded-2xl flex items-center justify-center mb-6 shadow-hard-sm rotate-3">
                                            <Shield className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-black mb-2">No Communities Found</h3>
                                        <p className="text-sm text-gray-500 max-w-xs text-center mb-8">
                                            {activeTab === 'player'
                                                ? "You haven't joined any communities yet."
                                                : "You don't manage any communities yet."}
                                        </p>
                                        <button className="px-6 py-3 bg-pastel-acid text-black font-bold rounded-lg border-2 border-black shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2">
                                            <Plus className="w-5 h-5" />
                                            {activeTab === 'player' ? "Find Community" : "Create Community"}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </main>
    )
}
