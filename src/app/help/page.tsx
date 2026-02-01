"use client"

import { PageHeader } from "@/components/PageHeader"
import { ChevronDown, MessageCircle, Mail, Phone } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

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
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <main className="min-h-screen bg-white pt-24 pb-12">
            <div className="max-w-2xl mx-auto px-4">
                <PageHeader
                    title="Pusat Bantuan"
                    description="Temukan jawaban atas pertanyaanmu atau hubungi tim support kami."
                />

                {/* FAQ Section */}
                <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">?</span>
                    Sering Ditanyakan
                </h2>

                <div className="space-y-4 mb-12">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border-2 border-black rounded-xl overflow-hidden shadow-hard bg-white"
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
                                        <div className="p-4 pt-0 text-gray-600 font-medium border-t-2 border-gray-100">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* Contact Support */}
                <h2 className="text-2xl font-display font-bold mb-6">Hubungi Kami</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <a href="https://wa.me/62812345678" target="_blank" className="flex flex-col items-center justify-center gap-3 p-6 bg-pastel-mint border-2 border-black rounded-xl shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group">
                        <div className="w-12 h-12 bg-white rounded-full border-2 border-black flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="font-bold">WhatsApp</span>
                    </a>

                    <a href="mailto:support@smash.com" className="flex flex-col items-center justify-center gap-3 p-6 bg-pastel-pink border-2 border-black rounded-xl shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group">
                        <div className="w-12 h-12 bg-white rounded-full border-2 border-black flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Mail className="w-6 h-6" />
                        </div>
                        <span className="font-bold">Email</span>
                    </a>

                    <a href="tel:+6221555555" className="flex flex-col items-center justify-center gap-3 p-6 bg-pastel-yellow border-2 border-black rounded-xl shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group">
                        <div className="w-12 h-12 bg-white rounded-full border-2 border-black flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Phone className="w-6 h-6" />
                        </div>
                        <span className="font-bold">Call Center</span>
                    </a>
                </div>
            </div>
        </main>
    )
}
