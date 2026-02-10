"use client"

import { ArrowRight, Trophy, Users, Plus, Calendar } from "lucide-react"
import { CommunityActivity } from "@/app/communities/actions"
import Link from "next/link"
import { useMemo, useState } from "react"
import { CreateActivityModal } from "./CreateActivityModal"
import { ViewAllActivitiesModal } from "./ViewAllActivitiesModal"


interface CommunityActivitiesProps {
    activities?: CommunityActivity[]
    role?: string | null
    communityId?: string
    timeZone?: string | null
}

export function CommunityActivities({ activities = [], role, communityId, timeZone }: CommunityActivitiesProps) {

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false)
    const [filter, setFilter] = useState<'ALL' | 'CASUAL' | 'RANKED' | 'SPARRING'>('ALL')
    const activityTimeZone = timeZone || 'Asia/Jakarta'
    const canCreateActivity = role === 'admin' && Boolean(communityId)

    const shortDateFormatter = useMemo(() => (
        new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            timeZone: activityTimeZone
        })
    ), [activityTimeZone])

    const formatShortDate = (dateString: string, startTime?: string | null) => {
        const dateLabel = shortDateFormatter.format(new Date(dateString))
        const timeLabel = startTime ? startTime.slice(0, 5) : ''
        return timeLabel ? `${dateLabel} • ${timeLabel}` : dateLabel
    }

    const getModeLabel = (mode: CommunityActivity["mode"]) => {
        if (mode === 'RANKED') return 'Tournament'
        if (mode === 'DRILLING') return 'Drilling'
        return 'Main Bareng'
    }

    const getModeBadgeClass = (mode: CommunityActivity["mode"]) => {
        if (mode === 'RANKED') return 'bg-black text-white'
        if (mode === 'DRILLING') return 'bg-pastel-lilac text-black'
        return 'bg-pastel-mint text-black'
    }

    const filteredActivities = useMemo(() => {
        if (filter === 'ALL') return activities
        // @ts-ignore - SPARRING might not be in type yet
        return activities.filter(a => filter === 'SPARRING' ? (a.mode === 'SPARRING' || (a.mode as any) === 'DRILLING') : a.mode === filter)
    }, [activities, filter])

    return (
        <div className="flex flex-col">
            <div className="mb-4 flex items-end justify-between border-b-4 border-black dark:border-white pb-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter dark:text-white">Activities</h2>
                <div className="flex items-center gap-2">
                    {activities.length > 0 && (
                        <button
                            onClick={() => setIsViewAllModalOpen(true)}
                            className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1 uppercase rounded-sm hover:bg-gray-800 transition-colors"
                        >
                            View All
                        </button>
                    )}
                    {activities.length > 0 && canCreateActivity && (
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-primary text-black text-xs font-bold px-3 py-1 uppercase rounded-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            Buat Aktivitas
                        </button>
                    )}
                </div>
            </div>

            {activities.length > 0 ? (
                <>
                    {/* Filters - Horizontal Scroll */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`${filter === 'ALL' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]' : 'bg-white dark:bg-surface-dark text-black dark:text-white border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]'} border-2 px-4 py-1.5 text-xs font-bold uppercase whitespace-nowrap active:translate-y-0.5 active:shadow-none transition-all`}
                        >
                            All Events
                        </button>
                        <button
                            onClick={() => setFilter('CASUAL')}
                            className={`${filter === 'CASUAL' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]' : 'bg-white dark:bg-surface-dark text-black dark:text-white border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]'} border-2 px-4 py-1.5 text-xs font-bold uppercase whitespace-nowrap active:translate-y-0.5 active:shadow-none transition-all`}
                        >
                            Open Play
                        </button>
                        <button
                            onClick={() => setFilter('SPARRING')}
                            className={`${filter === 'SPARRING' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]' : 'bg-white dark:bg-surface-dark text-black dark:text-white border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]'} border-2 px-4 py-1.5 text-xs font-bold uppercase whitespace-nowrap active:translate-y-0.5 active:shadow-none transition-all`}
                        >
                            Sparring
                        </button>
                        <button
                            onClick={() => setFilter('RANKED')}
                            className={`${filter === 'RANKED' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]' : 'bg-white dark:bg-surface-dark text-black dark:text-white border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]'} border-2 px-4 py-1.5 text-xs font-bold uppercase whitespace-nowrap active:translate-y-0.5 active:shadow-none transition-all`}
                        >
                            Tournaments
                        </button>
                    </div>

                    {/* Activities - Match-style cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="bg-white dark:bg-surface-dark rounded-xl border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all overflow-hidden group flex flex-col h-full"
                            >
                                <div className="px-4 py-2.5 border-b-2 border-black dark:border-white bg-gray-50 dark:bg-zinc-800 flex justify-between items-center h-10">
                                    <div className="flex gap-2 items-center">
                                        <span className={`text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wide ${getModeBadgeClass(activity.mode)}`}>
                                            {getModeLabel(activity.mode)}
                                        </span>
                                        <span className="text-xs font-black px-2 py-0.5 rounded-md border border-black dark:border-white uppercase tracking-wide bg-white dark:bg-surface-dark text-black dark:text-white">
                                            {activity.participant_count}/{activity.max_participants} PAX
                                        </span>
                                    </div>
                                    {activity.mode === 'RANKED' && (
                                        <Trophy className="w-4 h-4 text-orange-500" />
                                    )}
                                </div>

                                <div className="p-4 flex-1 flex flex-col gap-2 min-h-[90px]">
                                    <h3 className="text-base font-black text-black dark:text-white leading-tight uppercase line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                                        {activity.title}
                                    </h3>

                                    <div className="mt-auto space-y-2">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Calendar className="w-4 h-4 shrink-0" />
                                            <p className="text-xs font-bold leading-none">
                                                {formatShortDate(activity.match_date, activity.start_time)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Users className="w-4 h-4 shrink-0" />
                                            <p className="text-xs font-bold leading-none">
                                                {activity.participant_count} peserta terdaftar
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-4 py-2.5 border-t-2 border-black dark:border-white bg-white dark:bg-surface-dark flex justify-between items-center h-10">
                                    <span className="text-base font-black text-black dark:text-white">
                                        {activity.price_per_person && activity.price_per_person > 0
                                            ? `IDR ${activity.price_per_person / 1000}k`
                                            : 'Free'
                                        }
                                    </span>

                                    <Link
                                        href={`/matches/${activity.id}`}
                                        className="px-3 py-1 bg-pastel-mint text-black font-black rounded-md border border-black hover:bg-green-400 transition-colors text-xs uppercase flex items-center gap-1.5 shadow-sm hover:translate-y-px hover:shadow-none"
                                    >
                                        Join <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="bg-white dark:bg-surface-dark border-2 border-black dark:border-white border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                        <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    {role === 'admin' ? (
                        <>
                            <h3 className="text-xl font-bold dark:text-white">Ayo buat aktivitas baru!</h3>
                            <p className="text-sm text-gray-500 max-w-xs mb-2">
                                Komunitasmu belum ada jadwal main nih. Buat jadwal sekarang biar membermu semangat!
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-6 py-2.5 bg-primary text-black font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-lg flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Buat Aktivitas
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold dark:text-white">Tunggu aktivitas selanjutnya ya!</h3>
                            <p className="text-sm text-gray-500 max-w-xs">
                                Admin belum menjadwalkan mabar atau turnamen baru. Cek lagi nanti ya!
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Challenge Mode Card - Only show if there are some activities or maybe always? keeping it for now */}
            {activities.length > 0 && (
                <div className="mt-2 bg-black dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_ #52525b] rounded-xl p-6 relative overflow-visible mt-8">
                    <div className="absolute -top-3 -right-2 bg-primary border-2 border-black px-3 py-1 transform rotate-6 shadow-sm z-10">
                        <span className="text-xs font-black uppercase text-black">New</span>
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">Challenge Mode?</h3>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                        Open your community for sparring with other clubs nearby. Prove your worth on the court.
                    </p>
                    <button className="w-full bg-white text-black font-black uppercase py-3 border-2 border-black shadow-[4px_4px_0px_0px_#EF4444] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#EF4444] transition-all rounded-lg">
                        Activate Now
                    </button>
                </div>
            )}

            <CreateActivityModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                communityId={communityId || ''}
            />

            <ViewAllActivitiesModal
                isOpen={isViewAllModalOpen}
                onClose={() => setIsViewAllModalOpen(false)}
                activities={activities}
                timeZone={timeZone}
            />
        </div>

    )
}
