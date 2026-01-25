"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Tab } from "@/types"
import { useRouter } from "next/navigation"
import { CheckCircle2, Star, ArrowUpRight } from "lucide-react"

export default function CoachingPage() {
    const router = useRouter()

    const handleTabChange = (tab: Tab) => {
        router.push("/")
    }

    const coaches = [
        {
            name: "Sarah Lin",
            role: "Head Coach",
            bg: "bg-pastel-pink",
            specialty: "Advanced Tactics"
        },
        {
            name: "Mike Chen",
            role: "Senior Coach",
            bg: "bg-pastel-mint",
            specialty: "Footwork & Speed"
        },
        {
            name: "Alex Kowalski",
            role: "Performance Coach",
            bg: "bg-pastel-yellow",
            specialty: "Power & Smash"
        }
    ]

    return (
        <main className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-pastel-acid selection:text-black">
            <Navbar activeTab={Tab.HOME} setActiveTab={handleTabChange} />

            <div className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="bg-pastel-acid px-3 py-1 rounded-full border-2 border-black font-bold text-sm mb-4 inline-block">
                            LEVEL UP YOUR GAME
                        </span>
                        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
                            ELITE COACHING
                        </h1>
                        <p className="text-xl text-gray-600">
                            Learn from former pros and certified instructors. Individual attention, video analysis, and personalized training plans.
                        </p>
                    </div>

                    {/* Bento Grid Layout for Coaching Info */}
                    <div className="grid md:grid-cols-12 gap-6 mb-20">
                        {/* Featured Image / Main Callout */}
                        <div className="md:col-span-8 bg-black rounded-3xl p-8 md:p-12 relative overflow-hidden text-white border-2 border-black shadow-hard flex flex-col justify-end min-h-[400px]">
                            <img src="https://images.unsplash.com/photo-1626224583764-84786c713064?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700" alt="Training" />
                            <div className="relative z-10">
                                <h2 className="text-4xl font-display font-bold mb-4">1-on-1 Sessions</h2>
                                <p className="text-lg text-gray-200 mb-6 max-w-md">Get undivided attention. We break down your technique frame-by-frame and rebuild it for efficiency and power.</p>
                                <button className="bg-pastel-acid text-black px-8 py-3 rounded-xl font-bold border-2 border-black hover:bg-white transition-colors">
                                    Book a Session
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats / Info */}
                        <div className="md:col-span-4 space-y-6">
                            <div className="bg-pastel-lilac rounded-3xl p-8 border-2 border-black shadow-hard h-full flex flex-col justify-center">
                                <Star className="w-10 h-10 mb-4 fill-black" />
                                <h3 className="text-3xl font-display font-bold mb-2">4.9/5</h3>
                                <p className="font-bold">Average Coach Rating</p>
                                <p className="text-sm opacity-70">Based on 500+ sessions</p>
                            </div>
                        </div>
                    </div>

                    {/* Coaches Section */}
                    <div className="mb-20">
                        <h2 className="text-4xl font-display font-bold mb-10 text-center">Meet The Squad</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {coaches.map((coach, idx) => (
                                <div key={idx} className="bg-white rounded-3xl border-2 border-black p-4 shadow-hard hover:-translate-y-2 transition-transform">
                                    <div className={`${coach.bg} aspect-square rounded-2xl border-2 border-black mb-4 flex items-end p-4 relative overflow-hidden`}>
                                        {/* Abstract placeholder for coach image */}
                                        <div className="absolute inset-0 bg-noise opacity-20"></div>
                                        <div className="relative z-10">
                                            <span className="bg-white px-3 py-1 rounded-lg text-xs font-bold border-2 border-black inline-block mb-2">
                                                {coach.role}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="px-2 pb-2">
                                        <h3 className="text-2xl font-display font-bold">{coach.name}</h3>
                                        <p className="text-gray-600 font-medium mb-4">{coach.specialty}</p>
                                        <button className="w-full border-2 border-black bg-transparent hover:bg-black hover:text-white transition-colors py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 group">
                                            View Profile <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Programs List */}
                    <div className="max-w-4xl mx-auto bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-hard">
                        <h2 className="text-3xl font-display font-bold mb-8">Training Modules</h2>
                        <div className="space-y-4">
                            {['Beginner Foundations (4 Weeks)', 'Intermediate Skills Lab', 'Elite High-Performance Camp', 'Doubles Strategy Workshop'].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-black transition-colors bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <CheckCircle2 className="w-6 h-6 text-pastel-acid fill-black" />
                                        <span className="font-bold text-lg">{item}</span>
                                    </div>
                                    <button className="text-sm underline font-bold">Details</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
