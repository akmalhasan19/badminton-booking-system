"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, X } from "lucide-react"
import { useEffect } from "react"

export type ToastType = 'success' | 'error'

interface ToastProps {
    message: string
    type?: ToastType
    isVisible: boolean
    onClose: () => void
    duration?: number
}

export function Toast({
    message,
    type = 'success',
    isVisible,
    onClose,
    duration = 4000
}: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [isVisible, duration, onClose])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-hard border-2 border-black"
                    style={{
                        backgroundColor: type === 'success' ? '#E6FFFA' : '#FFF5F5', // Light green or light red
                    }}
                >
                    <div className={`
                        w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shrink-0
                        ${type === 'success' ? 'bg-green-400' : 'bg-red-400'}
                    `}>
                        {type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                            <XCircle className="w-5 h-5 text-white" />
                        )}
                    </div>

                    <div className="flex flex-col mr-4">
                        <span className="font-bold text-sm text-black">
                            {type === 'success' ? 'Berhasil!' : 'Gagal!'}
                        </span>
                        <span className="text-xs font-medium text-gray-600">
                            {message}
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
