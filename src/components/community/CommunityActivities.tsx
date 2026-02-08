"use client"

import { Clock, ArrowRight, Trophy, Bolt, Users, Plus, Calendar } from "lucide-react"
import { CommunityActivity } from "@/app/communities/actions"
import Link from "next/link"
import { useState } from "react"
import { CreateActivityModal } from "./CreateActivityModal"

interface CommunityActivitiesProps {
    activities?: CommunityActivity[]
    role?: string | null
    communityId?: string
}

export function CommunityActivities({ activities = [], role, communityId }: CommunityActivitiesProps) {

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Helper to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('id-ID', { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
    }

    // Helper to check if date is today
    const isToday = (dateString: string) => {
        const date = new Date(dateString)
        const today = new Date()
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
    }
    return (
        <div className="flex flex-col">
            <div className="mb-4 flex items-end justify-between border-b-4 border-black dark:border-white pb-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter dark:text-white">Activities</h2>
                {activities.length > 0 && (
                    <button className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1 uppercase rounded-sm hover:bg-gray-800 transition-colors">
                        View All
                    </button>
                )}
            </div>

            {activities.length > 0 ? (
                <>
                    {/* Filters - Horizontal Scroll */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                        <button className="bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white px-4 py-1.5 text-xs font-bold uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-0.5 active:shadow-none transition-all">
                            All Events
                        </button>
                        <button className="bg-white dark:bg-surface-dark text-black dark:text-white border-2 border-black dark:border-white px-4 py-1.5 text-xs font-bold uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-0.5 active:shadow-none transition-all">
                            Open Play
                        </button>
                        <button className="bg-white dark:bg-surface-dark text-black dark:text-white border-2 border-black dark:border-white px-4 py-1.5 text-xs font-bold uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-0.5 active:shadow-none transition-all">
                            Tournaments
                        </button>
                    </div>

                    {/* Activities - Horizontal Scroll */}
                    <div className="flex overflow-x-auto gap-4 no-scrollbar pb-8 -mx-5 px-5 md:grid md:grid-cols-2 lg:grid-cols-3 md:mx-0 md:px-0 md:overflow-visible">
                        {activities.map((activity) => (
                            <div key={activity.id} className={`min-w-[280px] border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(82,82,91,1)] rounded-xl overflow-hidden flex flex-col md:w-full ${activity.mode === 'RANKED' ? 'bg-primary' : 'bg-white dark:bg-surface-dark'}`}>
                                <div className={`h-32 relative border-b-2 border-black ${activity.mode === 'RANKED' ? 'bg-yellow-200' : 'bg-gray-300'}`}>
                                    {activity.mode === 'RANKED' ? (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                            <Trophy className="w-24 h-24 text-black" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400 font-bold uppercase">Event Image</span>
                                        </div>
                                    )}

                                    {isToday(activity.match_date) && (
                                        <span className="absolute top-2 right-2 bg-secondary text-white text-[10px] font-bold px-2 py-1 uppercase border border-black shadow-sm">
                                            Today
                                        </span>
                                    )}
                                    {activity.mode === 'RANKED' && (
                                        <span className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase border border-white shadow-sm">
                                            Tournament
                                        </span>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col gap-2">
                                    <h3 className={`text-lg font-bold leading-tight ${activity.mode === 'RANKED' ? 'text-black' : 'dark:text-white'}`}>{activity.title}</h3>
                                    <div className={`flex items-center gap-2 text-sm font-semibold ${activity.mode === 'RANKED' ? 'text-black/80' : 'text-gray-600 dark:text-gray-400'}`}>
                                        <Clock className="w-4 h-4" />
                                        {formatDate(activity.match_date)}
                                    </div>
                                    <div className={`border-t-2 border-dashed my-1 ${activity.mode === 'RANKED' ? 'border-black/20' : 'border-gray-300 dark:border-gray-600'}`}></div>
                                    <div className="flex justify-between items-center mt-1">
                                        <div className="flex -space-x-2 items-center">
                                            {activity.users.map((user, idx) => (
                                                <div key={idx} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold overflow-hidden ${activity.mode === 'RANKED' ? 'border-primary bg-white text-black' : 'border-white dark:border-surface-dark bg-gray-200'}`}>
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.full_name?.substring(0, 2).toUpperCase() || 'U'
                                                    )}
                                                </div>
                                            ))}
                                            {activity.participant_count > 3 && (
                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${activity.mode === 'RANKED' ? 'border-primary bg-black text-white' : 'border-white dark:border-surface-dark bg-black text-white'}`}>
                                                    +{activity.participant_count - 3}
                                                </div>
                                            )}
                                        </div>
                                        <Link href={`/matches/${activity.id}`} className={`w-8 h-8 border-2 border-black flex items-center justify-center rounded-md shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-none transition-all ${activity.mode === 'RANKED' ? 'bg-white' : 'bg-secondary'}`}>
                                            <ArrowRight className={`${activity.mode === 'RANKED' ? 'text-black' : 'text-white'} w-5 h-5`} />
                                        </Link>
                                    </div>
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
        </div>
    )
}
