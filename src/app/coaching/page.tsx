import { Suspense } from 'react'
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Tab } from "@/types"
import { CoachSection } from "@/components/CoachSection"
import { getCoaches } from "@/lib/coaches/actions"
import { Star } from "lucide-react"

export default async function CoachingPage() {
    // Fetch coaches from backend
    const coaches = await getCoaches()

    return (
        <main className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-pastel-acid selection:text-black">
            <Suspense fallback={<div className="h-20" />}>
                <Navbar activeTab={Tab.HOME} setActiveTab={() => { }} />
            </Suspense>

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
                            Learn from experienced coaches and certified instructors. Individual attention, personalized training plans, and professional guidance.
                        </p>
                    </div>

                    {/* Bento Grid Layout for Coaching Info */}
                    <div className="grid md:grid-cols-12 gap-6 mb-20">
                        {/* Featured Image / Main Callout */}
                        <div className="md:col-span-8 bg-black rounded-3xl p-8 md:p-12 relative overflow-hidden text-white border-2 border-black shadow-hard flex flex-col justify-end min-h-[400px]">
                            <img src="https://images.unsplash.com/photo-1626224583764-84786c713064?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700" alt="Training" />
                            <div className="relative z-10">
                                <h2 className="text-4xl font-display font-bold mb-4">1-on-1 Sessions</h2>
                                <p className="text-lg text-gray-200 mb-6 max-w-md">Get undivided attention. We break down your technique and rebuild it for efficiency and power.</p>
                                <a href="#coaches" className="bg-pastel-acid text-black px-8 py-3 rounded-xl font-bold border-2 border-black hover:bg-white transition-colors inline-block">
                                    Book a Session
                                </a>
                            </div>
                        </div>

                        {/* Quick Stats / Info */}
                        <div className="md:col-span-4 space-y-6">
                            <div className="bg-pastel-lilac rounded-3xl p-8 border-2 border-black shadow-hard h-full flex flex-col justify-center">
                                <Star className="w-10 h-10 mb-4 fill-black" />
                                <h3 className="text-3xl font-display font-bold mb-2">
                                    {coaches.length > 0
                                        ? (coaches.reduce((acc, c) => acc + c.average_rating, 0) / coaches.length).toFixed(1)
                                        : '4.9'
                                    }/5
                                </h3>
                                <p className="font-bold">Average Coach Rating</p>
                                <p className="text-sm opacity-70">
                                    {coaches.reduce((acc, c) => acc + c.total_sessions, 0)}+ sessions completed
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Coaches List */}
                    <div id="coaches" className="scroll-mt-20">
                        <Suspense fallback={
                            <div className="text-center py-20">
                                <div className="animate-pulse">Loading coaches...</div>
                            </div>
                        }>
                            <CoachSection coaches={coaches} />
                        </Suspense>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
