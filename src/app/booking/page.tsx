"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { SchedulingCalendar } from "@/components/SchedulingCalendar"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { format, isWeekend } from "date-fns"
import { id } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { Loader2, MapPin, MapPinOff } from "lucide-react"

// Types matching database
type Court = {
    id: string
    name: string
    description: string | null
    type: string // floor_type
    price: number
    color: string
    latitude?: number
    longitude?: number
    address?: string
    distance?: number // Calculated distance in km
}

type Pricing = {
    court_id: string | null
    day_type: 'weekday' | 'weekend'
    price_per_hour: number
}

const TIME_SLOTS = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
    "20:00", "21:00", "22:00", "23:00"
]

// Helper for UI colors based on floor type
const getCourtColor = (type: string, index: number) => {
    const typeLower = type.toLowerCase()
    if (typeLower.includes('vinyl')) return index % 2 === 0 ? "bg-blue-500" : "bg-emerald-500"
    if (typeLower.includes('parquet') || typeLower.includes('wood')) return "bg-orange-500"
    if (typeLower.includes('rubber')) return "bg-red-500"
    return "bg-indigo-500"
}

// Haversine formula to calculate distance in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export default function BookingPage() {
    const supabase = createClient()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [selectedCourt, setSelectedCourt] = useState<string | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    const [courts, setCourts] = useState<Court[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt')

    // 1. Get User Location
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationStatus('error')
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
                setLocationStatus('granted')
            },
            (error) => {
                console.error("Error getting location:", error)
                setLocationStatus('denied')
            }
        )
    }, [])

    // 2. Fetch Courts & Pricing
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Fetch active courts
                const { data: courtsData, error: courtsError } = await supabase
                    .from('courts')
                    .select('*')
                    .eq('is_active', true)

                if (courtsError) throw courtsError

                // Fetch pricing
                const { data: pricingData, error: pricingError } = await supabase
                    .from('pricing')
                    .select('*')

                if (pricingError) throw pricingError

                const isWeekendDay = date ? isWeekend(date) : false
                const dayType = isWeekendDay ? 'weekend' : 'weekday'

                // Process data
                const processedCourts: Court[] = courtsData.map((court: any, index: number) => {
                    // Find price: Specific court price > Default price (null court_id)
                    const specificPrice = pricingData.find(p => p.court_id === court.id && p.day_type === dayType)
                    const defaultPrice = pricingData.find(p => p.court_id === null && p.day_type === dayType)

                    const finalPrice = specificPrice?.price_per_hour || defaultPrice?.price_per_hour || 0

                    let distance = undefined
                    if (userLocation && court.latitude && court.longitude) {
                        distance = calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            court.latitude,
                            court.longitude
                        )
                    }

                    return {
                        id: court.id,
                        name: court.name,
                        description: court.description,
                        type: court.floor_type || 'Standard',
                        price: Number(finalPrice),
                        color: getCourtColor(court.floor_type || 'Standard', index),
                        latitude: court.latitude,
                        longitude: court.longitude,
                        address: court.address,
                        distance: distance
                    }
                })

                // Sort by distance if available
                if (userLocation) {
                    processedCourts.sort((a, b) => {
                        if (a.distance === undefined || b.distance === undefined) return 0
                        return a.distance - b.distance
                    })
                }

                setCourts(processedCourts)
            } catch (error) {
                console.error("Error fetching booking data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [date, userLocation]) // Re-run when date changes (pricing) or location updates

    const handleBooking = () => {
        alert("Fitur Booking akan segera hadir! (MVP Demo)")
        // Logic will eventually insert into 'bookings' table
    }

    const selectedCourtData = courts.find(c => c.id === selectedCourt)

    return (
        <main className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
            <Navbar />

            <div className="pt-24 pb-12 px-6 md:px-12 max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">
                        Reservasi Jadwal
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Pilih tanggal, lapangan favorit, dan waktu bermain Anda.
                        {locationStatus === 'granted'
                            ? " Kami menampilkan lapangan terdekat dari lokasi Anda."
                            : " Aktifkan lokasi untuk melihat lapangan terdekat."}
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Date & Court Selection */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Step 1: Date */}
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-sm font-bold text-white">1</span>
                                Pilih Tanggal Main
                            </h2>
                            <div className="flex justify-center md:justify-start w-full">
                                <SchedulingCalendar
                                    selectedDate={date}
                                    onSelectDate={setDate}
                                    className="border-none shadow-none"
                                />
                            </div>
                        </section>

                        {/* Step 2: Court */}
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-sm font-bold text-white">2</span>
                                    Pilih Lapangan
                                </h2>
                                {locationStatus === 'granted' && (
                                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                                        <MapPin className="w-3 h-3" />
                                        Diurutkan dari terdekat
                                    </span>
                                )}
                                {locationStatus === 'denied' && (
                                    <span className="text-xs font-medium text-zinc-500 flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-full">
                                        <MapPinOff className="w-3 h-3" />
                                        Lokasi tidak aktif
                                    </span>
                                )}
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {courts.length === 0 ? (
                                        <p className="col-span-2 text-center text-muted-foreground py-8">
                                            Tidak ada lapangan aktif yang tersedia saat ini.
                                        </p>
                                    ) : (
                                        courts.map((court) => (
                                            <div
                                                key={court.id}
                                                onClick={() => setSelectedCourt(court.id)}
                                                className={cn(
                                                    "cursor-pointer group relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300",
                                                    selectedCourt === court.id
                                                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                                        : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                                                )}
                                            >
                                                <div className={cn("absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity", court.color)}>
                                                    <div className="w-16 h-16 rounded-full blur-xl bg-current"></div>
                                                </div>

                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-primary max-w-[70%]">{court.name}</h3>
                                                    {court.distance !== undefined && (
                                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                            {court.distance < 1
                                                                ? `${Math.round(court.distance * 1000)} m`
                                                                : `${court.distance.toFixed(1)} km`}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-muted-foreground mb-1">{court.type}</p>
                                                {court.address && (
                                                    <p className="text-xs text-zinc-500 mb-4 line-clamp-1">{court.address}</p>
                                                )}

                                                <p className="font-medium text-emerald-600">Rp {court.price.toLocaleString("id-ID")}/jam</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Step 3: Time */}
                        {date && selectedCourt && (
                            <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-sm font-bold text-white">3</span>
                                    Pilih Jam
                                </h2>
                                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                                    {TIME_SLOTS.map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={cn(
                                                "py-2 px-1 text-sm rounded-lg border transition-all duration-200",
                                                selectedTime === time
                                                    ? "bg-primary text-primary-foreground border-primary shadow-md transform scale-105"
                                                    : "bg-white text-zinc-600 border-zinc-200 hover:border-primary hover:text-primary"
                                            )}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>

                    {/* Right Column: Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-zinc-200">
                                <h2 className="text-lg font-bold text-primary mb-6">Ringkasan Pemesanan</h2>

                                <div className="space-y-4 mb-6 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tanggal</span>
                                        <span className="font-medium text-right">
                                            {date ? format(date, "EEEE, dd MMMM yyyy", { locale: id }) : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Lapangan</span>
                                        <span className="font-medium text-right">
                                            {selectedCourtData ? selectedCourtData.name : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Jam Mulai</span>
                                        <span className="font-medium text-right">{selectedTime || "-"}</span>
                                    </div>
                                    {selectedCourtData?.distance !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Jarak</span>
                                            <span className="font-medium text-emerald-600 text-right">
                                                {selectedCourtData.distance < 1
                                                    ? `${Math.round(selectedCourtData.distance * 1000)} m`
                                                    : `${selectedCourtData.distance.toFixed(1)} km`}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-4 border-t border-dashed border-zinc-700 text-base font-bold text-primary">
                                        <span>Total</span>
                                        <span>
                                            {selectedCourtData && selectedTime
                                                ? `Rp ${selectedCourtData.price.toLocaleString("id-ID")}`
                                                : "Rp 0"}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleBooking}
                                    className="w-full h-12 text-base font-semibold"
                                    disabled={!date || !selectedCourt || !selectedTime}
                                >
                                    Konfirmasi Booking
                                </Button>

                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    Pembayaran dilakukan setelah konfirmasi.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <Footer />
        </main>
    )
}
