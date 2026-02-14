"use client"

import { Calendar, ShoppingBag, Sparkles } from "lucide-react"
import { Tab } from "@/types"
import { ENABLE_MATCH_SHOP, ENABLE_SMASHY_AI } from "@/lib/feature-flags"

interface BentoGridProps {
    setActiveTab: (tab: Tab) => void;
}

export function BentoGrid({ setActiveTab }: BentoGridProps) {
    return (
        <section className="relative py-20 px-4 max-w-7xl mx-auto overflow-hidden">
            {/* 3D Grid Background */}
            <div
                className="absolute -top-40 -left-[20%] -right-[20%] -bottom-20 z-0 pointer-events-none"
                style={{
                    backgroundImage: `
                        repeating-linear-gradient(
                            115deg,
                            transparent,
                            transparent 100px,
                            rgba(160, 82, 45, 0.15) 100px,
                            rgba(160, 82, 45, 0.15) 101px
                        ),
                        repeating-linear-gradient(
                            to bottom,
                            transparent,
                            transparent 100px,
                            rgba(160, 82, 45, 0.15) 100px,
                            rgba(160, 82, 45, 0.15) 101px
                        )
                    `,
                    backgroundSize: '100% 100%',
                    transform: 'none'
                }}
            />

            <h2 className="relative z-10 text-4xl md:text-5xl font-display font-bold text-center mb-16">
                MORE THAN JUST <span className="bg-pastel-acid px-2 border-2 border-black shadow-hard-sm transform -rotate-2 inline-block">BADMINTON</span>
            </h2>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 grid-rows-2 h-auto md:h-[600px]">

                {/* Card 1: Instant Booking - Large */}
                <div className="md:col-span-2 row-span-2 bg-pastel-mint rounded-3xl border-2 border-black shadow-hard p-6 md:p-8 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="relative z-10 flex flex-col items-start h-full">
                        <div className="flex flex-row items-start gap-3 md:gap-6 w-full">
                            <div className="bg-white w-10 h-10 md:w-14 md:h-14 rounded-xl border-2 border-black flex items-center justify-center shadow-hard-sm shrink-0">
                                <Calendar className="w-5 h-5 md:w-8 md:h-8 text-black" />
                            </div>
                            <div className="flex flex-col items-start w-full relative z-20">
                                <h3 className="text-2xl md:text-4xl font-display font-bold mb-2">Instant Courts</h3>
                                <p className="text-sm md:text-lg font-medium max-w-[200px] md:max-w-sm mb-4 md:mb-6">Skip the phone calls. Real-time availability for rubber, wooden, and synthetic courts.</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveTab(Tab.BOOK)} className="block mt-4 md:mt-6 bg-black text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-bold text-xs md:text-base hover:bg-gray-800 transition-colors">Book Now</button>
                    </div>
                    <img src="https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=2070&auto=format&fit=crop" className="absolute right-0 bottom-0 w-[55%] h-[40%] sm:w-2/3 sm:h-2/3 object-cover rounded-tl-[3rem] border-t-2 border-l-2 border-black grayscale group-hover:grayscale-0 transition-all duration-500" alt="Court" />
                </div>

                {/* Card 2: Feature Spotlight */}
                <div className="bg-pastel-lilac rounded-3xl border-2 border-black shadow-hard p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-white w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 border-black flex items-center justify-center shadow-hard-sm">
                                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-black" />
                            </div>
                            <span className="bg-black text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded">
                                {ENABLE_SMASHY_AI ? "BETA" : "SOON"}
                            </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-display font-bold">
                            {ENABLE_SMASHY_AI ? "Meet Smashy" : "Training Insights"}
                        </h3>
                    </div>
                    <p className="font-medium text-xs md:text-sm">
                        {ENABLE_SMASHY_AI
                            ? "Your cheeky AI concierge for gear tips & trash talk."
                            : "Smart play recommendations will be available in a future release."}
                    </p>
                </div>

                {/* Card 3: Community/Shop */}
                <div className="bg-pastel-yellow rounded-3xl border-2 border-black shadow-hard p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                    <div>
                        <div className="bg-white w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 border-black flex items-center justify-center shadow-hard-sm mb-4">
                            <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-black" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-display font-bold">Pro Shop</h3>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                            ))}
                        </div>
                        {ENABLE_MATCH_SHOP ? (
                            <button
                                onClick={() => setActiveTab(Tab.SHOP)}
                                className="font-bold text-xs md:text-sm underline cursor-pointer"
                            >
                                Browse
                            </button>
                        ) : (
                            <span className="font-bold text-xs md:text-sm text-gray-600">Soon</span>
                        )}
                    </div>
                </div>

            </div>
        </section>
    )
}
