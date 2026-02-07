"use client"

import { Clock, ArrowRight, Trophy, Bolt, Users } from "lucide-react"

export function CommunityActivities() {
    return (
        <div className="flex flex-col">
            <div className="mb-4 flex items-end justify-between border-b-4 border-black dark:border-white pb-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter dark:text-white">Activities</h2>
                <button className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1 uppercase rounded-sm hover:bg-gray-800 transition-colors">
                    View All
                </button>
            </div>

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
                {/* Event Card 1 */}
                <div className="min-w-[280px] bg-white dark:bg-surface-dark border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(82,82,91,1)] rounded-xl overflow-hidden flex flex-col md:w-full">
                    <div className="h-32 bg-gray-300 relative">
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 font-bold uppercase">Event Image</span>
                        </div>
                        <span className="absolute top-2 right-2 bg-secondary text-white text-[10px] font-bold px-2 py-1 uppercase border border-black shadow-sm">
                            Today
                        </span>
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                        <h3 className="text-lg font-bold leading-tight dark:text-white">Morning Smash Session</h3>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            07:00 - 09:00 AM
                        </div>
                        <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 my-1"></div>
                        <div className="flex justify-between items-center mt-1">
                            <div className="flex -space-x-2 items-center">
                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-dark bg-gray-200 flex items-center justify-center text-[10px] font-bold">JD</div>
                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-dark bg-black text-white flex items-center justify-center text-[10px] font-bold">+4</div>
                            </div>
                            <button className="w-8 h-8 bg-secondary border-2 border-black flex items-center justify-center rounded-md shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-none transition-all">
                                <ArrowRight className="text-white w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Event Card 2 */}
                <div className="min-w-[280px] bg-primary border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(82,82,91,1)] rounded-xl overflow-hidden flex flex-col md:w-full">
                    <div className="h-32 bg-yellow-200 relative border-b-2 border-black">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <Trophy className="w-24 h-24 text-black" />
                        </div>
                        <span className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase border border-white shadow-sm">
                            Weekend
                        </span>
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                        <h3 className="text-lg font-bold leading-tight text-black">Weekly Tournament</h3>
                        <div className="flex items-center gap-2 text-sm font-semibold text-black/80">
                            <Clock className="w-4 h-4" />
                            Sat, 14:00 PM
                        </div>
                        <div className="border-t-2 border-dashed border-black/20 my-1"></div>
                        <div className="flex justify-between items-center mt-1">
                            <div className="flex -space-x-2 items-center">
                                <div className="w-8 h-8 rounded-full border-2 border-primary bg-white flex items-center justify-center text-[10px] font-bold text-black">
                                    <div className="w-full h-full flex items-center justify-center bg-white rounded-full"><Users className="w-4 h-4" /></div>
                                </div>
                                <div className="w-8 h-8 rounded-full border-2 border-primary bg-black text-white flex items-center justify-center text-[10px] font-bold">+12</div>
                            </div>
                            <button className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center rounded-md shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-none transition-all">
                                <ArrowRight className="text-black w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Challenge Mode Card */}
            <div className="mt-2 bg-black dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_ #52525b] rounded-xl p-6 relative overflow-visible">
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
        </div>
    )
}
