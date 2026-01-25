"use client"

import { ArrowRight, Zap } from "lucide-react"
import { Tab } from "@/types"

interface HeroProps {
    setActiveTab: (tab: Tab) => void;
}

export function Hero({ setActiveTab }: HeroProps) {
    return (
        <section className="relative w-full overflow-hidden pt-32 pb-20">
            {/* Grid Background */}
            <div
                className="absolute inset-0 z-0 w-full h-[130%] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(160, 82, 45, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 82, 45, 0.15) 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}
            />

            <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                    {/* Text Content */}
                    <div className="lg:col-span-7 space-y-8 z-10">
                        <div className="inline-block bg-pastel-acid border-2 border-black px-4 py-2 rounded-full shadow-hard-sm transform -rotate-2">
                            <span className="font-bold text-sm tracking-widest uppercase">The Future of Badminton</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-display font-black leading-[0.9] text-dark tracking-tighter">
                            SERVE <span className="text-stroke-2 text-transparent bg-clip-text bg-gradient-to-r from-pastel-lilac to-pastel-mint" style={{ WebkitTextStroke: '2px #121212' }}>LOOKS.</span> <br />
                            SMASH <span className="bg-pastel-pink px-2 italic transform inline-block -rotate-1 border-2 border-black shadow-hard-sm rounded-lg">HARD.</span>
                        </h1>

                        <p className="text-xl text-gray-700 font-medium max-w-lg leading-relaxed border-l-4 border-pastel-acid pl-6">
                            A next-gen court booking experience. Curated for the modern player who cares about aesthetics as much as athletics.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 pt-4">
                            <button
                                onClick={() => setActiveTab(Tab.BOOK)}
                                className="group relative px-8 py-4 bg-dark text-white font-bold text-xl rounded-xl border-2 border-black shadow-hard hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
                            >
                                <span className="flex items-center">
                                    Book Now <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab(Tab.SHOP)}
                                className="px-8 py-4 bg-white text-dark font-bold text-xl rounded-xl border-2 border-black shadow-hard hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
                            >
                                Shop Gear
                            </button>
                        </div>
                    </div>

                    {/* Hero Visual */}
                    <div className="lg:col-span-5 relative h-[500px] lg:h-[600px] flex items-center justify-center">
                        {/* Abstract Shapes */}
                        <div className="absolute top-10 right-10 w-48 h-48 bg-pastel-mint rounded-full border-2 border-black mix-blend-multiply animate-float opacity-80"></div>
                        <div className="absolute bottom-10 left-10 w-64 h-64 bg-pastel-lilac rounded-full border-2 border-black mix-blend-multiply animate-float opacity-80" style={{ animationDelay: '1s' }}></div>

                        {/* Main Image Card */}
                        <div className="relative z-10 w-full max-w-md aspect-[4/5] bg-white rounded-3xl border-2 border-black shadow-hard-lg overflow-hidden transform rotate-3 hover:rotate-0 transition-all duration-500">
                            <img
                                src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop"
                                alt="Badminton Style"
                                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                            />
                            <div className="absolute top-4 left-4 bg-pastel-acid border-2 border-black px-3 py-1 rounded-md shadow-hard-sm">
                                <span className="font-bold text-xs uppercase">New Season</span>
                            </div>
                            {/* Sticker */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-pastel-pink rounded-full border-2 border-black flex items-center justify-center animate-spin-slow">
                                <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                                    <path id="curve" d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0" fill="transparent" />
                                    <text className="text-[14px] font-bold uppercase tracking-widest">
                                        <textPath href="#curve">
                                            Smash • Serve • Repeat •
                                        </textPath>
                                    </text>
                                </svg>
                                <Zap className="absolute w-8 h-8 fill-black" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
