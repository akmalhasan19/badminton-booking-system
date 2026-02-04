"use client"

import { Suspense } from 'react'
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Tab } from "@/types"
import { useRouter } from "next/navigation"
import { Trophy, Calendar, Users, ArrowRight } from "lucide-react"

export default function TournamentsPage() {
    const router = useRouter()

    const handleTabChange = (tab: Tab) => {
        router.push("/")
    }

    const tournaments = [
        {
            id: 1,
            name: "Summer Smash Open",
            date: "Aug 15-16, 2025",
            level: "Intermediate / Advanced",
            participants: "32 Teams",
            prize: "$1,000",
            status: "Open",
            color: "bg-pastel-acid"
        },
        {
            id: 2,
            name: "Rookie Rally",
            date: "Sep 02, 2025",
            level: "Beginner",
            participants: "16 Teams",
            prize: "Merch + Trophies",
            status: "Full",
            color: "bg-pastel-mint"
        },
        {
            id: 3,
            name: "Doubles Showdown",
            date: "Sep 20, 2025",
            level: "All Levels",
            participants: "24 Teams",
            prize: "$500",
            status: "Open",
            color: "bg-pastel-pink"
        }
    ]

    return (
        <main className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-pastel-acid selection:text-black">
            <Suspense fallback={<div className="h-20" />}>
                <Navbar activeTab={Tab.HOME} setActiveTab={handleTabChange} />
            </Suspense>

            <div className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section */}
                    <div className="bg-black text-white rounded-3xl p-8 md:p-16 mb-12 relative overflow-hidden border-2 border-black shadow-hard">
                        <div className="relative z-10 max-w-2xl">
                            <div className="inline-flex items-center gap-2 bg-pastel-acid text-black px-4 py-1.5 rounded-full font-bold text-sm mb-6 border-2 border-white">
                                <Trophy className="w-4 h-4" />
                                <span>SEASON 2025</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
                                COMPETE FOR GLORY
                            </h1>
                            <p className="text-xl text-gray-300 mb-8 max-w-lg">
                                Join the most electric badminton community. From beginner brackets to pro-level showdowns.
                            </p>
                        </div>
                        {/* Decorative background circle */}
                        <div className="absolute -right-20 -top-20 w-96 h-96 bg-gray-900 rounded-full blur-3xl opacity-50"></div>
                    </div>

                    {/* Filters/Stats Bar */}
                    <div className="flex flex-col md:flex-row gap-6 mb-12">
                        <div className="flex-1 bg-white border-2 border-black p-6 rounded-2xl shadow-hard-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-pastel-mint rounded-xl border-2 border-black flex items-center justify-center">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-bold">TOTAL PRIZE POOL</p>
                                <p className="text-2xl font-display font-bold">$15,000+</p>
                            </div>
                        </div>
                        <div className="flex-1 bg-white border-2 border-black p-6 rounded-2xl shadow-hard-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-pastel-lilac rounded-xl border-2 border-black flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-bold">ACTIVE PLAYERS</p>
                                <p className="text-2xl font-display font-bold">1,240</p>
                            </div>
                        </div>
                    </div>

                    {/* Tournaments Grid */}
                    <h2 className="text-4xl font-display font-bold mb-8 flex items-end gap-4">
                        Upcoming Events
                        <div className="h-2 flex-grow bg-black rounded-full mb-2 opacity-10"></div>
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tournaments.map((t) => (
                            <div key={t.id} className="group bg-white border-2 border-black rounded-3xl p-6 shadow-hard hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full">
                                <div className={`h-32 ${t.color} rounded-2xl border-2 border-black mb-6 flex items-center justify-center relative overflow-hidden`}>
                                    <Trophy className="w-16 h-16 opacity-20" />
                                    <div className="absolute top-4 right-4 bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                                        {t.status}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-display font-bold mb-2">{t.name}</h3>

                                <div className="space-y-3 mb-8 flex-grow">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <Calendar className="w-4 h-4" />
                                        {t.date}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <Users className="w-4 h-4" />
                                        {t.participants}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <Trophy className="w-4 h-4" />
                                        Pool: {t.prize}
                                    </div>
                                </div>

                                <button className="w-full bg-black text-white font-bold py-3 rounded-xl border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all flex items-center justify-center gap-2 group-hover:gap-4">
                                    Register Team <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
