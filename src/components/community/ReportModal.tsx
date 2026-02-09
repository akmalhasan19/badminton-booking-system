"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertTriangle, Check, ChevronRight } from "lucide-react"
import { toast } from "sonner"

interface ReportModalProps {
    isOpen: boolean
    onClose: () => void
    communityName: string
}

const REPORT_REASONS = [
    { id: 'spam', label: 'Spam or harmful', description: 'Posting spam or harmful links' },
    { id: 'inappropriate', label: 'Inappropriate content', description: 'Sexual content, nudity, or gore' },
    { id: 'harassment', label: 'Harassment or hate speech', description: 'Bullying, threats, or hate speech' },
    { id: 'fake', label: 'Fake community', description: 'Impersonation or fake information' },
    { id: 'other', label: 'Other issue', description: 'Something else not listed above' }
]

export function ReportModal({ isOpen, onClose, communityName }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState<string>("")
    const [description, setDescription] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState<'reason' | 'description'>('reason')

    const handleSubmit = async () => {
        if (!selectedReason) {
            toast.error("Please select a reason")
            return
        }

        setIsSubmitting(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        console.log("Report Submitted:", {
            community: communityName,
            reason: selectedReason,
            description
        })

        toast.success("Laporan berhasil dikirim. Terima kasih atas bantuan Anda menjaga komunitas tetap aman.")
        setIsSubmitting(false)
        onClose()

        // Reset state after close
        setTimeout(() => {
            setStep('reason')
            setSelectedReason("")
            setDescription("")
        }, 300)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal Container - optimized for mobile bottom-sheet style or centered modal */}
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none"
                    >
                        {/* Modal Content */}
                        <div className="bg-white dark:bg-background-dark w-full md:max-w-md md:rounded-3xl rounded-t-3xl border-t-3 md:border-3 border-black shadow-hard overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">

                            {/* Header */}
                            <div className="p-5 border-b-3 border-black flex justify-between items-center bg-neo-yellow">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 stroke-[2.5px]" />
                                    <h2 className="text-lg font-black uppercase tracking-wider">Report Community</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black rounded-full hover:bg-black hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4 stroke-[3px]" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5 overflow-y-auto bg-white flex-1 min-h-[300px]">
                                {step === 'reason' ? (
                                    <div className="space-y-4">
                                        <div className="mb-4">
                                            <p className="font-bold text-lg mb-1">Mengapa Anda melaporkan ini?</p>
                                            <p className="text-sm text-gray-500">Pilih alasan yang paling sesuai dengan pelanggaran.</p>
                                        </div>

                                        <div className="space-y-3">
                                            {REPORT_REASONS.map((reason) => (
                                                <button
                                                    key={reason.id}
                                                    onClick={() => setSelectedReason(reason.id)}
                                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${selectedReason === reason.id
                                                            ? 'border-black bg-pastel-lilac shadow-hard-sm transform -translate-y-1'
                                                            : 'border-gray-200 hover:border-black hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div>
                                                        <p className="font-bold text-sm text-black">{reason.label}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{reason.description}</p>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedReason === reason.id ? 'border-black bg-black' : 'border-gray-300'
                                                        }`}>
                                                        {selectedReason === reason.id && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="mb-4">
                                            <button
                                                onClick={() => setStep('reason')}
                                                className="text-xs font-bold text-gray-500 hover:text-black hover:underline mb-2 block"
                                            >
                                                &larr; Back to reasons
                                            </button>
                                            <p className="font-bold text-lg mb-1">Berikan detail tambahan</p>
                                            <p className="text-sm text-gray-500">Bantu kami memahami masalah ini lebih lanjut (opsional).</p>
                                        </div>

                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Jelaskan lebih lanjut apa yang terjadi..."
                                            className="w-full h-40 p-4 border-3 border-black rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-neo-yellow/50 transition-all resize-none text-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Footer / Actions */}
                            <div className="p-5 border-t-3 border-black bg-gray-50 flex gap-3">
                                {step === 'reason' ? (
                                    <button
                                        disabled={!selectedReason}
                                        onClick={() => setStep('description')}
                                        className="w-full bg-black text-white px-6 py-3.5 rounded-xl font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                                    >
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        disabled={isSubmitting}
                                        onClick={handleSubmit}
                                        className="w-full bg-red-500 text-white px-6 py-3.5 rounded-xl border-b-4 border-black active:border-b-0 active:translate-y-1 font-black uppercase tracking-wider transition-all disabled:opacity-70 disabled:cursor-wait shadow-hard"
                                    >
                                        {isSubmitting ? "Mengirim Laporan..." : "Submit Report"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
