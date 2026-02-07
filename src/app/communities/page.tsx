"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Users, Shield, Search } from "lucide-react"
import { motion, AnimatePresence, Variants } from "framer-motion"

export default function CommunitiesPage() {
    const router = useRouter()
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
    const [loading, setLoading] = useState(true)

    // Fetch Communities
    useEffect(() => {
        const fetchCommunities = async () => {
            setLoading(true)
            try {
                // Dynamically import the server action to avoid build issues if not available yet
                const { getCommunitiesForUser } = await import('./actions')
                const { data, error } = await getCommunitiesForUser(activeTab === 'admin' ? 'admin' : undefined)

                if (data) {
                    // Start of Selection
                    const formattedData = data.map((community: any) => ({
                        ...community,
                        initials: community.name.substring(0, 2).toUpperCase(),
                        // Simple deterministic color based on name length
                        color: ['bg-pastel-mint', 'bg-pastel-lilac', 'bg-pastel-yellow', 'bg-pastel-pink', 'bg-pastel-blue'][community.name.length % 5]
                    }))
                    setCommunities(formattedData)
                }
            } catch (error) {
                console.error("Failed to fetch communities", error)
            } finally {
                setLoading(false)
            }
        }

        fetchCommunities()
    }, [activeTab])

    return (
        <main className="min-h-screen bg-white pb-20 pt-24 px-4 font-display">
            {/* Header */}
            <div className="bg-gradient-to-r from-black via-gray-800 to-black text-white px-4 py-4 fixed top-0 left-0 right-0 z-50 flex items-center justify-between shadow-md">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-display font-bold">Communities</h1>

                {/* Menu Container */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-2 rounded-lg transition-all duration-300 ${isMenuOpen ? 'bg-white text-black rotate-45' : 'text-white hover:bg-white/10'}`}
                    >
                        <Plus className="w-6 h-6" />
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

            {/* Toggle Switch */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-xl border-2 border-black">
                <button
                    onClick={() => setActiveTab('player')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border-2 ${activeTab === 'player'
                        ? 'bg-pastel-mint text-black border-black shadow-hard-sm'
                        : 'bg-transparent text-gray-500 border-transparent hover:text-black'
                        }`}
                >
                    As Player
                </button>
                <button
                    onClick={() => setActiveTab('admin')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border-2 ${activeTab === 'admin'
                        ? 'bg-pastel-lilac text-black border-black shadow-hard-sm'
                        : 'bg-transparent text-gray-500 border-transparent hover:text-black'
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
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                        </div>
                    ) : communities.length > 0 ? (
                        <div className="space-y-4">
                            {communities.map((community) => (
                                <motion.div
                                    key={community.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-black shadow-hard-sm cursor-pointer hover:shadow-hard-md transition-all"
                                    onClick={() => router.push(`/communities/${community.id}`)}
                                >
                                    <div className={`w-16 h-16 ${community.color} rounded-xl border-2 border-black flex items-center justify-center font-bold text-2xl shadow-sm`}>
                                        {community.initials}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg text-black leading-tight">{community.name}</h3>
                                            {community.role && (
                                                <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                                                    {community.role}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded border border-black text-gray-700">
                                                {community.sport}
                                            </span>
                                            <div className="flex items-center text-xs text-gray-500 font-medium">
                                                <Users className="w-3 h-3 mr-1" />
                                                {community.members_count || 1} Members
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Join New Community Card */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-400 text-gray-500 font-bold hover:border-black hover:text-black hover:bg-gray-50 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Find Communities
                            </motion.button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-20 h-20 bg-gray-50 border-2 border-black rounded-2xl flex items-center justify-center mb-6 shadow-hard-sm rotate-3">
                                <Shield className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-black mb-2">No Communities Found</h3>
                            <p className="text-sm text-gray-500 max-w-xs mb-8">
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
        </main>
    )
}
