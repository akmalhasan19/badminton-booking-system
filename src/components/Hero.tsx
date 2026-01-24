"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/Button"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import Link from "next/link"

export function Hero() {
    const containerRef = useRef(null)
    const titleRef = useRef(null)
    const subtitleRef = useRef(null)
    const ctaRef = useRef(null)

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

        tl.from(titleRef.current, {
            y: 100,
            opacity: 0,
            duration: 1.2,
            delay: 0.2,
        })
            .from(subtitleRef.current, {
                y: 50,
                opacity: 0,
                duration: 1,
            }, "-=0.8")
            .from(ctaRef.current, {
                y: 30,
                opacity: 0,
                duration: 0.8,
            }, "-=0.6")

    }, { scope: containerRef })

    return (
        <section ref={containerRef} className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-white text-center px-6">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white opacity-80" />

            <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                <h1 ref={titleRef} className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight text-primary leading-tight">
                    Dedikasi untuk <br />
                    <span className="italic text-slate-800">Performa Terbaik.</span>
                </h1>

                <p ref={subtitleRef} className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
                    Lapangan bulu tangkis standar internasional dengan fasilitas premium.
                    Dirancang untuk kenyamanan dan fokus maksimal Anda dalam bertanding.
                </p>

                <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link href="/booking">
                        <Button size="lg" className="h-14 px-8 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                            Reservasi Jadwal
                        </Button>
                    </Link>
                    <Link href="#explore">
                        <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-full border-gray-200 hover:border-gray-900 transition-all duration-300">
                            Jelajahi Fasilitas
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Subtle Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-400">
                <span className="text-xs tracking-widest uppercase opacity-60">Scroll</span>
            </div>
        </section>
    )
}
