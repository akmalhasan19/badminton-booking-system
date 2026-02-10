"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Clock, ArrowRight, Trophy, Calendar } from "lucide-react"
import { CommunityActivity } from "@/app/communities/actions"
import Link from "next/link"
import { useMemo } from "react"

interface ViewAllActivitiesModalProps {
    isOpen: boolean
    onClose: () => void
    activities: CommunityActivity[]
    timeZone?: string | null
}

export function ViewAllActivitiesModal({ isOpen, onClose, activities, timeZone }: ViewAllActivitiesModalProps) {
    const activityTimeZone = timeZone || 'Asia/Jakarta'

    const dateFormatter = useMemo(() => (
        new Intl.DateTimeFormat('id-ID', {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: activityTimeZone
        })
    ), [activityTimeZone])

    const dayFormatter = useMemo(() => (
        new Intl.DateTimeFormat('en-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: activityTimeZone
        })
    ), [activityTimeZone])

    const formatDate = (dateString: string) => {
        return dateFormatter.format(new Date(dateString))
    }

    const isToday = (dateString: string) => {
        return dayFormatter.format(new Date(dateString)) === dayFormatter.format(new Date())
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none"
                    >
                        <div className="bg-white dark:bg-zinc-900 w-full md:max-w-4xl h-[90vh] md:h-[85vh] md:rounded-3xl rounded-t-3xl border-t-3 md:border-3 border-black shadow-hard overflow-hidden pointer-events-auto flex flex-col">

                            {/* Header */}
                            <div className="p-5 border-b-3 border-black flex justify-between items-center bg-neo-green">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-6 h-6 stroke-[2.5px]" />
                                    <h2 className="text-xl font-black uppercase tracking-wider">All Activities</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black rounded-full hover:bg-black hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4 stroke-[3px]" />
                                </button>
                            </div>

                            {/* Content - Scrollable Grid */}
                            <div className="p-3 md:p-5 overflow-y-auto bg-gray-50 dark:bg-zinc-900/50 flex-1">
                                {activities.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {activities.map((activity) => (
                                            <div key={activity.id} className={`border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(82,82,91,1)] rounded-lg overflow-hidden flex flex-col ${activity.mode === 'RANKED' ? 'bg-primary' : 'bg-white dark:bg-zinc-800'}`}>
                                                <div className={`h-20 relative border-b-2 border-black ${activity.mode === 'RANKED' ? 'bg-yellow-200' : 'bg-gray-300'}`}>
                                                    {activity.mode === 'RANKED' ? (
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                                            <Trophy className="w-16 h-16 text-black" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                            <span className="text-gray-400 text-[10px] font-bold uppercase">Event Image</span>
                                                        </div>
                                                    )}

                                                    {isToday(activity.match_date) && (
                                                        <span className="absolute top-1 right-1 bg-secondary text-white text-[8px] font-bold px-1.5 py-0.5 uppercase border border-black shadow-sm">
                                                            Today
                                                        </span>
                                                    )}
                                                    {activity.mode === 'RANKED' && (
                                                        <span className="absolute top-1 right-1 bg-black text-white text-[8px] font-bold px-1.5 py-0.5 uppercase border border-white shadow-sm">
                                                            Tournament
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="p-2.5 flex flex-col gap-1.5 flex-grow">
                                                    <h3 className={`text-xs md:text-sm font-bold leading-tight line-clamp-2 ${activity.mode === 'RANKED' ? 'text-black' : 'dark:text-white'}`}>{activity.title}</h3>
                                                    <div className={`flex items-center gap-1.5 text-[10px] md:text-xs font-semibold ${activity.mode === 'RANKED' ? 'text-black/80' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(activity.match_date)}
                                                    </div>
                                                    <div className={`border-t-2 border-dashed my-0.5 ${activity.mode === 'RANKED' ? 'border-black/20' : 'border-gray-300 dark:border-gray-600'}`}></div>
                                                    <div className="flex justify-between items-center mt-auto">
                                                        <div className="flex -space-x-1.5 items-center">
                                                            {activity.users.map((user, idx) => (
                                                                <div key={idx} className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-[1.5px] flex items-center justify-center text-[8px] font-bold overflow-hidden ${activity.mode === 'RANKED' ? 'border-primary bg-white text-black' : 'border-white dark:border-zinc-700 bg-gray-200'}`}>
                                                                    {user.avatar_url ? (
                                                                        <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        user.full_name?.substring(0, 2).toUpperCase() || 'U'
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {activity.participant_count > 3 && (
                                                                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-[1.5px] flex items-center justify-center text-[8px] font-bold ${activity.mode === 'RANKED' ? 'border-primary bg-black text-white' : 'border-white dark:border-zinc-700 bg-black text-white'}`}>
                                                                    +{activity.participant_count - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Link href={`/matches/${activity.id}`} className={`w-6 h-6 md:w-7 md:h-7 border-2 border-black flex items-center justify-center rounded shadow-[1px_1px_0px_0px_#000000] active:translate-y-0.5 active:shadow-none transition-all ${activity.mode === 'RANKED' ? 'bg-white' : 'bg-secondary'}`}>
                                                            <ArrowRight className={`${activity.mode === 'RANKED' ? 'text-black' : 'text-white'} w-3 h-3 md:w-4 md:h-4`} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                            <Calendar className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-bold dark:text-white mb-2">Belum ada aktivitas</h3>
                                        <p className="text-gray-500 max-w-sm">
                                            Komunitas ini belum memiliki jadwal aktivitas yang akan datang.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
