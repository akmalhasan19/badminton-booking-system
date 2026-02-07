"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, MapPin, Loader2, Navigation } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useGeolocation } from "@/hooks/useGeolocation"

// Type definition for Community
type Community = {
    id: string
    name: string
    description?: string
    sport: string
    logo_url?: string
    cover_url?: string
    member_count: number
    city?: string
    latitude?: number
    longitude?: number
    distance_km?: number // Only for nearby search
}

export default function DiscoverCommunitiesPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [communities, setCommunities] = useState<Community[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { latitude, longitude, error: locationError, permissionStatus, requestLocation, loading: locationLoading } = useGeolocation()
    const supabase = createClient()

    // Fetch communities based on search term or location
    const fetchCommunities = useCallback(async () => {
        setIsLoading(true)
        try {
            if (searchTerm.trim().length > 0) {
                // Search mode (Global)
                const { data, error } = await supabase
                    .from('communities')
                    .select('*, member_count:community_members(count)')
                    .ilike('name', `%${searchTerm}%`)
                    .limit(20)

                if (error) throw error

                // Transform data to match Community type (handling count)
                const transformed = data?.map(c => ({
                    ...c,
                    member_count: c.member_count?.[0]?.count || 0,
                    distance_km: undefined
                })) || []

                setCommunities(transformed)
            } else {
                // Nearby mode
                if (latitude && longitude) {
                    const { data, error } = await supabase
                        .rpc('get_nearby_communities', {
                            user_lat: latitude,
                            user_long: longitude,
                            radius_km: 8.0,
                            limit_count: 20
                        })

                    if (error) throw error
                    setCommunities(data || [])
                } else {
                    setCommunities([])
                }
            }
        } catch (error) {
            console.error('Error fetching communities:', error)
        } finally {
            setIsLoading(false)
        }
    }, [searchTerm, latitude, longitude, supabase])

    // Effect to trigger fetch
    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchCommunities()
        }, 500)

        return () => clearTimeout(timer)
    }, [fetchCommunities])

    // Utility to get category icon/color (reusing logic from mock)
    const getCategoryStyles = (category: string) => {
        const lower = category.toLowerCase()
        if (lower.includes('badminton')) return { icon: '🏸', bg: 'bg-neo-yellow', color: 'bg-secondary' }
        if (lower.includes('futsal') || lower.includes('soccer')) return { icon: '⚽', bg: 'bg-accent', color: 'bg-primary' }
        if (lower.includes('padel')) return { icon: '🤾', bg: 'bg-neo-yellow', color: 'bg-primary' }
        if (lower.includes('basketball')) return { icon: '🏀', bg: 'bg-orange-400', color: 'bg-secondary' }
        return { icon: '🏆', bg: 'bg-gray-200', color: 'bg-black' }
    }

    const { icon, bg: iconBg, color: badgeColor } = { icon: '🏸', bg: 'bg-neo-yellow', color: 'bg-secondary' } // Default just for safety, overridden in loop

    const showNearbyState = searchTerm.trim().length === 0
    const showEnableLocation = showNearbyState && (!latitude || !longitude) && !locationLoading

    return (
        <main className="min-h-screen bg-white dark:bg-zinc-900 pb-8 font-sans">
            <div className="max-w-md mx-auto min-h-screen relative overflow-hidden bg-white dark:bg-zinc-900">

                {/* Header */}
                <header className="p-6 pb-2">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 border-2 border-black dark:border-white shadow-hard active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all rounded-lg group"
                        >
                            <ArrowLeft className="w-6 h-6 text-black dark:text-white" />
                        </button>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white">
                            Join a community
                        </h1>
                    </div>

                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-3 pl-10 pr-4 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white rounded-lg shadow-hard focus:outline-none focus:ring-0 placeholder-gray-500 dark:placeholder-gray-400 font-medium text-black dark:text-white transition-all"
                            placeholder="Enter team name here"
                        />
                    </div>
                </header>

                {/* Main Content */}
                <div className="p-6 pt-2">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-black dark:text-white">
                        <span className="w-4 h-8 bg-secondary block border-2 border-black shadow-hard-sm"></span>
                        {showNearbyState ? "Nearby Communities" : "Search Results"}
                    </h2>

                    {locationLoading && showNearbyState ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p>Locating you...</p>
                        </div>
                    ) : showEnableLocation ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-zinc-800/50 dark:border-zinc-700">
                            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
                                <Navigation className="w-8 h-8 text-red-500 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Location Required</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-[250px] mb-6 text-sm">
                                Please enable location services to see communities near you (within 8km).
                            </p>
                            <button
                                onClick={requestLocation}
                                className="px-6 py-2.5 bg-primary text-black border-2 border-black font-bold uppercase tracking-wide shadow-hard hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all rounded-lg"
                            >
                                Enable Location
                            </button>
                            {locationError && (
                                <p className="mt-4 text-xs text-red-500 font-bold bg-white px-2 py-1 border border-red-200 rounded">
                                    {locationError}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
                                </div>
                            ) : communities.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    <p>No communities found {showNearbyState ? "nearby" : "matching your search"}.</p>
                                    {showNearbyState && <p className="text-sm mt-1">Try increasing the radius or checking your location.</p>}
                                </div>
                            ) : (
                                communities.map((community) => {
                                    const styles = getCategoryStyles(community.sport || community.category || 'Other')
                                    const initials = community.name.substring(0, 2).toUpperCase()

                                    return (
                                        <div
                                            key={community.id}
                                            onClick={() => router.push(`/communities/${community.id}`)}
                                            className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white rounded-lg shadow-hard group hover:-translate-y-1 transition-transform duration-200 cursor-pointer"
                                        >
                                            {/* Community Image/Icon */}
                                            <div className="w-16 h-16 shrink-0 relative">
                                                {community.logo_url || community.image ? (
                                                    <img
                                                        src={community.logo_url || community.image}
                                                        alt={community.name}
                                                        className="w-full h-full object-cover rounded-md border-2 border-black"
                                                    />
                                                ) : (
                                                    <div className={`w-full h-full bg-gray-200 flex items-center justify-center rounded-md border-2 border-black`}>
                                                        <span className="text-gray-500 font-black text-xl">{initials}</span>
                                                    </div>
                                                )}

                                                {/* Category Icon Badge */}
                                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${styles.color === 'bg-secondary' ? 'bg-primary' : 'bg-accent'} flex items-center justify-center rounded-full border-2 border-black z-10`}>
                                                    <span className="text-xs font-bold leading-none">{styles.icon}</span>
                                                </div>
                                            </div>

                                            {/* Community Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg leading-tight truncate text-black dark:text-white">
                                                    {community.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black rounded-sm">
                                                        {community.sport}
                                                    </span>
                                                    {community.distance_km !== undefined && (
                                                        <span className="flex items-center gap-0.5 text-[10px] text-gray-600 dark:text-gray-300 font-medium">
                                                            <MapPin className="w-3 h-3" />
                                                            {community.distance_km.toFixed(1)} km
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1">
                                                    {community.city || community.location}
                                                    {community.member_count > 0 && ` • ${community.member_count} members`}
                                                </p>
                                            </div>

                                            {/* Join Button */}
                                            <button className={`px-4 py-2 ${styles.color} border-2 border-black rounded shadow-hard-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-white font-bold uppercase text-xs tracking-wider whitespace-nowrap`}>
                                                Join
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Line */}
                <div className="absolute bottom-0 left-0 w-full h-2 bg-black dark:bg-white"></div>
            </div>
        </main>
    )
}
