"use client"

import { Calendar, ShoppingBag, Sparkles } from "lucide-react"
import { Tab } from "@/types"

interface BentoGridProps {
    setActiveTab: (tab: Tab) => void;
}

export function BentoGrid({ setActiveTab }: BentoGridProps) {
    return (
        <section className="py-20 px-4 max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-16">
                MORE THAN JUST <span className="bg-pastel-acid px-2 border-2 border-black shadow-hard-sm transform -rotate-2 inline-block">BADMINTON</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 grid-rows-2 h-auto md:h-[600px]">

                {/* Card 1: Instant Booking - Large */}
                <div className="md:col-span-2 row-span-2 bg-pastel-mint rounded-3xl border-2 border-black shadow-hard p-8 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="relative z-10">
                        <div className="bg-white w-14 h-14 rounded-xl border-2 border-black flex items-center justify-center mb-6 shadow-hard-sm">
                            <Calendar className="w-8 h-8 text-black" />
                        </div>
                        <h3 className="text-4xl font-display font-bold mb-4">Instant Courts</h3>
                        <p className="text-lg font-medium max-w-sm">Skip the phone calls. Real-time availability for rubber, wooden, and synthetic courts.</p>
                        <button onClick={() => setActiveTab(Tab.BOOK)} className="mt-8 bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">Book Now</button>
                    </div>
                    <img src="https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=2070&auto=format&fit=crop" className="absolute right-0 bottom-0 w-2/3 h-2/3 object-cover rounded-tl-[3rem] border-t-2 border-l-2 border-black grayscale group-hover:grayscale-0 transition-all duration-500" alt="Court" />
                </div>

                {/* Card 2: AI Coach */}
                <div className="bg-pastel-lilac rounded-3xl border-2 border-black shadow-hard p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-white w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center shadow-hard-sm">
                                <Sparkles className="w-5 h-5 text-black" />
                            </div>
                            <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded">BETA</span>
                        </div>
                        <h3 className="text-2xl font-display font-bold">Meet Smashy</h3>
                    </div>
                    <p className="font-medium text-sm">Your cheeky AI concierge for gear tips & trash talk.</p>
                </div>

                {/* Card 3: Community/Shop */}
                <div className="bg-pastel-yellow rounded-3xl border-2 border-black shadow-hard p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                    <div>
                        <div className="bg-white w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center shadow-hard-sm mb-4">
                            <ShoppingBag className="w-5 h-5 text-black" />
                        </div>
                        <h3 className="text-2xl font-display font-bold">Pro Shop</h3>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                            ))}
                        </div>
                        <span className="font-bold text-sm underline cursor-pointer" onClick={() => setActiveTab(Tab.SHOP)}>Browse</span>
                    </div>
                </div>

            </div>
        </section>
    )
}
