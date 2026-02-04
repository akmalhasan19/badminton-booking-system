"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Calendar, MapPin, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { fetchVenues } from "@/lib/api/actions"
import { SmashVenue } from "@/lib/smash-api"


interface HeroBookingWidgetProps {
    className?: string
}

export function HeroBookingWidget({ className = "" }: HeroBookingWidgetProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    // Autocomplete State
    const [venues, setVenues] = useState<SmashVenue[]>([])
    const [suggestions, setSuggestions] = useState<SmashVenue[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Load venues on mount
    useEffect(() => {
        const loadVenues = async () => {
            try {
                const data = await fetchVenues()
                setVenues(data)
            } catch (error) {
                console.error("Failed to load venues", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadVenues()
    }, [])

    // Filter logic
    useEffect(() => {
        if (!searchQuery) {
            setSuggestions([])
            return
        }

        const query = searchQuery.toLowerCase()
        const filtered = venues.filter(venue =>
            venue.name.toLowerCase().includes(query) ||
            (venue.city && venue.city.toLowerCase().includes(query))
        )
        setSuggestions(filtered.slice(0, 5)) // Limit to 5 suggestions
    }, [searchQuery, venues])

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSearch = (overrideQuery?: string) => {
        const queryToUse = overrideQuery !== undefined ? overrideQuery : searchQuery
        const params = new URLSearchParams()
        params.set('tab', 'book')

        if (queryToUse) {
            // Check if matches a venue exactly
            const matchedVenue = venues.find(v => v.name.toLowerCase() === queryToUse.toLowerCase())
            if (matchedVenue) {
                params.set('venueId', matchedVenue.id)
            } else {
                params.set('q', queryToUse)
            }
        }

        if (date) params.set('date', date)

        router.push(`/?${params.toString()}`, { scroll: false })
        setShowSuggestions(false)
    }

    const handleSuggestionClick = (venue: SmashVenue) => {
        setSearchQuery(venue.name)
        setShowSuggestions(false)
        // Only autofill, user must click Search manually
    }

    return (
        <div className={`w-full bg-white rounded-3xl border-2 border-black shadow-hard p-2 ${className}`}>
            {/* Tabs - Visual only for now */}
            <div className="flex gap-2 mb-2 px-2 pt-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-pastel-mint border-2 border-black rounded-xl font-bold text-sm shadow-hard-sm transform -translate-y-1">
                    <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                    Booking Court
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-gray-100 rounded-xl font-bold text-sm text-gray-500 transition-colors">
                    Find Coach
                </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                {/* Search Input */}
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-1">
                        Venue / Location
                    </label>
                    <div className="relative group" ref={wrapperRef}>
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setShowSuggestions(true)
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-black font-bold placeholder-gray-300 focus:outline-none focus:border-black focus:shadow-hard-sm transition-all"
                            placeholder="Find name or location..."
                        />

                        {/* Suggestions Dropdown */}
                        {showSuggestions && searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black rounded-xl shadow-hard z-50 overflow-hidden max-h-60 overflow-y-auto">
                                {isLoading ? (
                                    <div className="p-4 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading venues...
                                    </div>
                                ) : suggestions.length > 0 ? (
                                    <ul>
                                        {suggestions.map((venue) => (
                                            <li
                                                key={venue.id}
                                                onClick={() => handleSuggestionClick(venue)}
                                                className="px-4 py-3 hover:bg-pastel-mint/30 cursor-pointer border-b last:border-b-0 border-gray-100 flex flex-col transition-colors"
                                            >
                                                <span className="font-bold text-sm text-dark">{venue.name}</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {venue.city || "Location unknown"}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-4 text-center text-gray-400 text-xs italic">
                                        No venues found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Date Input */}
                <div className="flex-1 w-full md:max-w-xs">
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-1">
                        Date
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-black font-bold focus:outline-none focus:border-black focus:shadow-hard-sm transition-all cursor-pointer"
                        />
                    </div>
                </div>

                {/* Search Button */}
                <button
                    onClick={() => handleSearch()}
                    className="w-full md:w-auto px-8 py-4 bg-black text-white rounded-xl font-black text-lg border-2 border-transparent hover:bg-pastel-acid hover:text-black hover:border-black shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                >
                    <Search className="w-5 h-5" />
                    Search
                </button>
            </div>
        </div>
    )
}
