"use client"

import { useState } from "react"
import { Calendar, CheckCircle, Zap } from "lucide-react"
import { MOCK_COURTS, TIME_SLOTS } from "@/constants"
import { Court } from "@/types"

export function BookingSection() {
    const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'success'>('idle')

    const handleBook = () => {
        if (!selectedCourt || !selectedTime) return
        setBookingStatus('success')
        // Reset after animation
        setTimeout(() => {
            setBookingStatus('idle')
            setSelectedTime(null)
            setSelectedCourt(null)
        }, 4000)
    }

    if (bookingStatus === 'success') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in relative overflow-hidden">
                {/* Confetti Background Effect (Simulated with simple dots) */}
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
                        You're smashing at <span className="font-bold bg-pastel-mint px-2 border border-black rounded-md">{selectedCourt?.name}</span> <br />
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
        <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="mb-16">
                <h2 className="text-5xl md:text-7xl font-display font-black text-black mb-4 uppercase tracking-tighter">
                    Pick Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pastel-lilac to-pastel-pink text-stroke-2" style={{ WebkitTextStroke: '2px black' }}>Battlefield</span>
                </h2>
                <p className="text-xl font-medium text-gray-600 border-l-4 border-black pl-4">No membership fees. Just pay and play.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Step 1: Select Court */}
                <div className="lg:col-span-8 space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {MOCK_COURTS.map((court) => (
                            <div
                                key={court.id}
                                onClick={() => setSelectedCourt(court)}
                                className={`group relative h-80 rounded-[2rem] cursor-pointer transition-all duration-300 border-2 
                  ${selectedCourt?.id === court.id
                                        ? 'border-black transform -translate-y-2 shadow-hard bg-pastel-acid'
                                        : 'border-black hover:-translate-y-1 hover:shadow-hard bg-white'}`}
                            >
                                {/* Image Section */}
                                <div className="h-48 w-full overflow-hidden rounded-t-[1.9rem] border-b-2 border-black relative">
                                    <img src={court.image} alt={court.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    <div className="absolute top-4 right-4 bg-white border-2 border-black px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                        {court.type}
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className="p-5 flex justify-between items-end">
                                    <div>
                                        <h4 className="font-display font-black text-2xl text-black uppercase">{court.name}</h4>
                                        <div className="flex items-center text-sm font-bold text-gray-500 mt-2">
                                            <Zap className="w-4 h-4 mr-1 text-black" />
                                            Fast Surface
                                        </div>
                                    </div>
                                    <div className={`text-xl font-black px-4 py-2 rounded-lg border-2 border-black 
                    ${selectedCourt?.id === court.id ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                        ${court.pricePerHour}
                                    </div>
                                </div>

                                {selectedCourt?.id === court.id && (
                                    <div className="absolute -top-3 -left-3 bg-pastel-pink text-black border-2 border-black p-2 rounded-full shadow-hard-sm z-10">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 2: Select Time & Confirm */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 bg-white rounded-[2rem] border-2 border-black shadow-hard p-6 lg:p-8">
                        <div className="flex items-center space-x-3 mb-8 border-b-2 border-black pb-4">
                            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl font-display">2</div>
                            <h3 className="text-2xl font-display font-bold text-black uppercase">Lock It In</h3>
                        </div>

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

                        <div className="border-t-2 border-dashed border-gray-300 pt-6 space-y-3">
                            <div className="flex justify-between text-sm font-medium text-gray-500">
                                <span>Court Fee</span>
                                <span>${selectedCourt ? selectedCourt.pricePerHour : 0}.00</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium text-gray-500">
                                <span>Service Fee</span>
                                <span>$2.00</span>
                            </div>
                            <div className="flex justify-between text-2xl font-black text-black pt-2">
                                <span>TOTAL</span>
                                <span>${selectedCourt ? selectedCourt.pricePerHour + 2 : 0}.00</span>
                            </div>

                            <button
                                disabled={!selectedCourt || !selectedTime}
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
