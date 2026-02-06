"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Phone, Loader2, CheckCircle } from "lucide-react"
import { updatePhoneNumber } from "@/lib/auth/actions"

interface PhoneVerificationModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (newPhone: string) => void
    currentPhone?: string
}

export function PhoneVerificationModal({ isOpen, onClose, onSuccess, currentPhone }: PhoneVerificationModalProps) {
    const [phone, setPhone] = useState(currentPhone || "")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Client-side validation
        if (phone.length < 10) {
            setError("Nomor HP minimal 10 digit (contoh: 08123456789)")
            return
        }

        setIsLoading(true)

        try {
            const result = await updatePhoneNumber(phone)

            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                setTimeout(() => {
                    onSuccess(phone)
                    onClose()
                }, 1500)
            }
        } catch (err) {
            setError("Gagal menyimpan nomor HP. Coba lagi nanti.")
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border-2 border-black relative overflow-hidden"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                    disabled={isLoading || success}
                >
                    <X className="w-6 h-6 text-black" />
                </button>

                {/* Content */}
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-pastel-mint rounded-full border-2 border-black flex items-center justify-center mb-6 shadow-hard-sm">
                        {success ? (
                            <CheckCircle className="w-8 h-8 text-black" />
                        ) : (
                            <Phone className="w-8 h-8 text-black" />
                        )}
                    </div>

                    <h3 className="text-3xl font-display font-black text-black uppercase mb-2 tracking-tight">
                        {success ? "Saved!" : "Satu Langkah Lagi"}
                    </h3>

                    <p className="text-gray-600 mb-8 font-medium">
                        {success
                            ? "Nomor HP berhasil disimpan. Lanjutkan bookingmu!"
                            : "Kami memerlukan nomor WhatsApp aktif untuk konfirmasi booking dan link pembayaran."}
                    </p>

                    {!success && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                                    Nomor WhatsApp
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => {
                                            // Allow only numbers
                                            const val = e.target.value.replace(/\D/g, '')
                                            setPhone(val)
                                            setError(null)
                                        }}
                                        placeholder="08xxxxxxxxxx"
                                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-5 py-4 text-black font-bold text-lg outline-none focus:border-black transition-colors"
                                        autoFocus
                                    />
                                </div>
                                {error && (
                                    <p className="text-red-500 text-xs font-bold mt-2 flex items-center animate-fade-in">
                                        <X className="w-3 h-3 mr-1" /> {error}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || phone.length < 10}
                                className="w-full bg-black text-white font-display font-black text-xl py-4 rounded-xl border-2 border-transparent hover:bg-pastel-acid hover:text-black hover:border-black shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    "Simpan & Lanjut Booking"
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Decorative Background */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pastel-lilac rounded-full opacity-20 blur-2xl pointer-events-none"></div>
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-pastel-acid rounded-full opacity-20 blur-2xl pointer-events-none"></div>
            </motion.div>
        </motion.div>
    )
}
