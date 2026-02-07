"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar, CheckCircle, Zap, MapPin, ChevronLeft, Info, Filter, Map as MapIcon, X, ChevronDown, Loader2, MapPinOff, AlertCircle, Car, Wifi, Utensils, Wind, Droplets, Accessibility, Star } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Hall, Court } from "@/types"
import { AuthModal } from "@/components/AuthModal"
import { PhoneVerificationModal } from "@/components/PhoneVerificationModal"
import { fetchVenues, fetchVenueDetails, fetchVenueCourts, fetchAvailableSlots, createBooking, fetchPublicCourts } from "@/lib/api/actions"
import { SmashCourt, SmashAvailabilityResponse, SmashCourtAvailability } from "@/lib/smash-api"
import { getCurrentUser } from "@/lib/auth/actions"
import { useLoading } from "@/lib/loading-context"
import { useLanguage } from "@/lib/i18n/LanguageContext"

// Calculate distance between two coordinates using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

const FacilityIcon = ({ name }: { name: string }) => {
    const [imgError, setImgError] = useState(false);

    const getIconDetails = (text: string) => {
        const lower = text.toLowerCase();

        let filename = 'default.svg';
        let FallbackIcon = CheckCircle;

        if (lower.includes('parkir') || lower.includes('parking')) {
            filename = 'parking.svg';
            FallbackIcon = Car;
        } else if (lower.includes('wifi') || lower.includes('internet')) {
            filename = 'wifi.svg';
            FallbackIcon = Wifi;
        } else if (lower.includes('makan') || lower.includes('kantin') || lower.includes('cafe') || lower.includes('food')) {
            filename = 'cutlery.svg';
            FallbackIcon = Utensils;
        } else if (lower.includes('ac') || lower.includes('air con') || lower.includes('pendingin')) {
            filename = 'air-conditioner.svg';
            FallbackIcon = Wind;
        } else if (lower.includes('shower') || lower.includes('mandi')) {
            filename = 'shower.svg';
            FallbackIcon = Droplets;
        } else if (lower.includes('toilet') || lower.includes('wc')) {
            filename = 'toilet.svg';
            FallbackIcon = Accessibility; // or create a Toilet icon import if available in newer lucide, using generic for now
        } else if (lower.includes('musholla') || lower.includes('prayer')) {
            filename = 'prayer.svg';
            FallbackIcon = Star;
        } else if (lower.includes('cctv')) {
            filename = 'cctv.svg';
            FallbackIcon = CheckCircle;
        } else if (lower.includes('loker') || lower.includes('locker')) {
            filename = 'locker.svg';
            FallbackIcon = CheckCircle;
        }

        return { filename, FallbackIcon };
    };

    const { filename, FallbackIcon } = getIconDetails(name);

    return (
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-1 rounded-lg shadow-sm">
            {!imgError ? (
                <img
                    src={`/icons/facilities/${filename}`}
                    alt={name}
                    className="w-3 h-3 object-contain"
                    onError={() => setImgError(true)}
                />
            ) : (
                <FallbackIcon className="w-3 h-3 text-gray-700" />
            )}
            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">{name}</span>
        </div>
    );
};

export function BookingSection() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useLanguage()

    // State is initialized but will be controlled by URL for selection
    const [selectedHall, setSelectedHall] = useState<any | null>(null)
    const [selectedCourt, setSelectedCourt] = useState<any | null>(null) // Changed from number to Court object
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'))
    const [selectedTimes, setSelectedTimes] = useState<string[]>([])
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'success' | 'loading' | 'redirecting'>('idle')
    const [filterType, setFilterType] = useState<'All' | 'Rubber' | 'Wooden' | 'Synthetic'>('All')

    // Search Query State
    const [searchQuery, setSearchQuery] = useState("")

    // Real data from API
    const [venues, setVenues] = useState<any[]>([]) // Venues (Halls) from API
    const [allCourts, setAllCourts] = useState<any[]>([]) // All public courts for filtering
    const [courtTypes, setCourtTypes] = useState<string[]>(['All']) // Derived court types
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
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [user, setUser] = useState<{ name: string; email: string; phone?: string } | null>(null);
    const [isAddressExpanded, setIsAddressExpanded] = useState(false);

    // Sync state with URL params (search, date, venueId)
    useEffect(() => {
        const venueId = searchParams.get('venueId')
        const dateParam = searchParams.get('date')
        const qParam = searchParams.get('q')

        if (dateParam) {
            setSelectedDate(dateParam)
        }

        if (qParam) {
            setSearchQuery(qParam)
        }

        if (venueId && venues.length > 0) {
            // Only update if not already selected or different
            if (selectedHall?.id !== venueId) {
                const venue = venues.find(v => v.id === venueId)
                if (venue) {
                    setSelectedHall(venue)
                    setIsAddressExpanded(false)
                }
            }
        } else if (!venueId && selectedHall) {
            // If ID removed from URL, clear selection
            setSelectedHall(null)
            setSelectedCourt(null)
        }
    }, [searchParams, venues, selectedHall])

    const handleSelectVenue = (venue: any) => {
        // Update URL to trigger the effect above
        const params = new URLSearchParams(searchParams.toString())
        params.set('venueId', venue.id)
        router.push(`/?${params.toString()}`, { scroll: false })
    }

    const handleClearVenue = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('venueId')
        router.push(`/?${params.toString()}`, { scroll: false })
    }

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
                setUser({
                    name: currentUser.name,
                    email: currentUser.email,
                    phone: currentUser.phone
                });
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
            // startLoading("Memuat venue...");
            try {
                // Fetch public courts which contains venue info + specific court details (type, etc)
                // Extract unique venues from courts data
                // We map by venue_id to deduplicate
                const uniqueVenuesMap = new Map();
                const types = new Set<string>(['All']);

                // If public courts endpoint is just courts, we construct venues from it. 
                // However, fetchVenues() returned a clean list of venues.
                // It might be safer to call BOTH: 
                // 1. fetchVenues() for the main list (reliable venue data)
                // 2. fetchPublicCourts() just to derive the filters and mapping.

                const [venuesData, publicCourtsData] = await Promise.all([
                    fetchVenues(),
                    fetchPublicCourts()
                ]);

                setVenues(venuesData || []);
                setAllCourts(publicCourtsData || []);

                // Extract types from publicCourtsData
                const dynamicTypes = new Set<string>(['All']);
                publicCourtsData.forEach((court: any) => {
                    // Normalize type: Capitalize first letter?
                    if (court.type) {
                        dynamicTypes.add(court.type);
                    }
                });
                setCourtTypes(Array.from(dynamicTypes));

                if (venuesData && venuesData.length > 0) {
                    // Fetch details for each venue to get court prices
                    const venuesWithPrices = await Promise.all(
                        venuesData.map(async (venue: any) => {
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
                                    // Use actual coordinates and city from API
                                    latitude: venue.latitude,
                                    longitude: venue.longitude,
                                    location: {
                                        city: venue.city || 'Unknown',
                                        district: '',
                                        subDistrict: '',
                                        address: venue.address
                                    },
                                    operating_hours_start: venue.operating_hours_start,
                                    operating_hours_end: venue.operating_hours_end,
                                    facilities: venue.facilities || [],
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
                                    // Use actual coordinates and city from API
                                    latitude: venue.latitude,
                                    longitude: venue.longitude,
                                    location: {
                                        city: venue.city || 'Unknown',
                                        district: '',
                                        subDistrict: '',
                                        address: venue.address
                                    },
                                    operating_hours_start: venue.operating_hours_start,
                                    operating_hours_end: venue.operating_hours_end,
                                    facilities: venue.facilities || [],
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
                // stopLoading();
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
                // Use fetchVenueCourts to get courts with court_type field
                const courts = await fetchVenueCourts(selectedHall.id);
                if (courts && courts.length > 0) {
                    // Sort courts by court_number to ensure Court 1 comes first
                    const sortedCourts = [...courts].sort((a, b) => a.court_number - b.court_number);
                    setVenueCourts(sortedCourts);

                    // Update price from first court if available
                    setSelectedHall((prev: any) => ({
                        ...prev,
                        pricePerHour: sortedCourts[0].hourly_rate || 50000
                    }));
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

    const { exactMatches, nearbyMatches, tooFarVenues } = useMemo(() => {
        // Distance thresholds in km
        const NEARBY_RADIUS_KM = 50;  // Venues within 50km are considered nearby
        const MAX_RADIUS_KM = 150;    // Venues beyond 150km are too far

        // Filter by Search Query first
        let filteredVenues = venues;
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filteredVenues = filteredVenues.filter(venue =>
                venue.name.toLowerCase().includes(lowerQuery) ||
                venue.location?.city?.toLowerCase().includes(lowerQuery) ||
                (venue.location?.address && venue.location.address.toLowerCase().includes(lowerQuery))
            );
        }

        // Filter by Court Type
        if (filterType !== 'All') {
            // Find venues that have at least one court of the selected type
            // We use 'allCourts' which describes { venue_id, type }
            const validVenueIds = new Set(
                allCourts
                    .filter(court => court.type === filterType)
                    .map(court => court.venue_id)
            );

            filteredVenues = filteredVenues.filter(venue => validVenueIds.has(venue.id));
        }

        // If user location is not available or searching, show all filtered venues
        if (!userLocation || locationStatus !== 'granted') {
            return {
                exactMatches: filteredVenues,
                nearbyMatches: [],
                tooFarVenues: []
            };
        }

        const nearby: any[] = [];
        const tooFar: any[] = [];

        filteredVenues.forEach(venue => {
            // If venue doesn't have coordinates, include it in nearby (benefit of doubt)
            if (!venue.latitude || !venue.longitude) {
                nearby.push({ ...venue, distanceKm: null });
                return;
            }

            const distance = calculateDistanceKm(
                userLocation.lat,
                userLocation.lng,
                venue.latitude,
                venue.longitude
            );

            if (distance <= NEARBY_RADIUS_KM) {
                nearby.push({ ...venue, distanceKm: Math.round(distance) });
            } else if (distance <= MAX_RADIUS_KM) {
                tooFar.push({ ...venue, distanceKm: Math.round(distance) });
            } else {
                // Venue is beyond MAX_RADIUS_KM - don't show at all
                tooFar.push({ ...venue, distanceKm: Math.round(distance) });
            }
        });

        // Sort by distance
        nearby.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        tooFar.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

        return {
            exactMatches: nearby,
            nearbyMatches: [],
            tooFarVenues: tooFar
        };
    }, [venues, userLocation, locationStatus, searchQuery]);



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

        // Validate Phone Number
        if (!user?.phone || user.phone.length < 10) {
            setShowPhoneModal(true)
            return
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
            // Handle Unauthorized specifically
            if (result.error.includes('Unauthorized') || result.error.includes('login')) {
                setIsLoggedIn(false); // Force sync state
                setShowAuthModal(true);
                setBookingStatus('idle');
                return;
            }

            alert(`Booking failed: ${result.error}`);
            setBookingStatus('idle');
            return;
        }

        if (result.warning) {
            alert(`Attention: ${result.warning}`);
            // Don't clear state immediately so they can see the message
            setBookingStatus('idle');
            return;
        }

        if (result.paymentUrl) {
            setBookingStatus('redirecting' as any); // Type cast if needed or update state type
            window.location.href = result.paymentUrl;
            return;
        }

        // Success! (Fallback if no payment URL or free booking)
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



    if (bookingStatus === 'redirecting') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in relative overflow-hidden">
                <div className="w-24 h-24 border-8 border-black border-t-pastel-mint rounded-full animate-spin mb-8"></div>
                <h2 className="text-4xl md:text-5xl font-display font-black text-black mb-4 uppercase tracking-tighter">Redirecting to Payment...</h2>
                <p className="text-xl font-medium text-gray-600 max-w-md">
                    Please complete your payment on Xendit to secure your booking.
                </p>
            </div>
        )
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

                    {showPhoneModal && (
                        <PhoneVerificationModal
                            isOpen={showPhoneModal}
                            onClose={() => setShowPhoneModal(false)}
                            currentPhone={user?.phone}
                            onSuccess={(newPhone) => {
                                // Update local user state
                                if (user) {
                                    setUser({ ...user, phone: newPhone })
                                }
                                // Auto-trigger booking after phone update?
                                // Let's just user click "Book" again to be safe and explicit
                            }}
                        />
                    )}
                </AnimatePresence>

                <div className="mb-16">

                    <h2 className="text-5xl md:text-7xl font-display font-black text-black mb-4 uppercase tracking-tighter">
                        {selectedHall ? (
                            <>
                                You Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-pastel-lilac to-pastel-pink text-stroke-2" style={{ WebkitTextStroke: '2px black' }}>{selectedHall.name}</span>
                            </>
                        ) : (
                            <>
                                Pick Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pastel-lilac to-pastel-pink text-stroke-2" style={{ WebkitTextStroke: '2px black' }}>Battlefield</span>
                            </>
                        )}
                    </h2>
                    {!selectedHall && (
                        <p className="text-xl font-medium text-gray-600 border-l-4 border-black pl-4">
                            Find the perfect venue near you.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

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
                                    {courtTypes.map((type) => (
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

                                {/* Skeleton Loader */}
                                {isLoadingVenues ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="bg-white rounded-[2rem] border-2 border-gray-100 overflow-hidden flex flex-col h-full animate-pulse">
                                                <div className="h-48 bg-gray-200" />
                                                <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                                                    <div>
                                                        <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-4" />
                                                        <div className="space-y-2">
                                                            <div className="h-4 bg-gray-200 rounded-lg w-full" />
                                                            <div className="h-4 bg-gray-200 rounded-lg w-5/6" />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-end border-t-2 border-gray-100 pt-4 mt-auto">
                                                        <div className="w-1/3">
                                                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                                                            <div className="h-6 bg-gray-200 rounded w-full" />
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : exactMatches.length > 0 || nearbyMatches.length > 0 ? (
                                    <div className="space-y-12">

                                        {/* Primary Results */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {exactMatches.map((court: any) => (
                                                <div
                                                    key={court.id}
                                                    onClick={() => handleSelectVenue(court)}
                                                    className="group relative bg-white rounded-[2rem] border-2 border-black overflow-hidden cursor-pointer hover:shadow-hard transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                                                >
                                                    <div className="h-48 relative border-b-2 border-black overflow-hidden">
                                                        <img
                                                            src={court.photo_url || '/placeholder-court.jpg'}
                                                            alt={court.name}
                                                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                        />
                                                        <div className="absolute top-4 left-4 flex gap-2">
                                                            <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                                Court
                                                            </span>
                                                            {court.distanceKm !== null && court.distanceKm !== undefined && (
                                                                <span className="bg-pastel-mint text-black px-3 py-1 rounded-full text-xs font-bold border border-black">
                                                                    <MapPin className="w-3 h-3 inline mr-1" />
                                                                    {court.distanceKm} km
                                                                </span>
                                                            )}
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
                                        <MapPinOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-display font-black text-gray-400 uppercase">Tidak Ada Venue Di Sekitarmu</h3>
                                        {tooFarVenues.length > 0 ? (
                                            <div className="mt-4">
                                                <p className="text-gray-500 font-medium">
                                                    Ada {tooFarVenues.length} venue yang jaraknya lebih dari 50km dari lokasimu.
                                                </p>
                                                <p className="text-sm text-gray-400 mt-2">
                                                    Venue terdekat: <span className="font-bold">{tooFarVenues[0]?.name}</span> ({tooFarVenues[0]?.distanceKm} km)
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 font-medium mt-2">
                                                Belum ada venue partner pada saat ini.
                                            </p>
                                        )}
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
                                        onClick={handleClearVenue}
                                        className="flex items-center space-x-2 text-gray-500 hover:text-black font-bold transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-black flex items-center justify-center">
                                            <ChevronLeft className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm uppercase tracking-wider">{t.back_to_halls}</span>
                                    </button>
                                    <div className="text-right">
                                        <h3 className="text-2xl font-display font-black text-black uppercase">{selectedHall.name}</h3>
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selectedHall.type} {t.floor}</span>
                                    </div>
                                </div>

                                {/* Details Venue */}
                                <div className="mb-8 grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                                        className="p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all group relative"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase">{t.location_label}</span>
                                            <div className="flex items-center gap-1">
                                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isAddressExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>

                                        <motion.div
                                            initial={false}
                                            animate={{ height: isAddressExpanded ? "auto" : 60 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden relative"
                                        >
                                            <p className="font-bold text-black">
                                                {selectedHall.location?.address || 'Address not available'}
                                            </p>

                                            <AnimatePresence>
                                                {!isAddressExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-gray-50 to-transparent"
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </motion.div>

                                        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                            {selectedHall.location?.subDistrict}{selectedHall.location?.subDistrict && selectedHall.location?.city ? ', ' : ''}{selectedHall.location?.city}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <span className="text-xs font-bold text-gray-400 uppercase mb-2 block">{t.facilities_label}</span>
                                        {selectedHall.facilities && selectedHall.facilities.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedHall.facilities.map((facility: string, idx: number) => (
                                                    <FacilityIcon key={idx} name={facility} />
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">Standard Facilities</p>
                                        )}
                                    </div>
                                </div>

                                {/* Court Grid */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center">
                                        <MapPin className="w-4 h-4 mr-2" /> {t.select_court_location}
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
                                                    className={`relative rounded-2xl border-2 transition-all duration-300 group flex flex-col justify-between overflow-hidden
                                                    ${isSelected
                                                            ? 'bg-black border-black text-white shadow-hard scale-[1.02]'
                                                            : 'bg-white border-gray-200 hover:border-black hover:shadow-hard-sm'
                                                        }`}
                                                >
                                                    {/* Court Image */}
                                                    <div className="w-full h-32 bg-gray-100 relative overflow-hidden border-b-2 border-inherit">
                                                        {court.photo_url ? (
                                                            <img
                                                                src={court.photo_url}
                                                                alt={displayName}
                                                                onError={(e) => {
                                                                    console.error(`Failed to load image for ${displayName}:`, court.photo_url);
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            // Fallback Visual
                                                            <div className="w-full h-full flex items-center justify-center relative opacity-20">
                                                                <div className="w-16 h-10 border border-current rounded-sm relative">
                                                                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-current"></div>
                                                                    <div className="absolute top-0 left-1/2 h-full w-[1px] bg-current"></div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Number Overlay - Bottom Left of Image */}
                                                        <div className="absolute bottom-2 left-2 bg-white border-2 border-black rounded-lg px-3 py-1 shadow-sm z-10">
                                                            <span className="text-xl font-display font-black text-black">
                                                                {displayName.replace(/lapangan/i, '').trim() || String(court.court_number)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="p-3 flex flex-col justify-between flex-grow w-full gap-2">
                                                        <div className="text-left">
                                                            <span className={`text-[10px] font-bold block uppercase tracking-wider mb-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                                                                {court.court_type || t.court_type_standard}
                                                            </span>
                                                        </div>

                                                        <div className="text-left">
                                                            <div className="flex items-baseline gap-0.5">
                                                                <span className={`text-sm font-black uppercase tracking-tight ${isSelected ? 'text-white' : 'text-black'}`}>
                                                                    Rp {court.hourly_rate?.toLocaleString()}
                                                                </span>
                                                                <span className={`text-[10px] font-bold ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>/HR</span>
                                                            </div>
                                                        </div>
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
                                <div className="bg-white rounded-[2.5rem] border-2 border-black shadow-hard p-6 lg:p-8 animate-fade-in-up">
                                    <div className="flex items-center space-x-3 mb-8 border-b-2 border-black pb-4">
                                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl font-display">
                                            {selectedCourt ? '3' : '2'}
                                        </div>
                                        <h3 className="text-2xl font-display font-bold text-black uppercase">
                                            {selectedCourt ? t.lock_it_in : t.details_header}
                                        </h3>
                                    </div>

                                    {selectedHall && (
                                        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-gray-500 text-xs uppercase">{t.venue_label}</span>
                                                <span className="font-black text-black">{selectedHall.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-500 text-xs uppercase">{t.court_label}</span>
                                                <span className="font-black text-black">{selectedCourt ? (selectedCourt.name || `Lapangan ${selectedCourt.court_number}`) : '—'}</span>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <span className="block font-bold text-gray-500 text-xs uppercase mb-1">{t.address_label}</span>
                                                <p className="text-xs text-gray-700">{selectedHall.location?.address || 'Address not available'}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`transition-all duration-300 ${!selectedCourt ? 'opacity-50 pointer-events-none blur-[1px]' : 'opacity-100'}`}>
                                        <div className="mb-6">
                                            <label className="block text-sm font-bold text-black mb-3 uppercase tracking-wide">{t.select_date}</label>
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
                                            <label className="block text-sm font-bold text-black mb-3 uppercase tracking-wide">{t.available_slots}</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {isLoadingSlots ? (
                                                    <div className="col-span-3 flex justify-center py-4">
                                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                                    </div>
                                                ) : getCourtSlots().length === 0 ? (
                                                    <div className="col-span-3 text-center py-4 text-gray-500 text-sm">
                                                        {t.no_slots}
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
                                                            {booked && <span className="block text-[10px] font-bold uppercase">{t.booked}</span>}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-2 border-black bg-white rounded-xl p-4 space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                                        {/* Receipt Tape Effect */}
                                        <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_6px)] opacity-10"></div>

                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-display font-black text-lg uppercase">Payment Breakdown</h4>
                                            <span className="bg-pastel-mint text-[10px] font-bold px-2 py-1 border border-black rounded-md uppercase">
                                                Zero Hidden Fees
                                            </span>
                                        </div>

                                        <div className="space-y-2 font-mono text-xs">
                                            <div className="flex justify-between items-center text-gray-600">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-black uppercase">{t.court_fee}</span>
                                                    <span className="text-[10px] text-gray-400">Direct to Partner ({selectedTimes.length}hr)</span>
                                                </div>
                                                <span className="font-bold text-black">Rp {selectedHall ? (selectedHall.pricePerHour * selectedTimes.length).toLocaleString('id-ID') : 0}</span>
                                            </div>

                                            <div className="border-b border-dashed border-gray-300 my-2"></div>

                                            <div className="flex justify-between items-center text-gray-600">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-black uppercase">{t.service_fee}</span>
                                                    <span className="text-[10px] text-gray-400">Platform Maintenance</span>
                                                </div>
                                                <span className="font-bold text-black">Rp 3.000</span>
                                            </div>
                                        </div>

                                        <div className="bg-black text-white p-3 -mx-4 -mb-4 mt-4 flex justify-between items-center">
                                            <span className="font-display font-black text-xl uppercase tracking-wider">{t.total}</span>
                                            <span className="font-mono font-bold text-xl">Rp {selectedHall ? ((selectedHall.pricePerHour * selectedTimes.length) + 3000).toLocaleString('id-ID') : 0}</span>
                                        </div>
                                    </div>

                                    <button
                                        disabled={!selectedHall || !selectedCourt || selectedTimes.length === 0}
                                        onClick={handleBook}
                                        className="w-full mt-6 bg-pastel-acid text-black font-display font-black text-xl py-5 rounded-xl border-2 border-black hover:bg-white hover:shadow-hard transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none transform hover:-translate-y-1 active:translate-y-0"
                                    >
                                        {t.confirm_booking}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    )
}
