"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function Preloader({ onComplete }: { onComplete?: () => void }) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                const step = Math.random() * 10
                const newProgress = Math.min(prev + step, 100)
                if (newProgress === 100) {
                    clearInterval(timer)
                    setTimeout(() => onComplete?.(), 500)
                }
                return newProgress
            })
        }, 100)

        return () => clearInterval(timer)
    }, [onComplete])

    return (
        <motion.div
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-neo-bg border-b-4 border-black"
        >
            <div className="relative w-full max-w-md px-8">
                {/* Text Glitch Effect Container */}
                <div className="relative mb-8 text-center">
                    <motion.h1
                        className="text-6xl md:text-8xl font-black font-display tracking-tighter uppercase text-black"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        Smash
                    </motion.h1>
                    <motion.div
                        className="absolute -top-1 -left-1 w-full h-full text-6xl md:text-8xl font-black font-display tracking-tighter uppercase text-neo-pink opacity-50 mix-blend-multiply z-[-1]"
                        animate={{
                            x: [-2, 2, -1, 0],
                            y: [1, -1, 0]
                        }}
                        transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }}
                    >
                        Smash
                    </motion.div>
                    <motion.div
                        className="absolute -bottom-1 -right-1 w-full h-full text-6xl md:text-8xl font-black font-display tracking-tighter uppercase text-neo-green opacity-50 mix-blend-multiply z-[-1]"
                        animate={{
                            x: [2, -2, 1, 0],
                            y: [-1, 1, 0]
                        }}
                        transition={{ duration: 0.3, repeat: Infinity, repeatType: "mirror" }}
                    >
                        Smash
                    </motion.div>
                </div>

                {/* Neo-Brutalist Progress Bar */}
                <div className="relative h-12 w-full border-4 border-black bg-white shadow-hard">
                    <motion.div
                        className="h-full bg-neo-yellow border-r-4 border-black"
                        style={{ width: `${progress}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-bold font-mono text-xl">{Math.round(progress)}%</span>
                    </div>
                </div>

                {/* Loading Status Text */}
                <motion.div
                    className="mt-4 flex justify-between font-mono font-bold text-sm uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <span>System Check</span>
                    <span className="animate-pulse">Loading Assets...</span>
                </motion.div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-8 left-8 w-16 h-16 border-4 border-black bg-neo-pink shadow-hard animate-spin-slow" />
            <div className="absolute bottom-8 right-8 w-20 h-20 rounded-full border-4 border-black bg-neo-blue shadow-hard-lg" />
            <div className="absolute top-1/2 right-12 w-8 h-8 bg-black rotate-45" />
            <div className="absolute bottom-32 left-12 w-12 h-12 border-4 border-black rounded-full bg-neo-green" />

        </motion.div>
    )
}
