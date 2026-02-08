"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Users, Swords, Trophy, X, ChevronRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface CreateActivityModalProps {
    isOpen: boolean
    onClose: () => void
    communityId: string
}

interface ActivityImage {
    url: string
    slot: 'main' | 'sparring' | 'fun'
}

export function CreateActivityModal({ isOpen, onClose, communityId }: CreateActivityModalProps) {
    const router = useRouter()
    const [step, setStep] = useState<'selection' | 'casual-strategy'>('selection')
    const [images, setImages] = useState<ActivityImage[]>([])
    const [loadingImages, setLoadingImages] = useState(false)
    const supabase = createClient()

    // Reset step when modal closes
    useEffect(() => {
        if (!isOpen) {
            // Small delay to allow exit animation to finish
            const timer = setTimeout(() => setStep('selection'), 300)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    // Fetch images when step changes to 'casual-strategy'
    useEffect(() => {
        if (isOpen && step === 'casual-strategy') {
            fetchImages()
        }
    }, [isOpen, step])

    const fetchImages = async () => {
        try {
            setLoadingImages(true)
            const { data, error } = await supabase
                .from('activity_images')
                .select('url, slot')
                .eq('is_active', true)

            if (error) throw error
            setImages(data as ActivityImage[] || [])
        } catch (error) {
            console.error('Error fetching activity images:', error)
        } finally {
            setLoadingImages(false)
        }
    }

    const getImageBySlot = (slot: string) => {
        return images.find(img => img.slot === slot)?.url
    }

    const options = [
        {
            id: 'casual',
            title: 'Main Bareng',
            description: 'Fun match untuk semua member',
            icon: Users,
            color: 'bg-pastel-mint',
            path: `/matches/create?communityId=${communityId}&mode=CASUAL`
        },
        {
            id: 'sparring',
            title: 'Sparring',
            description: 'Tanding lawan komunitas lain',
            icon: Swords,
            color: 'bg-pastel-blue',
            path: `/matches/create?communityId=${communityId}&mode=SPARRING` // Assuming SPARRING mode existence or mapping to CASUAL with specific tag
        },
        {
            id: 'tournament',
            title: 'Tournament',
            description: 'Kompetisi resmi dengan bracket',
            icon: Trophy,
            color: 'bg-pastel-yellow',
            path: `/matches/create?communityId=${communityId}&mode=RANKED`
        }
    ]

    const handleOptionClick = (optionId: string, path: string) => {
        if (optionId === 'casual') {
            setStep('casual-strategy')
        } else {
            router.push(path)
            onClose()
        }
    }

    const handleBack = () => {
        setStep('selection')
    }

    const handleBookVenue = () => {
        router.push('/?tab=book')
        onClose()
    }

    const handleCreateActivity = () => {
        router.push(`/matches/create?communityId=${communityId}&mode=CASUAL`)
        onClose()
    }

    const renderFrame = (slot: string, label: string) => {
        const imageUrl = getImageBySlot(slot)

        return (
            <div className="relative rounded-xl overflow-hidden border-3 border-neo-black bg-gray-100 flex items-center justify-center group h-full w-full">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={label}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <>
                        <div className={`absolute inset-0 bg-[linear-gradient(${slot === 'sparring' ? '-45deg' : '45deg'},transparent_25%,rgba(0,0,0,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:10px_10px]`} />
                        <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest text-center px-2 relative z-10">
                            {label}
                        </span>
                    </>
                )}

                {/* Optional: Add a subtle overlay gradient for text readability if needed in future, keeping generic for now */}
            </div>
        )
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    {/* Modal Content - Bottom Sheet on Mobile, Center on Desktop */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 rounded-t-3xl border-t-2 border-l-2 border-r-2 border-black shadow-[0_-4px_0_0_rgba(0,0,0,0.1)] p-6 pb-10 max-h-[90vh] overflow-y-auto hide-scrollbar"
                    >
                        {/* Drag Handle (Visual only) */}
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

                        <div className="flex justify-between items-center mb-6">
                            {step === 'selection' ? (
                                <h3 className="text-xl font-black uppercase italic dark:text-white">
                                    Buat Aktivitas
                                </h3>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleBack}
                                        className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 transform rotate-180" />
                                    </button>
                                    <h3 className="text-xl font-black uppercase italic dark:text-white">
                                        Persiapan Main Bareng
                                    </h3>
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <X className="w-5 h-5 text-black dark:text-white" />
                            </button>
                        </div>

                        {step === 'selection' ? (
                            <div className="grid gap-3">
                                {options.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleOptionClick(option.id, option.path)}
                                        className="flex items-center gap-4 p-4 rounded-xl border-2 border-black bg-white dark:bg-zinc-800 shadow-hard-sm active:translate-y-[2px] active:shadow-none transition-all group text-left hover:bg-gray-50 dark:hover:bg-zinc-800/80"
                                    >
                                        <div className={`w-12 h-12 ${option.color} border-2 border-black rounded-lg flex items-center justify-center shadow-sm group-active:scale-95 transition-transform`}>
                                            <option.icon className="w-6 h-6 text-black" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-black dark:text-white leading-tight">
                                                {option.title}
                                            </h4>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                                {option.description}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                <div className="space-y-6">
                                    {/* Image Frames - Dynamic Grid */}
                                    <div className="grid grid-cols-2 gap-3 h-48 relative">
                                        {/* Loading Overlay */}
                                        {loadingImages && (
                                            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm rounded-xl">
                                                <Loader2 className="w-8 h-8 animate-spin text-black" />
                                            </div>
                                        )}

                                        {/* Frame 1 - Large Left */}
                                        <div className="h-full">
                                            {renderFrame('main', 'Main Bareng Moment')}
                                        </div>

                                        <div className="grid grid-rows-2 gap-3 h-full">
                                            {/* Frame 2 - Top Right */}
                                            {renderFrame('sparring', 'Sparring')}

                                            {/* Frame 3 - Bottom Right */}
                                            {renderFrame('fun', 'Fun Match')}
                                        </div>
                                    </div>

                                    {/* Typography Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black leading-tight text-black dark:text-white">
                                            Secure the Court. Rule the Game.
                                        </h3>
                                        <ul className="space-y-3">
                                            <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0" />
                                                <span>No More Double Bookings. Ever.</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0" />
                                                <span>Book Risk-Free. Cancel Anytime</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0" />
                                                <span>Automate Your Game, Sync Your Community.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleBookVenue}
                                        className="w-full py-4 bg-primary text-black font-black uppercase border-2 border-black shadow-hard active:translate-y-[2px] active:shadow-none transition-all rounded-xl flex items-center justify-center gap-2"
                                    >
                                        Booking Venue Dulu
                                    </button>

                                    <button
                                        onClick={handleCreateActivity}
                                        className="w-full py-4 bg-white dark:bg-zinc-800 text-gray-500 dark:text-gray-400 font-bold uppercase border-2 border-transparent hover:border-gray-200 dark:hover:border-zinc-700 transition-all rounded-xl"
                                    >
                                        Buat Aktivitas Langsung
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
