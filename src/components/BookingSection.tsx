"use client"

import { useState, useMemo, useEffect } from "react"
import { Calendar, CheckCircle, Zap, MapPin, ChevronLeft, Info, Filter, Map, X, ChevronDown, Loader2, MapPinOff, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Hall, Court } from "@/types"
import { AuthModal } from "@/components/AuthModal"
import { fetchVenues, fetchVenueDetails, fetchAvailableSlots, createBooking } from "@/lib/api/actions"
import { SmashCourt, SmashAvailabilityResponse, SmashCourtAvailability } from "@/lib/smash-api"
import { getCurrentUser } from "@/lib/auth/actions"
import { useLoading } from "@/lib/loading-context"

export function BookingSection() {
    const [selectedHall, setSelectedHall] = useState<any | null>(null)
    const [selectedCourt, setSelectedCourt] = useState<any | null>(null) // Changed from number to Court object
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'))
    const [selectedTimes, setSelectedTimes] = useState<string[]>([])
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'success' | 'loading'>('idle')
    const [filterType, setFilterType] = useState<'All' | 'Rubber' | 'Wooden' | 'Synthetic'>('All')

    // Real data from API
    const [venues, setVenues] = useState<any[]>([]) // Venues (Halls) from API
    const [venueCourts, setVenueCourts] = useState<SmashCourt[]>([]) // Courts for selected venue
    const [availabilityData, setAvailabilityData] = useState<SmashAvailabilityResponse | null>(null)
    const [isLoadingVenues, setIsLoadingVenues] = useState(true)
    const [isLoadingVenueDetails, setIsLoadingVenueDetails] = useState(false)
    const [isLoadingSlots, setIsLoadingSlots] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)

    // Geolocation State
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unsupported' | 'idle'>('idle')

    // Location Filter State (Disabled for now - will implement later with location data in courts table)
    const [locationFilter, setLocationFilter] = useState<{
        city: string | null;
        district: string | null;
        subDistrict: string | null;
    }>({
        city: null,
        district: null,
        subDistrict: null
    });

    const [showLocationModal, setShowLocationModal] = useState(false);

    // Authentication State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    // Request geolocation permission on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!navigator.geolocation) {
            setLocationStatus('unsupported');
            return;
        }

        setLocationStatus('loading');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationStatus('granted');
            },
            (error) => {
                console.error("Geolocation error:", error);
                setLocationStatus('denied');
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes cache
            }
        );
    }, []);

    // Fetch user on mount
    useEffect(() => {
        async function checkAuth() {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setIsLoggedIn(true);
                setUser({ name: currentUser.name, email: currentUser.email });
            }
        }
        checkAuth();
    }, []);

    // Global loading hook
    const { startLoading, stopLoading } = useLoading();

    // Fetch venues on mount
    useEffect(() => {
        async function loadVenues() {
            setIsLoadingVenues(true);
            setApiError(null);
            startLoading("Memuat venue...");
            try {
                const venuesData = await fetchVenues();

                if (venuesData && venuesData.length > 0) {
                    // Filter out dummy/test venues
                    const validVenues = venuesData.filter((v: any) =>
                        !v.name.toLowerCase().includes('smash test arena') &&
                        !v.name.toLowerCase().includes('dummy')
                    );

                    // Fetch details for each venue to get court prices
                    const venuesWithPrices = await Promise.all(
                        validVenues.map(async (venue: any) => {
                            try {
                                const details = await fetchVenueDetails(venue.id);
                                // Get minimum hourly rate from courts
                                let minPrice = 0;
                                if (details?.courts && details.courts.length > 0) {
                                    minPrice = Math.min(...details.courts.map((c: any) => c.hourly_rate || 0));
                                }
                                return {
                                    id: venue.id,
                                    name: venue.name,
                                    type: 'Professional',
                                    pricePerHour: minPrice || 50000, // Use min price or fallback
                                    photo_url: venue.photo_url,
                                    totalCourts: venue.courts_count || details?.courts?.length || 0,
                                    description: venue.description || 'Professional Badminton Hall',
                                    location: {
                                        city: 'Jakarta',
                                        district: 'Jakarta Selatan',
                                        subDistrict: 'Tebet',
                                        address: venue.address
                                    },
                                    operating_hours_start: venue.operating_hours_start,
                                    operating_hours_end: venue.operating_hours_end,
                                };
                            } catch (err) {
                                // Fallback if details fetch fails
                                return {
                                    id: venue.id,
                                    name: venue.name,
                                    type: 'Professional',
                                    pricePerHour: 50000,
                                    photo_url: venue.photo_url,
                                    totalCourts: venue.courts_count || 0,
                                    description: venue.description || 'Professional Badminton Hall',
                                    location: {
                                        city: 'Jakarta',
                                        district: 'Jakarta Selatan',
                                        subDistrict: 'Tebet',
                                        address: venue.address
                                    },
                                    operating_hours_start: venue.operating_hours_start,
                                    operating_hours_end: venue.operating_hours_end,
                                };
                            }
                        })
                    );
                    setVenues(venuesWithPrices);
                } else {
                    setVenues([]);
                }
            } catch (error) {
                console.error("Failed to load venues:", error);
                setApiError('Failed to connect to PWA Smash');
            } finally {
                setIsLoadingVenues(false);
                stopLoading();
            }
        }
        loadVenues();
    }, [startLoading, stopLoading]);

    // Fetch venue details (with courts) when venue is selected
    useEffect(() => {
        async function loadVenueDetails() {
            if (!selectedHall) {
                setVenueCourts([]);
                return;
            }

            setIsLoadingVenueDetails(true);
            startLoading("Memuat detail lapangan...");
            try {
                const details = await fetchVenueDetails(selectedHall.id);
                if (details && details.courts) {
                    setVenueCourts(details.courts);
                    // Update price from first court if available
                    if (details.courts.length > 0) {
                        setSelectedHall((prev: any) => ({
                            ...prev,
                            pricePerHour: details.courts[0].hourly_rate || 50000
                        }));
                    }
                } else {
                    setVenueCourts([]);
                }
            } catch (error) {
                console.error("Failed to load venue details:", error);
            } finally {
                setIsLoadingVenueDetails(false);
                stopLoading();
            }
        }
        loadVenueDetails();
    }, [selectedHall?.id, startLoading, stopLoading]);

    // Fetch available slots when venue and date selected
    useEffect(() => {
        async function loadSlots() {
            if (selectedHall && selectedDate) {
                setIsLoadingSlots(true);
                const availability = await fetchAvailableSlots(selectedHall.id, selectedDate);
                setAvailabilityData(availability);
                setIsLoadingSlots(false);
            }
        }
        loadSlots();
    }, [selectedHall?.id, selectedDate]);

    // Location filtering disabled for MVP - courts table doesn't have location data yet
    const locationOptions = useMemo(() => {
        return {
            cities: [] as string[],
            districts: (_city: string) => [] as string[],
            subDistricts: (_district: string) => [] as string[]
        };
    }, []);

    const { exactMatches, nearbyMatches } = useMemo(() => {
        // For now, just show all venues in exactMatches
        // Type filtering disabled until we add 'type' column to venues table
        return { exactMatches: venues, nearbyMatches: [] };
    }, [venues]);



    // Check availability for specific court from real data
    const isSlotBooked = (time: string, courtId?: string) => {
        if (!availabilityData || !selectedCourt) return false;
        const courtAvailability = availabilityData.courts.find(
            (c: SmashCourtAvailability) => c.court_id === (courtId || selectedCourt.id)
        );
        if (!courtAvailability) return false;
        const slot = courtAvailability.slots.find((s) => s.time === time);
        return slot ? !slot.available : false;
    };

    // Get slots for selected court
    const getCourtSlots = () => {
        if (!availabilityData || !selectedCourt) return [];
        const courtAvailability = availabilityData.courts.find(
            (c: SmashCourtAvailability) => c.court_id === selectedCourt.id
        );
        return courtAvailability?.slots || [];
    };

    const toggleTime = (time: string) => {
        if (selectedTimes.includes(time)) {
            setSelectedTimes(prev => prev.filter(t => t !== time));
        } else {
            setSelectedTimes(prev => [...prev, time].sort());
        }
    };


    const handleBook = async () => {
        if (!selectedHall || !selectedCourt || selectedTimes.length === 0) return

        // Check authentication first
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        // Calculate duration and price
        const durationHours = selectedTimes.length;
        const pricePerHour = selectedHall.pricePerHour || 50;
        const totalPrice = durationHours * pricePerHour;

        // Calculate end time
        const startHour = parseInt(selectedTimes[0].split(':')[0]);
        const endHour = startHour + durationHours;
        const endTime = `${endHour.toString().padStart(2, '0')}:00`;

        setBookingStatus('loading');

        // Create booking
        const result = await createBooking({
            courtId: selectedHall.id,
            courtUuid: selectedCourt.id,
            bookingDate: selectedDate,
            startTime: selectedTimes[0],
            endTime: endTime,
            durationHours: durationHours,
        });

        if (result.error) {
            alert(`Booking failed: ${result.error}`);
            setBookingStatus('idle');
            return;
        }

        // Success!
        setBookingStatus('success');

        // Reset after animation
        setTimeout(() => {
            setBookingStatus('idle');
            setSelectedTimes([]);
            setSelectedCourt(null);
            setSelectedHall(null);
        }, 4000);
    }



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
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest block mt-2">{selectedCourt?.name || `Lapangan ${selectedCourt?.court_number}`}</span>
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
        <section className="relative w-full min-h-screen overflow-hidden pt-32 pb-20">
            {/* Grid Background */}
            <div
                className="absolute inset-0 z-0 h-full w-full pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(160, 82, 45, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 82, 45, 0.15) 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-4">
                <AnimatePresence>
                    {showLocationModal && <LocationModal />}
                    {showAuthModal && (
                        <AuthModal
                            isOpen={showAuthModal}
                            onClose={() => setShowAuthModal(false)}
                            onLoginSuccess={(userData) => {
                                setUser(userData);
                                setIsLoggedIn(true);
                                setBookingStatus('success');
                                setTimeout(() => {
                                    setBookingStatus('idle');
                                    setSelectedTimes([]);
                                    setSelectedCourt(null);
                                    setSelectedHall(null);
                                }, 4000);
                            }}
                        />
                    )}
                </AnimatePresence>

                <div className="mb-16">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* API Connection Status */}
                        {isLoadingVenues ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-black bg-yellow-100 text-yellow-700">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Connecting...
                            </span>
                        ) : apiError ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-400 bg-red-50 text-red-600">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {apiError}
                            </span>
                        ) : venues.length > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-black bg-pastel-mint text-black">
                                <Zap className="w-3 h-3 mr-1 fill-current" />
                                Connected to Smash Partner
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-300 bg-gray-100 text-gray-500">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No Venues Available
                            </span>
                        )}

                        {/* Location Status */}
                        {locationStatus === 'loading' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-300 bg-blue-50 text-blue-600">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Getting Location...
                            </span>
                        )}
                        {locationStatus === 'granted' && userLocation && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-300 bg-green-50 text-green-600">
                                <MapPin className="w-3 h-3 mr-1" />
                                Location Enabled
                            </span>
                        )}
                        {locationStatus === 'denied' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-orange-300 bg-orange-50 text-orange-600">
                                <MapPinOff className="w-3 h-3 mr-1" />
                                Location Denied
                            </span>
                        )}
                    </div>
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
                                {/* Location Bar - Disabled for MVP until courts have location data */}
                                {/* <div className="bg-white border-2 border-black rounded-xl p-4 mb-6 shadow-hard-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                            </div> */}

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
                                            {exactMatches.map((court: any) => (
                                                <div
                                                    key={court.id}
                                                    onClick={() => setSelectedHall(court)}
                                                    className="group relative bg-white rounded-[2rem] border-2 border-black overflow-hidden cursor-pointer hover:shadow-hard transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                                                >
                                                    <div className="h-48 relative border-b-2 border-black overflow-hidden">
                                                        <img
                                                            src={court.photo_url || '/placeholder-court.jpg'}
                                                            alt={court.name}
                                                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                        />
                                                        <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                            Court
                                                        </div>
                                                        <div className="absolute bottom-4 right-4 bg-white border-2 border-black px-3 py-1 rounded-lg text-xs font-bold">
                                                            Available
                                                        </div>
                                                    </div>

                                                    <div className="p-6 flex flex-col justify-between flex-grow bg-white group-hover:bg-gray-50 transition-colors">
                                                        <div>
                                                            <div className="flex items-start justify-between mb-2">
                                                                <h3 className="text-2xl font-display font-black text-black uppercase leading-none">{court.name}</h3>
                                                            </div>
                                                            <p className="text-gray-600 text-sm font-medium leading-relaxed mb-4 line-clamp-2">{court.description || 'High-quality badminton court'}</p>
                                                        </div>

                                                        <div className="flex justify-between items-end border-t-2 border-gray-100 pt-4 mt-auto">
                                                            <div>
                                                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Rate</span>
                                                                <p className="text-xl font-black text-black">RP {court.pricePerHour?.toLocaleString()}/HR</p>
                                                            </div>
                                                            <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-pastel-acid group-hover:text-black group-hover:border-2 group-hover:border-black transition-all">
                                                                <ChevronLeft className="w-4 h-4 rotate-180" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
                                        {isLoadingVenueDetails ? (
                                            <div className="col-span-full flex justify-center py-8">
                                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                            </div>
                                        ) : venueCourts.length === 0 ? (
                                            <div className="col-span-full text-center py-8 text-gray-500">
                                                No courts available for this venue
                                            </div>
                                        ) : venueCourts.map((court, idx) => {
                                            const isSelected = selectedCourt?.id === court.id;
                                            const displayName = court.name || `Court ${idx + 1}`;

                                            return (
                                                <button
                                                    key={court.id}
                                                    onClick={() => setSelectedCourt(court)}
                                                    className={`relative h-48 rounded-2xl border-2 transition-all duration-300 group flex flex-col justify-between p-4
                                                    ${isSelected
                                                            ? 'bg-black border-black text-white shadow-hard scale-[1.02]'
                                                            : 'bg-gray-50 border-gray-200 hover:border-black hover:bg-white text-black hover:shadow-hard-sm'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className={`text-4xl font-display font-black opacity-20 group-hover:opacity-40 transition-opacity ${isSelected ? 'text-white' : 'text-black'}`}>
                                                            {displayName.replace('LAPANGAN', '').trim() || String(court.court_number)}
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
                                                            Rp {court.hourly_rate?.toLocaleString()}/hr
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
                                                <span className="font-black text-black">{selectedCourt ? (selectedCourt.name || `Lapangan ${selectedCourt.court_number}`) : '—'}</span>
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
                                                {isLoadingSlots ? (
                                                    <div className="col-span-3 flex justify-center py-4">
                                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                                    </div>
                                                ) : getCourtSlots().length === 0 ? (
                                                    <div className="col-span-3 text-center py-4 text-gray-500 text-sm">
                                                        Tidak ada slot tersedia
                                                    </div>
                                                ) : getCourtSlots().map((slot, idx) => {
                                                    const booked = !slot.available;
                                                    const isSelected = selectedTimes.includes(slot.time);
                                                    return (
                                                        <button
                                                            key={idx}
                                                            disabled={booked}
                                                            onClick={() => toggleTime(slot.time)}
                                                            title={booked ? 'Slot ini sudah dibooking' : 'Klik untuk memilih'}
                                                            className={`py-2 px-1 rounded-lg text-sm font-bold border-2 transition-all relative
                                                                ${booked ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed' :
                                                                    isSelected
                                                                        ? 'bg-pastel-acid border-black text-black shadow-hard-sm'
                                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-black hover:text-black'
                                                                }`}
                                                        >
                                                            <span className={booked ? 'line-through' : ''}>{slot.time}</span>
                                                            {booked && <span className="block text-[10px] font-bold uppercase">Booked</span>}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t-2 border-dashed border-gray-300 pt-6 space-y-3">
                                        <div className="flex justify-between text-sm font-medium text-gray-500">
                                            <span>Court Fee ({selectedTimes.length}hr)</span>
                                            <span>Rp {selectedHall ? (selectedHall.pricePerHour * selectedTimes.length).toLocaleString('id-ID') : 0}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium text-gray-500">
                                            <span>Service Fee</span>
                                            <span>Rp 2.000</span>
                                        </div>
                                        <div className="flex justify-between text-2xl font-black text-black pt-2">
                                            <span>TOTAL</span>
                                            <span>Rp {selectedHall ? ((selectedHall.pricePerHour * selectedTimes.length) + 2000).toLocaleString('id-ID') : 0}</span>
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
        </section>
    )
}
