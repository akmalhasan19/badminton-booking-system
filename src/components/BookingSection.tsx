"use client"

import { useState, useMemo } from "react"
import { Calendar, CheckCircle, Zap, MapPin, ChevronLeft, Info, Filter, Map, X, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { MOCK_HALLS, TIME_SLOTS, MOCK_BOOKINGS } from "@/constants"
import { Hall, Court } from "@/types"

export function BookingSection() {
    const [selectedHall, setSelectedHall] = useState<Hall | null>(null)
    const [selectedCourt, setSelectedCourt] = useState<number | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [selectedTimes, setSelectedTimes] = useState<string[]>([])
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'success'>('idle')
    const [filterType, setFilterType] = useState<'All' | 'Rubber' | 'Wooden' | 'Synthetic'>('All')

    // Location Filter State
    const [locationFilter, setLocationFilter] = useState<{
        city: string | null;
        district: string | null;
        subDistrict: string | null;
    }>({
        city: 'Jakarta Timur',
        district: 'Pulo Gadung',
        subDistrict: 'Rawamangun'
    });

    const [showLocationModal, setShowLocationModal] = useState(false);

    // Authentication State (simulated for MVP)
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    // Derived Location Options from MOCK_HALLS
    const locationOptions = useMemo(() => {
        const cities = Array.from(new Set(MOCK_HALLS.map(h => h.location.city)));
        const districts = (city: string) => Array.from(new Set(MOCK_HALLS.filter(h => h.location.city === city).map(h => h.location.district)));
        const subDistricts = (district: string) => Array.from(new Set(MOCK_HALLS.filter(h => h.location.district === district).map(h => h.location.subDistrict)));
        return { cities, districts, subDistricts };
    }, []);

    const { exactMatches, nearbyMatches } = useMemo(() => {
        const typeFiltered = MOCK_HALLS.filter(hall => filterType === 'All' ? true : hall.type === filterType);

        if (!locationFilter.subDistrict) {
            // If no sub-district selected, just return all matching higher level filters as "exact" (conceptually)
            // But based on req, let's just use standard filter logic if not specific enough
            const broadMatches = typeFiltered.filter(hall => {
                if (locationFilter.district) return hall.location.district === locationFilter.district;
                if (locationFilter.city) return hall.location.city === locationFilter.city;
                return true;
            });
            return { exactMatches: broadMatches, nearbyMatches: [] };
        }

        // Specific Split Logic when Sub-District is selected
        const exact = typeFiltered.filter(hall =>
            hall.location.subDistrict === locationFilter.subDistrict &&
            hall.location.district === locationFilter.district && // Safety check
            hall.location.city === locationFilter.city // Safety check
        );

        const nearby = typeFiltered.filter(hall =>
            hall.location.district === locationFilter.district &&
            hall.location.subDistrict !== locationFilter.subDistrict
        );

        return { exactMatches: exact, nearbyMatches: nearby };

    }, [filterType, locationFilter]);



    // Check availability for specific court
    const isSlotBooked = (time: string) => {
        if (!selectedHall || !selectedCourt) return false;
        const courtKey = `${selectedHall.id}-${selectedCourt}`;
        const existingBookings = MOCK_BOOKINGS[courtKey] || [];
        return existingBookings.includes(time);
    };

    const toggleTime = (time: string) => {
        if (selectedTimes.includes(time)) {
            setSelectedTimes(prev => prev.filter(t => t !== time));
        } else {
            setSelectedTimes(prev => [...prev, time].sort());
        }
    };


    const handleBook = () => {
        if (!selectedHall || !selectedCourt || selectedTimes.length === 0) return

        // Check authentication first
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        // Proceed with booking
        setBookingStatus('success')
        // Reset after animation
        setTimeout(() => {
            setBookingStatus('idle')
            setBookingStatus('idle')
            setSelectedTimes([])
            setSelectedCourt(null)
            setSelectedHall(null)
        }, 4000)
    }

    // Simulated Google Auth
    const handleGoogleAuth = () => {
        // In production, this would trigger actual Google OAuth
        setTimeout(() => {
            setUser({
                name: 'John Doe',
                email: 'john.doe@example.com'
            });
            setIsLoggedIn(true);
            setShowAuthModal(false);

            // Auto-proceed with booking after successful auth
            setTimeout(() => {
                handleBook();
            }, 300);
        }, 1000); // Simulate API delay
    }

    // Auth Modal Component
    const AuthModal = () => {
        const [isLoading, setIsLoading] = useState(false);

        const handleAuth = () => {
            setIsLoading(true);
            handleGoogleAuth();
        };

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md"
                onClick={() => !isLoading && setShowAuthModal(false)}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-[2rem] p-8 md:p-12 w-full max-w-md shadow-2xl border-2 border-black relative"
                >
                    {!isLoading && (
                        <button
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-black" />
                        </button>
                    )}

                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-pastel-acid rounded-full border-2 border-black flex items-center justify-center shadow-hard mx-auto mb-6">
                            <Zap className="w-10 h-10 text-black" />
                        </div>
                        <h3 className="text-3xl font-display font-black text-black uppercase mb-2">Almost There!</h3>
                        <p className="text-gray-600 font-medium">Sign in to complete your booking</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleAuth}
                            disabled={isLoading}
                            className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 font-bold text-black hover:bg-black hover:text-white transition-all shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-4 text-gray-500 font-bold uppercase tracking-widest text-xs">Or</span>
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl px-6 py-4 font-bold text-gray-600 hover:border-black hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue with Email
                        </button>
                    </div>

                    <p className="text-center text-xs text-gray-500 mt-6">
                        By continuing, you agree to our <span className="font-bold underline cursor-pointer">Terms</span> and <span className="font-bold underline cursor-pointer">Privacy Policy</span>
                    </p>
                </motion.div>
            </motion.div>
        );
    };

    // Modal Component Logic
    const LocationModal = () => {
        const [tempCity, setTempCity] = useState(locationFilter.city);
        const [tempDistrict, setTempDistrict] = useState(locationFilter.district);
        const [tempSubDistrict, setTempSubDistrict] = useState(locationFilter.subDistrict);

        const handleApply = () => {
            setLocationFilter({
                city: tempCity,
                district: tempDistrict,
                subDistrict: tempSubDistrict
            });
            setShowLocationModal(false);
        };

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
            >
                <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border-2 border-black relative">
                    <button
                        onClick={() => setShowLocationModal(false)}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-black" />
                    </button>

                    <h3 className="text-2xl font-display font-black text-black uppercase mb-6">Change Location</h3>

                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">City (Kota)</label>
                            <div className="relative">
                                <select
                                    value={tempCity || ''}
                                    onChange={(e) => {
                                        setTempCity(e.target.value);
                                        setTempDistrict(null);
                                        setTempSubDistrict(null);
                                    }}
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-black font-bold appearance-none outline-none focus:border-black transition-colors"
                                >
                                    <option value="" disabled>Select City</option>
                                    {locationOptions.cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">District (Kecamatan)</label>
                            <div className="relative">
                                <select
                                    value={tempDistrict || ''}
                                    disabled={!tempCity}
                                    onChange={(e) => {
                                        setTempDistrict(e.target.value);
                                        setTempSubDistrict(null);
                                    }}
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-black font-bold appearance-none outline-none focus:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="" disabled>Select District</option>
                                    {tempCity && locationOptions.districts(tempCity).map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Sub-District (Kelurahan)</label>
                            <div className="relative">
                                <select
                                    value={tempSubDistrict || ''}
                                    disabled={!tempDistrict}
                                    onChange={(e) => setTempSubDistrict(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-black font-bold appearance-none outline-none focus:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="" disabled>Select Sub-District</option>
                                    {tempDistrict && locationOptions.subDistricts(tempDistrict).map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleApply}
                        disabled={!tempCity}
                        className="w-full bg-black text-white font-display font-black text-xl py-4 rounded-xl border-2 border-transparent hover:bg-pastel-acid hover:text-black hover:border-black shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Apply Filter
                    </button>
                </div>
            </motion.div>
        );
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
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest block mt-2">Court {selectedCourt}</span>
                        on <span className="font-bold">{selectedDate}</span> at <span className="font-bold">{selectedTimes.join(', ')}</span>.
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
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-20 relative">
            <AnimatePresence>
                {showLocationModal && <LocationModal />}
                {showAuthModal && <AuthModal />}
            </AnimatePresence>

            <div className="mb-16">
                <h2 className="text-5xl md:text-7xl font-display font-black text-black mb-4 uppercase tracking-tighter">
                    Pick Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pastel-lilac to-pastel-pink text-stroke-2" style={{ WebkitTextStroke: '2px black' }}>Battlefield</span>
                </h2>
                <p className="text-xl font-medium text-gray-600 border-l-4 border-black pl-4">
                    {selectedHall ? "Select your specific court." : "Find the perfect venue near you."}
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
                            {/* Location Bar */}
                            <div className="bg-white border-2 border-black rounded-xl p-4 mb-6 shadow-hard-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
                                        <MapPin className="w-3 h-3 mr-1" /> Current Location Scope
                                    </div>
                                    <div className="font-display font-bold text-lg text-black flex flex-wrap items-center gap-2">
                                        <span>{locationFilter.city || 'All Cities'}</span>
                                        {locationFilter.district && <span className="text-gray-400">/</span>}
                                        <span>{locationFilter.district}</span>
                                        {locationFilter.subDistrict && <span className="text-gray-400">/</span>}
                                        <span className="bg-pastel-acid px-2 rounded-md border border-black">{locationFilter.subDistrict || 'All'}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowLocationModal(true)}
                                    className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-pastel-acid hover:text-black border-2 border-transparent hover:border-black rounded-lg transition-all shadow-hard-sm"
                                >
                                    Change Location
                                </button>
                            </div>

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

                            {/* Exact Matches */}
                            {exactMatches.length > 0 || nearbyMatches.length > 0 ? (
                                <div className="space-y-12">

                                    {/* Primary Results */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {exactMatches.map((hall) => (
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
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h3 className="text-2xl font-display font-black text-black uppercase leading-none">{hall.name}</h3>
                                                        </div>
                                                        <div className="flex items-center text-xs font-bold text-gray-500 mb-3 bg-gray-100 px-2 py-1 rounded w-fit">
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {hall.location.subDistrict}, {hall.location.district}
                                                        </div>
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

                                    {/* Nearby Results (Split View) */}
                                    {nearbyMatches.length > 0 && (
                                        <div className="relative">
                                            <div className="flex items-center space-x-4 mb-6">
                                                <div className="h-[2px] bg-gray-200 flex-grow"></div>
                                                <span className="bg-gray-100 px-4 py-1 rounded-full text-xs font-bold uppercase text-gray-500 tracking-widest">
                                                    More in {locationFilter.district}
                                                </span>
                                                <div className="h-[2px] bg-gray-200 flex-grow"></div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                                                {nearbyMatches.map((hall) => (
                                                    <div
                                                        key={hall.id}
                                                        onClick={() => setSelectedHall(hall)}
                                                        className="group relative bg-white rounded-[2rem] border-2 border-gray-200 hover:border-black overflow-hidden cursor-pointer hover:shadow-hard transition-all duration-300 hover:-translate-y-1 flex flex-col h-full grayscale-[50%] hover:grayscale-0"
                                                    >
                                                        {/* Simplified Nearby Card */}
                                                        <div className="h-40 relative border-b-2 border-gray-200 group-hover:border-black overflow-hidden">
                                                            <img src={hall.image} alt={hall.name} className="w-full h-full object-cover transition-all duration-500" />
                                                        </div>
                                                        <div className="p-6 flex flex-col justify-between flex-grow">
                                                            <div>
                                                                <h3 className="text-xl font-display font-black text-black uppercase leading-none mb-2">{hall.name}</h3>
                                                                <div className="flex items-center text-xs font-bold text-gray-500 mb-2">
                                                                    <MapPin className="w-3 h-3 mr-1" /> In {hall.location.subDistrict}
                                                                </div>
                                                            </div>
                                                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                                                <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">{hall.type}</span>
                                                                <span className="font-black">${hall.pricePerHour}/hr</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="col-span-1 md:col-span-2 py-12 text-center border-2 border-dashed border-gray-300 rounded-[2rem]">
                                    <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-display font-black text-gray-400 uppercase">No venues found here</h3>
                                    <p className="text-gray-500 font-medium mt-2">Try changing your location filter.</p>
                                </div>
                            )}

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

                            {/* Details Venue */}
                            <div className="mb-8 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Location</span>
                                    <p className="font-bold text-black">{selectedHall.location.address}</p>
                                    <p className="text-xs text-gray-500">{selectedHall.location.subDistrict}, {selectedHall.location.city}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Facilities</span>
                                    <p className="font-bold text-black">{selectedHall.totalCourts} Courts</p>
                                    <p className="text-xs text-gray-500">Shower, Parking, Cafe</p>
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
                    <div className="sticky top-24">
                        {!selectedHall ? (
                            // Empty State
                            <div className="bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-300 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                                <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center mb-6 shadow-sm">
                                    <MapPin className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-display font-black text-gray-400 uppercase mb-2">No Venue Selected</h3>
                                <p className="text-gray-500 font-medium text-sm max-w-[200px]">
                                    Click on a venue card to view details and available slots.
                                </p>
                            </div>
                        ) : (
                            // Active State
                            <div className="bg-white rounded-[2rem] border-2 border-black shadow-hard p-6 lg:p-8 animate-fade-in-up">
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
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <span className="block font-bold text-gray-500 text-xs uppercase mb-1">Address</span>
                                            <p className="text-xs text-gray-700">{selectedHall.location.address}</p>
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
                                            {TIME_SLOTS.map((slot, idx) => {
                                                const booked = !slot.available || isSlotBooked(slot.time);
                                                const isSelected = selectedTimes.includes(slot.time);
                                                return (
                                                    <button
                                                        key={idx}
                                                        disabled={booked}
                                                        onClick={() => toggleTime(slot.time)}
                                                        className={`py-2 px-1 rounded-lg text-sm font-bold border-2 transition-all
                                                                ${booked ? 'bg-gray-100 border-transparent text-gray-300 cursor-not-allowed hidden' :
                                                                isSelected
                                                                    ? 'bg-pastel-acid border-black text-black shadow-hard-sm'
                                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-black hover:text-black'
                                                            }`}
                                                    >
                                                        {slot.time}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t-2 border-dashed border-gray-300 pt-6 space-y-3">
                                    <div className="flex justify-between text-sm font-medium text-gray-500">
                                        <span>Court Fee ({selectedTimes.length}hr)</span>
                                        <span>${selectedHall ? selectedHall.pricePerHour * selectedTimes.length : 0}.00</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-gray-500">
                                        <span>Service Fee</span>
                                        <span>$2.00</span>
                                    </div>
                                    <div className="flex justify-between text-2xl font-black text-black pt-2">
                                        <span>TOTAL</span>
                                        <span>${selectedHall ? (selectedHall.pricePerHour * selectedTimes.length) + 2 : 0}.00</span>
                                    </div>

                                    <button
                                        disabled={!selectedHall || !selectedCourt || selectedTimes.length === 0}
                                        onClick={handleBook}
                                        className="w-full mt-6 bg-black text-white font-display font-black text-xl py-5 rounded-xl border-2 border-transparent hover:bg-pastel-acid hover:text-black hover:border-black shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                                    >
                                        CONFIRM BOOKING
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>

    )
}
