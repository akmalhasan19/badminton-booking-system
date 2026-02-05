"use client"

import { UserSidebar } from "@/components/UserSidebar"
import { MobileHeader } from "@/components/MobileHeader"
import { SmashLogo } from "@/components/SmashLogo"
import { getCurrentUser } from "@/lib/auth/actions"
import { ChevronDown, MessageCircle, Mail, Phone, HelpCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const faqs = [
    {
        question: "Bagaimana cara melakukan booking?",
        answer: "Pilih menu 'Book', pilih lapangan dan jam yang tersedia, lalu selesaikan pembayaran. Tiket akan muncul di menu 'Booking Saya'."
    },
    {
        question: "Apakah bisa reschedule jadwal?",
        answer: "Ya, reschedule bisa dilakukan maksimal 24 jam sebelum jadwal main. Silakan hubungi admin melalui kontak di bawah ini."
    },
    {
        question: "Metode pembayaran apa saja yang tersedia?",
        answer: "Kami menerima transfer bank (BCA, Mandiri), E-Wallet (GoPay, OVO, Dana), dan pembayaran QRIS."
    },
    {
        question: "Bagaimana jika hujan (untuk lapangan outdoor)?",
        answer: "Untuk lapangan outdoor, kami memberikan garansi reschedule jika terjadi hujan deras saat jam main Anda. Lapangan indoor tidak terpengaruh."
    }
]

export default function HelpPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await getCurrentUser()
            setUser(userData)
        }
        fetchUser()
    }, [])

    return (
        <main className="min-h-screen bg-white pt-0 md:pt-6 pb-12 relative overflow-hidden">
            {/* Grid Background */}
            <div
                className="absolute inset-0 z-0 w-full h-full pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(160, 82, 45, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 82, 45, 0.15) 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}
            />

            {/* Logo Link */}
            <div
                onClick={() => router.push('/')}
                className="absolute top-6 right-8 hidden md:flex items-center gap-2 cursor-pointer group z-20"
                title="Kembali ke Beranda"
            >
                <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                    <SmashLogo className="w-full h-full bg-black" />
                </div>
                <span className="text-xl font-display font-bold tracking-tight">Smash<span className="text-pastel-lilac">.</span></span>
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                    Kembali ke Beranda
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-black transform rotate-45"></div>
                </div>
            </div>

            <MobileHeader title="Bantuan & Support" backPath="/account" />

            <div className="max-w-7xl mx-auto px-4 relative z-10 pt-8 md:pt-0">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Left Sidebar - Hidden on mobile */}
                    <div className="hidden md:block space-y-6">
                        <UserSidebar user={user} />
                    </div>

                    {/* Right Content */}
                    <div className="space-y-8">
                        <div className="border-b-2 border-black/5 pb-4">
                            <h1 className="text-3xl font-display font-black uppercase mb-1">Bantuan & Support</h1>
                            <p className="text-gray-500 font-medium">Temukan jawaban atas pertanyaanmu atau hubungi tim support kami.</p>
                        </div>

                        {/* FAQ Section */}
                        <div>
                            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">?</span>
                                Sering Ditanyakan
                            </h2>

                            <div className="space-y-4">
                                {faqs.map((faq, index) => (
                                    <div
                                        key={index}
                                        className="border-2 border-black rounded-xl overflow-hidden shadow-hard bg-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm transition-all"
                                    >
                                        <button
                                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                            className="w-full p-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="font-bold font-display text-lg">{faq.question}</span>
                                            <motion.div
                                                animate={{ rotate: openIndex === index ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ChevronDown className="w-5 h-5" />
                                            </motion.div>
                                        </button>
                                        <AnimatePresence>
                                            {openIndex === index && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div className="p-4 pt-0 text-gray-600 font-medium border-t-2 border-gray-100 leading-relaxed">
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Support */}
                        <div>
                            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                                <MessageCircle className="w-6 h-6" />
                                Hubungi Kami
                            </h2>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <a href="https://wa.me/62812345678" target="_blank" className="flex flex-col items-center justify-center gap-3 p-6 bg-pastel-mint border-2 border-black rounded-xl shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group">
                                    <div className="w-12 h-12 bg-white rounded-full border-2 border-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <MessageCircle className="w-6 h-6 text-black" />
                                    </div>
                                    <span className="font-bold">WhatsApp</span>
                                </a>

                                <a href="mailto:support@smash.com" className="flex flex-col items-center justify-center gap-3 p-6 bg-pastel-pink border-2 border-black rounded-xl shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group">
                                    <div className="w-12 h-12 bg-white rounded-full border-2 border-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Mail className="w-6 h-6 text-black" />
                                    </div>
                                    <span className="font-bold">Email</span>
                                </a>

                                <a href="tel:+6221555555" className="flex flex-col items-center justify-center gap-3 p-6 bg-pastel-yellow border-2 border-black rounded-xl shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group">
                                    <div className="w-12 h-12 bg-white rounded-full border-2 border-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Phone className="w-6 h-6 text-black" />
                                    </div>
                                    <span className="font-bold">Call Center</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
