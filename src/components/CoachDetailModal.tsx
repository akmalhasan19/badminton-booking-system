"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, MapPin, Star, Trophy, Calendar, Clock, ChevronRight, User, Award, CheckCircle2 } from "lucide-react"

export interface Coach {
    id: number
    name: string
    title: string
    location: string
    rating: number
    reviews: number
    price: number
    image: string
    specialization: string
    level: string
    about?: string
    experience?: string
    achievements?: string[]
}

interface CoachDetailModalProps {
    isOpen: boolean
    onClose: () => void
    coach: Coach | null
}

export function CoachDetailModal({ isOpen, onClose, coach }: CoachDetailModalProps) {
    if (!isOpen || !coach) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full md:max-w-2xl bg-white rounded-3xl overflow-hidden border-4 border-black shadow-2xl max-h-[75vh] md:max-h-[90vh] flex flex-col"
                >
                    {/* Header Image Area */}
                    <div className="relative h-40 md:h-64 bg-gray-200 shrink-0">
                        <img
                            src={coach.image}
                            alt={coach.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/40 transition-all border border-white/30 text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="absolute bottom-4 left-6 text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-pastel-mint text-black text-xs font-black uppercase px-2 py-1 rounded-md border border-black shadow-sm">
                                    {coach.level}
                                </span>
                                <span className="bg-pastel-yellow text-black text-xs font-black uppercase px-2 py-1 rounded-md border border-black shadow-sm flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-black" />
                                    {coach.rating} ({coach.reviews} reviews)
                                </span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-display font-black uppercase leading-none mb-1 shadow-black drop-shadow-lg">
                                {coach.name}
                            </h2>
                            <p className="text-white/90 font-bold text-sm md:text-base flex items-center gap-2">
                                {coach.title} • {coach.location}
                            </p>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                        {/* About Section */}
                        <div>
                            <h3 className="text-xl font-display font-black uppercase mb-3 flex items-center gap-2">
                                <User className="w-5 h-5" /> About Coach
                            </h3>
                            <p className="text-gray-600 leading-relaxed font-medium">
                                {coach.about || "Passionate badminton coach dedicated to helping players of all levels improve their game. Focuses on technique, strategy, and physical conditioning."}
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Experience</p>
                                <p className="text-lg font-black">{coach.experience || "5+ Years"}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Specialty</p>
                                <p className="text-lg font-black">{coach.specialization}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Session Type</p>
                                <p className="text-lg font-black">1-on-1 / Group</p>
                            </div>
                        </div>

                        {/* Achievements */}
                        {coach.achievements && coach.achievements.length > 0 && (
                            <div>
                                <h3 className="text-xl font-display font-black uppercase mb-3 flex items-center gap-2">
                                    <Trophy className="w-5 h-5" /> Achievements
                                </h3>
                                <div className="space-y-2">
                                    {coach.achievements.map((achievement, index) => (
                                        <div key={index} className="flex items-start gap-3 bg-pastel-lilac/10 p-3 rounded-xl border border-black/10">
                                            <Award className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                                            <span className="font-bold text-sm text-gray-800">{achievement}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Availability Preview (Mock) */}
                        <div>
                            <h3 className="text-xl font-display font-black uppercase mb-3 flex items-center gap-2">
                                <Calendar className="w-5 h-5" /> Availability
                            </h3>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {['Mon', 'Wed', 'Fri', 'Sat', 'Sun'].map((day) => (
                                    <div key={day} className="min-w-[80px] bg-white border-2 border-black rounded-lg p-2 text-center shadow-hard-sm hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
                                        <span className="text-xs font-bold text-gray-400 uppercase block mb-1">{day}</span>
                                        <span className="font-black text-sm block">16:00</span>
                                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1 rounded-sm mt-1 inline-block">Open</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer / CTA in Modal */}
                    <div className="p-6 border-t-2 border-gray-100 bg-gray-50 shrink-0">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase block">Total Price</span>
                                <span className="text-2xl font-black block">IDR {coach.price / 1000}k <span className="text-sm text-gray-500 font-medium">/ session</span></span>
                            </div>
                            <button className="flex-1 bg-black text-white px-6 py-4 rounded-xl font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-hard active:translate-y-1 active:shadow-none border-2 border-black">
                                Book Session <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
