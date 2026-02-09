"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Filter, User, Star, Trophy, Calendar, Clock, ChevronRight } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { CoachDetailModal, type Coach } from "./CoachDetailModal"

export function CoachSection() {
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "")
    const [cityFilter, setCityFilter] = useState(searchParams.get('city') || "")
    const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null)

    // Mock Data for Coaches
    const coaches = [
        {
            id: 1,
            name: "Coach Budi Santoso",
            title: "Ex-National Player",
            location: "Jakarta Selatan",
            rating: 4.9,
            reviews: 128,
            price: 150000,
            image: "https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=1000&auto=format&fit=crop",
            specialization: "Doubles Strategy",
            level: "Advanced",
            about: "Former national team player with over 10 years of competitive experience. Specializes in advanced doubles tactics, rotation, and high-pressure game psychology. Has coached multiple regional champions.",
            experience: "15 Years",
            achievements: ["National Doubles Champion 2015", "Certified BWF Level 2 Coach", "Head Coach at PB Jaya"]
        },
        {
            id: 2,
            name: "Siti Rahmawati",
            title: "Certified BWF Level 1",
            location: "Bandung",
            rating: 4.8,
            reviews: 85,
            price: 100000,
            image: "https://images.unsplash.com/photo-1626244422523-26330452377d?q=80&w=1000&auto=format&fit=crop",
            specialization: "Basics & Footwork",
            level: "Beginner",
            about: "Patient and detailed-oriented coach perfect for beginners and children. Focuses on building a strong foundation with correct footwork and stroke mechanics to prevent injury and ensure long-term progress.",
            experience: "5 Years",
            achievements: ["West Java Provincial Silver Medalist", "Best Youth Coach Award 2023"]
        },
        {
            id: 3,
            name: "Rizky Firmansyah",
            title: "Club Pro Coach",
            location: "Surabaya",
            rating: 4.7,
            reviews: 56,
            price: 125000,
            image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop",
            specialization: "Smash Power",
            level: "Intermediate",
            about: "Known for his explosive playstyle, Rizky teaches players how to generate maximum power in their smashes and clears. Also covers physical conditioning specifically for badminton power.",
            experience: "8 Years",
            achievements: ["Surabaya Open Winner 2019", "Physical Trainer Certificate"]
        }
    ]

    const filteredCoaches = coaches.filter(coach => {
        const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coach.location.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    return (
        <div className="w-full">
            {/* Hero / Filter Section */}
            <div className="mb-8 space-y-6">
                <div className="bg-pastel-lilac/10 border-2 border-black rounded-2xl p-6">
                    <h2 className="text-3xl font-display font-black uppercase mb-4">Find Your Mentor</h2>

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-black rounded-lg flex items-center justify-center pointer-events-none">
                                <Search className="w-4 h-4 text-black" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search coach by name or location..."
                                className="w-full h-12 pl-16 pr-4 font-bold text-sm bg-white border-2 border-black rounded-xl focus:translate-x-1 focus:translate-y-1 focus:shadow-none shadow-hard transition-all outline-none"
                            />
                        </div>

                        {/* Date Picker (Mock) */}
                        <div className="md:w-48 relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-black rounded-lg flex items-center justify-center pointer-events-none">
                                <Calendar className="w-4 h-4 text-black" />
                            </div>
                            <input
                                type="date"
                                className="w-full h-12 pl-16 pr-4 font-bold text-sm bg-white border-2 border-black rounded-xl focus:translate-x-1 focus:translate-y-1 focus:shadow-none shadow-hard transition-all outline-none"
                            />
                        </div>

                        {/* Filter Button */}
                        <button className="h-12 w-12 bg-white border-2 border-black rounded-xl shadow-hard flex items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group shrink-0">
                            <Filter className="w-5 h-5 text-black" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Coach List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCoaches.map((coach) => (
                    <motion.div
                        key={coach.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedCoach(coach)}
                        className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-hard hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all group cursor-pointer"
                    >
                        {/* Coach Image & Badge */}
                        <div className="h-48 bg-gray-200 relative overflow-hidden border-b-2 border-black">
                            <img
                                src={coach.image}
                                alt={coach.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 right-3 bg-white border-2 border-black px-2 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 text-pastel-yellow fill-pastel-yellow" />
                                {coach.rating}
                            </div>
                            <div className="absolute bottom-3 left-3 bg-pastel-mint border-2 border-black px-3 py-1 rounded-lg text-xs font-black uppercase shadow-sm">
                                {coach.level}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-xl font-display font-black uppercase leading-none mb-1">{coach.name}</h3>
                                    <p className="text-xs font-bold text-gray-500">{coach.title}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4">
                                <MapPin className="w-4 h-4" />
                                {coach.location}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="bg-gray-100 border border-black px-2 py-1 rounded-md text-[10px] font-bold uppercase">
                                    {coach.specialization}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-gray-200">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Starts from</span>
                                    <span className="text-lg font-black block">IDR {coach.price / 1000}k <span className="text-xs text-gray-500 font-medium">/hr</span></span>
                                </div>
                                <button className="bg-black text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 hover:bg-gray-800 transition-colors">
                                    Book <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredCoaches.length === 0 && (
                <div className="text-center py-20 bg-gray-50 border-2 border-black border-dashed rounded-2xl">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-gray-400 uppercase">No Coaches Found</h3>
                    <p className="text-gray-400 font-medium">Try adjusting your search filters.</p>
                </div>
            )}


            <CoachDetailModal
                isOpen={!!selectedCoach}
                onClose={() => setSelectedCoach(null)}
                coach={selectedCoach}
            />
        </div >
    )
}
