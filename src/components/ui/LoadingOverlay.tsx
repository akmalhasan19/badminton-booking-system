"use client"

import { motion, AnimatePresence } from "framer-motion"

interface LoadingOverlayProps {
    isVisible: boolean
    message?: string
}

export function LoadingOverlay({ isVisible, message = "Memuat..." }: LoadingOverlayProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md"
                >
                    {/* Spinner Container */}
                    <div className="relative">
                        {/* Outer Ring */}
                        <motion.div
                            className="w-16 h-16 rounded-full border-4 border-gray-200"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        />

                        {/* Spinning Arc */}
                        <motion.div
                            className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-black border-r-black"
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />

                        {/* Inner Dot */}
                        <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        />
                    </div>

                    {/* Loading Message */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="mt-6 text-sm font-bold uppercase tracking-widest text-gray-600"
                    >
                        {message}
                    </motion.p>

                    {/* Subtle Progress Bar */}
                    <motion.div
                        className="mt-4 h-1 w-24 bg-gray-200 rounded-full overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <motion.div
                            className="h-full bg-black rounded-full"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
