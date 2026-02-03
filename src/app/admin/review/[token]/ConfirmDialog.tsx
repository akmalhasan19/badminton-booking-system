"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react"

type ConfirmDialogProps = {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isProcessing?: boolean
    variant: 'approve' | 'reject'
    title: string
    ownerName: string
    venueName: string
    bulletPoints: string[]
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    isProcessing = false,
    variant,
    title,
    ownerName,
    venueName,
    bulletPoints
}: ConfirmDialogProps) {
    if (!isOpen) return null

    const isApprove = variant === 'approve'

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isProcessing ? onClose : undefined}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    >
                        <div className={`
                            w-full max-w-md bg-white rounded-2xl 
                            border-3 border-black shadow-hard-xl
                            overflow-hidden
                        `}>
                            {/* Header */}
                            <div className={`
                                px-6 py-5 border-b-3 border-black
                                ${isApprove ? 'bg-pastel-acid' : 'bg-red-300'}
                            `}>
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-12 h-12 rounded-xl border-2 border-black 
                                        flex items-center justify-center
                                        ${isApprove ? 'bg-white' : 'bg-white'}
                                    `}>
                                        {isApprove ? (
                                            <CheckCircle className="w-7 h-7 text-green-600" />
                                        ) : (
                                            <AlertTriangle className="w-7 h-7 text-red-600" />
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold text-black">
                                        {title}
                                    </h2>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5">
                                <p className="text-gray-700 mb-4">
                                    {isApprove ? 'Approve' : 'Reject'} application from{' '}
                                    <span className="font-bold text-black">&quot;{ownerName}&quot;</span> for{' '}
                                    <span className="font-bold text-black">&quot;{venueName}&quot;</span>?
                                </p>

                                <div className={`
                                    p-4 rounded-xl border-2 border-black
                                    ${isApprove ? 'bg-green-50' : 'bg-red-50'}
                                `}>
                                    <p className="text-sm font-bold uppercase text-gray-600 mb-2">
                                        This will:
                                    </p>
                                    <ul className="space-y-2">
                                        {bulletPoints.map((point, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                                <span className={`
                                                    mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                                                    ${isApprove ? 'bg-green-500' : 'bg-red-500'}
                                                `}>
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                </span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200 flex gap-3 justify-end">
                                <button
                                    onClick={onClose}
                                    disabled={isProcessing}
                                    className="px-5 py-2.5 rounded-xl font-bold text-gray-700 bg-white 
                                        border-2 border-gray-300 hover:border-black hover:bg-gray-100
                                        transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isProcessing}
                                    className={`
                                        px-6 py-2.5 rounded-xl font-bold text-black
                                        border-3 border-black shadow-hard-sm
                                        hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
                                        transition-all flex items-center gap-2
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        disabled:hover:shadow-hard-sm disabled:hover:translate-x-0 disabled:hover:translate-y-0
                                        ${isApprove ? 'bg-pastel-acid' : 'bg-red-400'}
                                    `}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            {isApprove ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                <XCircle className="w-5 h-5" />
                                            )}
                                            {isApprove ? 'Yes, Approve' : 'Yes, Reject'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
