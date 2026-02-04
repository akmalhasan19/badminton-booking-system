"use client"

import { Suspense } from 'react'
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Tab } from "@/types"
import { useRouter } from "next/navigation"

export default function PrivacyPage() {
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
                    <div className="bg-pastel-mint border-2 border-black shadow-hard rounded-3xl p-8 md:p-12 mb-12 transform -rotate-1">
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-black uppercase tracking-tight">
                            Privacy Policy
                        </h1>
                        <p className="mt-4 text-lg md:text-xl font-medium text-gray-800">
                            Your data rights. No fluff. Just the facts.
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-8 bg-white border-2 border-black shadow-hard rounded-3xl p-8 md:p-12">
                        <section>
                            <h2 className="text-2xl font-display font-bold mb-4 flex items-center">
                                <span className="bg-pastel-acid w-8 h-8 flex items-center justify-center border-2 border-black rounded-lg mr-3 shadow-hard-sm text-sm">01</span>
                                Information We Collect
                            </h2>
                            <p className="text-gray-600 leading-relaxed indent-0">
                                When you create an account, book a court, or join a tournament, we collect information such as your name, email address, and payment details. We also track your smashes (kidding, but we do track court usage statistics to improve availability).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-display font-bold mb-4 flex items-center">
                                <span className="bg-pastel-acid w-8 h-8 flex items-center justify-center border-2 border-black rounded-lg mr-3 shadow-hard-sm text-sm">02</span>
                                How We Use It to Serve You
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                We use your data to:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-600">
                                <li>Process your bookings instantly.</li>
                                <li>Send you reminders so you don't miss a game.</li>
                                <li>Improve our app functionality and court maintenance schedules.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-display font-bold mb-4 flex items-center">
                                <span className="bg-pastel-acid w-8 h-8 flex items-center justify-center border-2 border-black rounded-lg mr-3 shadow-hard-sm text-sm">03</span>
                                Data Security
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                Your data is secured with industry-standard encryption. We treat your personal information like a match point—we don't drop the ball.
                            </p>
                        </section>

                        <div className="border-t-2 border-dashed border-gray-200 pt-8 mt-8">
                            <p className="text-sm text-gray-500">
                                Last updated: January 2025. Questions? Email us at privacy@smash.app
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
