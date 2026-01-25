"use client"

import { useState } from "react"
import { Calendar, CheckCircle, Zap, MapPin, ChevronLeft, Info, Filter } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { MOCK_HALLS, TIME_SLOTS } from "@/constants"
import { Hall, Court } from "@/types"

export function BookingSection() {
    const [selectedHall, setSelectedHall] = useState<Hall | null>(null)
    const [selectedCourt, setSelectedCourt] = useState<number | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'success'>('idle')
    const [filterType, setFilterType] = useState<'All' | 'Rubber' | 'Wooden' | 'Synthetic'>('All')

    const filteredHalls = MOCK_HALLS.filter(hall =>
        filterType === 'All' ? true : hall.type === filterType
    )

    const handleBook = () => {
        if (!selectedHall || !selectedCourt || !selectedTime) return
        setBookingStatus('success')
        // Reset after animation
        setTimeout(() => {
            setBookingStatus('idle')
            setSelectedTime(null)
            setSelectedCourt(null)
            setSelectedHall(null)
        }, 4000)
    }

    if (bookingStatus === 'success') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in relative overflow-hidden">
                {/* Confetti Background Effect */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-pastel-pink rounded-full animate-ping"></div>
                    <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-pastel-mint rounded-full animate-ping delay-75"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-pastel-acid rounded-full animate-ping delay-150"></div>
                </div>

                <div className="w-32 h-32 bg-pastel-acid rounded-full border-4 border-black flex items-center justify-center mb-8 animate-bounce shadow-hard">
                    <CheckCircle className="w-16 h-16 text-black" />
                </div>
                <h2 className="text-6xl font-display font-black text-black mb-6 uppercase tracking-tighter">Secured!</h2>
                <div className="bg-white border-2 border-black p-6 rounded-2xl shadow-hard mb-8 max-w-md transform rotate-2">
                    <p className="text-xl text-black font-medium">
                        You're smashing at <span className="font-bold bg-pastel-mint px-2 border border-black rounded-md">{selectedHall?.name}</span> <br />
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest block mt-2">Court {selectedCourt}</span>
                        on <span className="font-bold">{selectedDate}</span> at <span className="font-bold">{selectedTime}</span>.
                    </p>
                </div>
                <button
                    onClick={() => setBookingStatus('idle')}
                    className="bg-black text-white px-10 py-4 rounded-xl font-bold border-2 border-transparent hover:bg-white hover:text-black hover:border-black shadow-hard hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
                >
                    Book Another Session
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-20">
            <div className="mb-16">
                <h2 className="text-5xl md:text-7xl font-display font-black text-black mb-4 uppercase tracking-tighter">
                    Pick Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pastel-lilac to-pastel-pink text-stroke-2" style={{ WebkitTextStroke: '2px black' }}>Battlefield</span>
                </h2>
                <p className="text-xl font-medium text-gray-600 border-l-4 border-black pl-4">
                    {selectedHall ? "Select your specific court." : "Choose a hall to begin."}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Hall & Court Selection */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Step 1: Hall Selection */}
                    {!selectedHall ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-3 mb-8">
                                <div className="flex items-center text-sm font-bold uppercase tracking-wider mr-2">
                                    <Filter className="w-4 h-4 mr-1" /> Filter:
                                </div>
                                {['All', 'Rubber', 'Wooden', 'Synthetic'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type as any)}
                                        className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-all
                                            ${filterType === type
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredHalls.map((hall) => (
                                    <div
                                        key={hall.id}
                                        onClick={() => setSelectedHall(hall)}
                                        className="group relative bg-white rounded-[2rem] border-2 border-black overflow-hidden cursor-pointer hover:shadow-hard transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                                    >
                                        <div className="h-48 relative border-b-2 border-black overflow-hidden">
                                            <img src={hall.image} alt={hall.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                {hall.type}
                                            </div>
                                            <div className="absolute bottom-4 right-4 bg-white border-2 border-black px-3 py-1 rounded-lg text-xs font-bold">
                                                {hall.totalCourts} Courts
                                            </div>
                                        </div>

                                        <div className="p-6 flex flex-col justify-between flex-grow bg-white group-hover:bg-gray-50 transition-colors">
                                            <div>
                                                <h3 className="text-2xl font-display font-black text-black uppercase leading-none mb-3">{hall.name}</h3>
                                                <p className="text-gray-600 text-sm font-medium leading-relaxed mb-4 line-clamp-2">{hall.description}</p>
                                            </div>

                                            <div className="flex justify-between items-end border-t-2 border-gray-100 pt-4 mt-auto">
                                                <div>
                                                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Rate</span>
                                                    <p className="text-xl font-black text-black">${hall.pricePerHour}<span className="text-xs font-medium text-gray-500">/hr</span></p>
                                                </div>
                                                <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-pastel-acid group-hover:text-black group-hover:border-2 group-hover:border-black transition-all">
                                                    <ChevronLeft className="w-4 h-4 rotate-180" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-[2.5rem] border-2 border-black p-8 relative overflow-hidden shadow-hard"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 border-b-2 border-gray-100 pb-6">
                                <button
                                    onClick={() => { setSelectedHall(null); setSelectedCourt(null); }}
                                    className="flex items-center space-x-2 text-gray-500 hover:text-black font-bold transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-black flex items-center justify-center">
                                        <ChevronLeft className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm uppercase tracking-wider">Back to Halls</span>
                                </button>
                                <div className="text-right">
                                    <h3 className="text-2xl font-display font-black text-black uppercase">{selectedHall.name}</h3>
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selectedHall.type} Floor</span>
                                </div>
                            </div>

                            {/* Court Grid */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center">
                                    <MapPin className="w-4 h-4 mr-2" /> Select Court Location
                                </h4>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Array.from({ length: selectedHall.totalCourts }).map((_, idx) => {
                                        const courtNum = idx + 1;
                                        const isSelected = selectedCourt === courtNum;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedCourt(courtNum)}
                                                className={`relative h-48 rounded-2xl border-2 transition-all duration-300 group flex flex-col justify-between p-4
                                                    ${isSelected
                                                        ? 'bg-black border-black text-white shadow-hard scale-[1.02]'
                                                        : 'bg-gray-50 border-gray-200 hover:border-black hover:bg-white text-black hover:shadow-hard-sm'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className={`text-4xl font-display font-black opacity-20 group-hover:opacity-40 transition-opacity ${isSelected ? 'text-white' : 'text-black'}`}>
                                                        {courtNum.toString().padStart(2, '0')}
                                                    </span>
                                                    {isSelected && <CheckCircle className="w-6 h-6 text-pastel-mint" />}
                                                </div>

                                                {/* Mini Court Visual */}
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-16 border border-current opacity-20 rounded-sm">
                                                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-current"></div>
                                                    <div className="absolute top-0 left-1/2 h-full w-[1px] bg-current"></div>
                                                </div>

                                                <div className="text-right">
                                                    <span className={`text-xs font-bold uppercase tracking-widest ${isSelected ? 'text-gray-400' : 'text-gray-400 group-hover:text-black'}`}>
                                                        Available
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Time & Summary */}
                <div className="lg:col-span-4">
                    <div className={`sticky top-24 bg-white rounded-[2rem] border-2 border-black shadow-hard p-6 lg:p-8 transition-all duration-500
                        ${!selectedHall ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>

                        <div className="flex items-center space-x-3 mb-8 border-b-2 border-black pb-4">
                            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl font-display">
                                {selectedCourt ? '3' : '2'}
                            </div>
                            <h3 className="text-2xl font-display font-bold text-black uppercase">
                                {selectedCourt ? "Lock It In" : "Details"}
                            </h3>
                        </div>

                        {selectedHall && (
                            <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-500 text-xs uppercase">Venue</span>
                                    <span className="font-black text-black">{selectedHall.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-500 text-xs uppercase">Court</span>
                                    <span className="font-black text-black">{selectedCourt ? `#${selectedCourt}` : '—'}</span>
                                </div>
                            </div>
                        )}

                        <div className={`transition-all duration-300 ${!selectedCourt ? 'opacity-50 pointer-events-none blur-[1px]' : 'opacity-100'}`}>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-black mb-3 uppercase tracking-wide">Select Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 text-black font-bold focus:ring-0 focus:border-black outline-none transition-colors"
                                    />
                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-bold text-black mb-3 uppercase tracking-wide">Available Slots</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {TIME_SLOTS.map((slot, idx) => (
                                        <button
                                            key={idx}
                                            disabled={!slot.available}
                                            onClick={() => setSelectedTime(slot.time)}
                                            className={`py-2 px-1 rounded-lg text-sm font-bold border-2 transition-all
                                             ${!slot.available ? 'bg-gray-100 border-transparent text-gray-300 cursor-not-allowed' :
                                                    selectedTime === slot.time
                                                        ? 'bg-pastel-acid border-black text-black shadow-hard-sm'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-black hover:text-black'
                                                }`}
                                        >
                                            {slot.time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="border-t-2 border-dashed border-gray-300 pt-6 space-y-3">
                            <div className="flex justify-between text-sm font-medium text-gray-500">
                                <span>Court Fee</span>
                                <span>${selectedHall ? selectedHall.pricePerHour : 0}.00</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium text-gray-500">
                                <span>Service Fee</span>
                                <span>$2.00</span>
                            </div>
                            <div className="flex justify-between text-2xl font-black text-black pt-2">
                                <span>TOTAL</span>
                                <span>${selectedHall ? selectedHall.pricePerHour + 2 : 0}.00</span>
                            </div>

                            <button
                                disabled={!selectedHall || !selectedCourt || !selectedTime}
                                onClick={handleBook}
                                className="w-full mt-6 bg-black text-white font-display font-black text-xl py-5 rounded-xl border-2 border-transparent hover:bg-pastel-acid hover:text-black hover:border-black shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                            >
                                CONFIRM BOOKING
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
