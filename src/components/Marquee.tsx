"use client"

export function Marquee() {
    return (
        <div className="relative flex overflow-x-hidden bg-dark text-white py-3 border-y-2 border-black rotate-[-1deg] scale-105 z-10 mb-12">
            {/* 3D Grid Background - Removed based on user feedback */}
            <div className="relative z-10 animate-marquee whitespace-nowrap flex space-x-8 font-display font-bold text-lg uppercase tracking-wider">
                <span>SMASH & SERVE</span>
                <span className="text-pastel-acid">★</span>
                <span>BOOK YOUR COURT</span>
                <span className="text-pastel-acid">★</span>
                <span>LEVEL UP YOUR GAME</span>
                <span className="text-pastel-acid">★</span>
                <span>PREMIUM GEAR</span>
                <span className="text-pastel-acid">★</span>
                <span>SMASH & SERVE</span>
                <span className="text-pastel-acid">★</span>
                <span>BOOK YOUR COURT</span>
                <span className="text-pastel-acid">★</span>
                <span>LEVEL UP YOUR GAME</span>
                <span className="text-pastel-acid">★</span>
                <span>PREMIUM GEAR</span>
                <span className="text-pastel-acid">★</span>
            </div>
            <div className="absolute top-0 z-10 animate-marquee2 whitespace-nowrap flex space-x-8 font-display font-bold text-lg uppercase tracking-wider">
                <span>SMASH & SERVE</span>
                <span className="text-pastel-acid">★</span>
                <span>BOOK YOUR COURT</span>
                <span className="text-pastel-acid">★</span>
                <span>LEVEL UP YOUR GAME</span>
                <span className="text-pastel-acid">★</span>
                <span>PREMIUM GEAR</span>
                <span className="text-pastel-acid">★</span>
                <span>SMASH & SERVE</span>
                <span className="text-pastel-acid">★</span>
                <span>BOOK YOUR COURT</span>
                <span className="text-pastel-acid">★</span>
                <span>LEVEL UP YOUR GAME</span>
                <span className="text-pastel-acid">★</span>
                <span>PREMIUM GEAR</span>
                <span className="text-pastel-acid">★</span>
            </div>
        </div>
    )
}
