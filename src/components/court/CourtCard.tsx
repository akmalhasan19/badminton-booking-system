
"use client"

import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"

interface CourtCardProps {
    court: any; // Using any for now to match BookingSection usage, can be typed strictly later
    isSelected: boolean;
    onSelect: (court: any) => void;
    t: any; // Translation object
}

export function CourtCard({ court, isSelected, onSelect, t }: CourtCardProps) {
    const displayName = court.name || `Court ${court.court_number}`;

    // Determine court type label
    const getCourtTypeLabel = () => {
        const lowerName = court.name.toLowerCase();
        if (lowerName.includes('karpet')) return t.court_type_vinyl;
        if (lowerName.includes('parkit')) return t.court_type_wood;
        if (lowerName.includes('beton')) return t.court_type_cement;
        return t.court_type_standard;
    };

    return (
        <motion.button
            onClick={() => onSelect(court)}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
                opacity: 1,
                scale: isSelected ? 1.02 : 1,
                borderColor: isSelected ? "#000000" : "#e5e7eb"
            }}
            whileHover={{
                scale: isSelected ? 1.02 : 1.02,
                y: -4,
                boxShadow: "0px 10px 20px rgba(0,0,0,0.1)"
            }}
            whileTap={{ scale: 0.98 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
            }}
            className={`
                relative w-full text-left rounded-2xl border-2 transition-colors duration-300 group flex flex-col overflow-hidden h-full
                ${isSelected
                    ? 'bg-black text-white shadow-hard z-10'
                    : 'bg-white text-black hover:border-black'
                }
            `}
        >
            {/* Image Area */}
            <div className="w-full h-40 bg-gray-100 relative overflow-hidden border-b-2 border-inherit">
                {court.photo_url ? (
                    <motion.img
                        src={court.photo_url}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    // Fallback Visual with Blueprint Grid
                    <div className="w-full h-full flex items-center justify-center relative opacity-20 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:8px_8px]">
                        <div className="w-20 h-12 border-2 border-current rounded-sm relative opacity-50">
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-current"></div>
                            <div className="absolute top-0 left-1/2 h-full w-[1px] bg-current"></div>
                        </div>
                    </div>
                )}

                {/* Blueprint Overlay Effect (Visible on Hover) */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-multiply">
                    <div className="w-full h-full" style={{
                        backgroundImage: `linear-gradient(to right, ${isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px), linear-gradient(to bottom, ${isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                    }}></div>
                </div>

                {/* Number Overlay */}
                <div className="absolute bottom-3 left-3 bg-white border-2 border-black rounded-lg px-3 py-1 shadow-sm z-10">
                    <span className="text-xl font-display font-black text-black">
                        {displayName.replace(/lapangan/i, '').trim() || String(court.court_number)}
                    </span>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-3 right-3 bg-pastel-mint text-black rounded-full p-1 shadow-md border-2 border-black"
                    >
                        <CheckCircle className="w-4 h-4" />
                    </motion.div>
                )}
            </div>

            {/* Content Area */}
            <div className={`p-4 flex flex-col justify-between flex-grow w-full relative`}>
                {/* Decorative Pattern for Selected Card */}
                {isSelected && (
                    <div className="absolute top-0 right-0 w-16 h-16 opacity-10 pointer-events-none overflow-hidden">
                        <div className="absolute transform rotate-45 bg-white w-20 h-2 top-0 -right-4"></div>
                        <div className="absolute transform rotate-45 bg-white w-20 h-2 top-4 -right-4"></div>
                    </div>
                )}

                <div className="mb-2">
                    <span className={`text-xs font-bold block uppercase tracking-wide opacity-70 mb-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                        {getCourtTypeLabel()}
                    </span>
                    <h4 className={`text-lg font-display font-black leading-tight ${isSelected ? 'text-white' : 'text-black'}`}>
                        {displayName}
                    </h4>
                </div>

                <div className="text-right mt-2 pt-2 border-t border-dashed border-gray-300/30">
                    <span className={`text-xs font-bold uppercase tracking-widest block mb-0.5 ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>
                        Rate/Hour
                    </span>
                    <span className={`text-lg font-black ${isSelected ? 'text-pastel-acid' : 'text-black'}`}>
                        Rp {court.hourly_rate?.toLocaleString()}
                    </span>
                </div>
            </div>
        </motion.button>
    )
}
