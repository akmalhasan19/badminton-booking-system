"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Tab } from "@/types"
import { useRouter } from "next/navigation"
import { Cookie } from "lucide-react"

export default function CookiesPage() {
    const router = useRouter()

    const handleTabChange = (tab: Tab) => {
        router.push("/")
    }

    return (
        <main className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-pastel-acid selection:text-black">
            <Navbar activeTab={Tab.HOME} setActiveTab={handleTabChange} />

            <div className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="bg-pastel-peach border-2 border-black shadow-hard rounded-3xl p-8 md:p-12 mb-12 transform -rotate-1 relative overflow-hidden">
                        <Cookie className="absolute -right-10 -bottom-10 w-64 h-64 text-black opacity-5 rotate-12" />
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-black uppercase tracking-tight relative z-10">
                            Cookies Policy
                        </h1>
                        <p className="mt-4 text-lg md:text-xl font-medium text-gray-800 relative z-10">
                            Not the oatmeal raisin kind. The digital kind.
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-8 bg-white border-2 border-black shadow-hard rounded-3xl p-8 md:p-12">
                        <section>
                            <h2 className="text-2xl font-display font-bold mb-4">What Are Cookies?</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Cookies are small text files stored on your device that help us remember your preferences, like keeping you logged in or remembering your favorite court.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-display font-bold mb-4">How We Use Them</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 border-2 border-black rounded-xl bg-pastel-mint/20">
                                    <h3 className="font-bold mb-2">Essential</h3>
                                    <p className="text-sm text-gray-600">Required for the app to function (bookings, login).</p>
                                </div>
                                <div className="p-4 border-2 border-black rounded-xl bg-pastel-yellow/20">
                                    <h3 className="font-bold mb-2">Analytics</h3>
                                    <p className="text-sm text-gray-600">Helps us understand how you use the site so we can make it better.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-display font-bold mb-4">Your Choice</h2>
                            <p className="text-gray-600 leading-relaxed">
                                You can control cookies through your browser settings. However, disabling essential cookies may impact your ability to book courts instantly.
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
