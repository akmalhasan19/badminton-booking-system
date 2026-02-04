"use client"

import { Suspense } from 'react'
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Tab } from "@/types"
import { useRouter } from "next/navigation"

export default function TermsPage() {
    const router = useRouter()

    const handleTabChange = (tab: Tab) => {
        router.push("/")
    }

    return (
        <main className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-pastel-acid selection:text-black">
            <Suspense fallback={<div className="h-20" />}>
                <Navbar activeTab={Tab.HOME} setActiveTab={handleTabChange} />
            </Suspense>

            <div className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="bg-pastel-lilac border-2 border-black shadow-hard rounded-3xl p-8 md:p-12 mb-12 transform rotate-1">
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-black uppercase tracking-tight">
                            Terms of Service
                        </h1>
                        <p className="mt-4 text-lg md:text-xl font-medium text-gray-800">
                            The rules of the game. Fair play required.
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-8 bg-white border-2 border-black shadow-hard rounded-3xl p-8 md:p-12">
                        <section>
                            <h2 className="text-2xl font-display font-bold mb-4">1. Booking Rules</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Bookings are confirmed instantly. Cancellations must be made at least 24 hours in advance for a full refund. No-shows are charged in full.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-display font-bold mb-4">2. Court Etiquette</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Respect the court and other players. Non-marking shoes are mandatory on wooden and synthetic courts. Aggressive behavior results in an immediate ban (red card).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-display font-bold mb-4">3. Liability</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Play at your own risk. Smash & Serve is not liable for injuries sustained during play, though we ensure all facilities meet safety standards.
                            </p>
                        </section>

                        <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300">
                            <h3 className="font-bold text-lg mb-2">TL;DR</h3>
                            <p className="text-gray-600">Be nice, wear the right shoes, show up on time, and have fun.</p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
