"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Plus, Users, Calendar, MapPin, Trophy, ArrowRight, Search, Filter, Clock, DollarSign, Locate, User, X, Check, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getMatchRooms, createMatchRoom, MatchMode, LevelRequirement, GameFormat, CourtSlot, getMatchRoomDetail } from "@/lib/api/matchmaking"
import { VisualCourtSelector } from "@/components/matchmaking/VisualCourtSelector"
import { cn } from "@/lib/utils"
import { createPlayerReview, getMyRoomReviews } from "@/lib/api/player-reviews"

export function MatchSection() {
    const [view, setView] = useState<'LOBBY' | 'ROOM'>('LOBBY')
    const [rooms, setRooms] = useState<any[]>([])
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [roomDetail, setRoomDetail] = useState<any>(null)
    const [roomParticipants, setRoomParticipants] = useState<any[]>([])
    const [roomDetailLoading, setRoomDetailLoading] = useState(false)
    const [roomDetailError, setRoomDetailError] = useState<string | null>(null)
    const [reviewedUserIds, setReviewedUserIds] = useState<Set<string>>(new Set())
    const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string }>>({})
    const [reviewStatus, setReviewStatus] = useState<Record<string, { submitting?: boolean; error?: string; success?: boolean }>>({})

    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [cityFilter, setCityFilter] = useState("")

    // Create Room Form State
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        courtName: '',
        matchDate: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '20:00',
        price: 0,
        city: 'Jakarta',
        mode: 'CASUAL' as MatchMode,
        levelRequirement: 'BEGINNER' as LevelRequirement,
        gameFormat: 'DOUBLE' as GameFormat,
        mySlot: 'A_BACK' as CourtSlot
    })
    const [isCreating, setIsCreating] = useState(false)

    // Custom Dropdown State
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
    const cityDropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
                setIsCityDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Load rooms and user on mount
    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)

            const fetchedRooms = await getMatchRooms()
            setRooms(fetchedRooms)
            setIsLoading(false)
        }
        init()
    }, [])

    useEffect(() => {
        if (!selectedRoomId) return

        let isActive = true
        setRoomDetailLoading(true)
        setRoomDetailError(null)

        const loadRoomDetail = async () => {
            const [detailResult, reviewsResult] = await Promise.all([
                getMatchRoomDetail(selectedRoomId),
                getMyRoomReviews(selectedRoomId)
            ])

            if (!isActive) return

            if (detailResult?.error) {
                setRoomDetail(null)
                setRoomParticipants([])
                setRoomDetailError(detailResult.error)
            } else {
                setRoomDetail(detailResult.room)
                setRoomParticipants(detailResult.participants || [])
            }

            if (!reviewsResult?.error && reviewsResult?.data) {
                setReviewedUserIds(new Set(reviewsResult.data))
            }

            setRoomDetailLoading(false)
        }

        loadRoomDetail()

        return () => {
            isActive = false
        }
    }, [selectedRoomId])

    useEffect(() => {
        if (roomParticipants.length === 0) return

        setReviewDrafts((prev) => {
            const next = { ...prev }
            roomParticipants.forEach((participant) => {
                if (!next[participant.user_id]) {
                    next[participant.user_id] = { rating: 5, comment: '' }
                }
            })
            return next
        })
    }, [roomParticipants])

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            const result = await createMatchRoom(formData)
            if (result.success && result.roomId) {
                setShowCreateModal(false)
                setSelectedRoomId(result.roomId)
                setView('ROOM')
                const fetchedRooms = await getMatchRooms()
                setRooms(fetchedRooms)
            } else {
                alert(result.error || 'Failed to create room')
            }
        } catch (error) {
            console.error(error)
            alert('An error occurred')
        } finally {
            setIsCreating(false)
        }
    }

    const handleJoinRoom = (roomId: string) => {
        setSelectedRoomId(roomId)
        setView('ROOM')
    }

    const handleReviewFieldChange = (userId: string, field: 'rating' | 'comment', value: string | number) => {
        setReviewDrafts((prev) => ({
            ...prev,
            [userId]: {
                rating: field === 'rating' ? Number(value) : (prev[userId]?.rating ?? 5),
                comment: field === 'comment' ? String(value) : (prev[userId]?.comment ?? '')
            }
        }))
    }

    const handleSubmitReview = async (revieweeUserId: string) => {
        if (!selectedRoomId) return

        setReviewStatus((prev) => ({
            ...prev,
            [revieweeUserId]: { submitting: true }
        }))

        const draft = reviewDrafts[revieweeUserId] || { rating: 5, comment: '' }
        const result = await createPlayerReview({
            roomId: selectedRoomId,
            revieweeUserId,
            rating: draft.rating,
            comment: draft.comment
        })

        if (result?.error) {
            setReviewStatus((prev) => ({
                ...prev,
                [revieweeUserId]: { submitting: false, error: result.error }
            }))
            return
        }

        setReviewedUserIds((prev) => {
            const next = new Set(prev)
            next.add(revieweeUserId)
            return next
        })

        setReviewStatus((prev) => ({
            ...prev,
            [revieweeUserId]: { submitting: false, success: true }
        }))
    }

    // Filter logic
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.court_name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCity = cityFilter ? room.city === cityFilter : true
        return matchesSearch && matchesCity
    })

    // Get unique cities for filter
    const cities = Array.from(new Set(rooms.map(r => r.city || 'Jakarta')))

    const isRoomCompleted = roomDetail?.status === 'COMPLETED'
    const isCurrentUserParticipant = roomParticipants.some(participant => participant.user_id === currentUser?.id)
    const reviewTargets = roomParticipants.filter(participant => participant.user_id !== currentUser?.id)

    const renderLobby = () => (
        <div className="max-w-7xl mx-auto px-4 py-6 font-sans">

            {/* Header Area */}
            <div className="mb-8">
                <h2 className="text-4xl md:text-6xl font-display font-black mb-1 uppercase tracking-tight">Match Lobby</h2>
                <p className="text-sm md:text-base font-bold text-gray-500">Find your squad. Dominate the court.</p>
            </div>

            {/* Neo-Brutalist Search Bar (Redesigned - Split Containers) */}
            <div className="mb-10 flex flex-col xl:flex-row gap-4 items-stretch">
                {/* Search Input Container */}
                <div className="flex-1 relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-pastel-acid rounded-lg border border-black flex items-center justify-center pointer-events-none group-focus-within:rotate-12 transition-transform shadow-sm z-10">
                        <Search className="w-4 h-4 text-black" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search event..."
                        className="w-full h-14 pl-16 pr-4 font-bold text-sm bg-white border-2 border-black rounded-xl focus:translate-x-1 focus:translate-y-1 focus:shadow-none shadow-hard transition-all outline-none"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* City Filter & Filter Button Group */}
                <div className="flex flex-row gap-4 w-full xl:w-auto">
                    {/* City Filter Container */}
                    <div className="flex-1 xl:flex-none xl:w-48 relative group" ref={cityDropdownRef}>
                        <button
                            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                            className="w-full h-14 pl-16 pr-4 font-bold text-sm bg-white border-2 border-black rounded-xl hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-hard transition-all outline-none flex items-center justify-between relative"
                        >
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-pastel-lilac rounded-lg border border-black flex items-center justify-center pointer-events-none">
                                <MapPin className="w-4 h-4 text-black" />
                            </div>
                            <span className="truncate">{cityFilter || "Choose City"}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Custom Dropdown Menu */}
                        {isCityDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black rounded-xl shadow-hard z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            setCityFilter("")
                                            setIsCityDropdownOpen(false)
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-between transition-colors",
                                            cityFilter === "" && "bg-pastel-acid/20"
                                        )}
                                    >
                                        <span className="font-bold text-sm">All Cities</span>
                                        {cityFilter === "" && <Check className="w-4 h-4 text-black" />}
                                    </button>
                                    {cities.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => {
                                                setCityFilter(c)
                                                setIsCityDropdownOpen(false)
                                            }}
                                            className={cn(
                                                "w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-between transition-colors",
                                                cityFilter === c && "bg-pastel-acid/20"
                                            )}
                                        >
                                            <span className="font-bold text-sm">{c}</span>
                                            {cityFilter === c && <Check className="w-4 h-4 text-black" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filter Button */}
                    <button className="h-14 w-12 bg-white border-2 border-black rounded-xl shadow-hard flex items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group shrink-0">
                        <Filter className="w-6 h-6 text-black group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                </div>

                {/* Search Button */}
                <button className="h-14 px-8 bg-black text-white font-black text-sm uppercase tracking-wider rounded-xl border-2 border-transparent shadow-hard hover:bg-gray-900 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 justify-center xl:justify-start shrink-0">
                    <Search className="w-5 h-5" />
                    Search Match
                </button>
            </div>

            <div className="flex justify-between items-center mb-3 px-1">
                <p className="text-sm md:text-base font-bold text-gray-500 uppercase tracking-wider">Active Matches ({filteredRooms.length})</p>
            </div>

            {/* Room List - Larger Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {isLoading ? (
                    // Skeleton Loader
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden flex flex-col h-full animate-pulse">
                            <div className="h-10 bg-gray-200 border-b-2 border-gray-100" />
                            <div className="p-4 flex-1 flex flex-col gap-2 min-h-[90px]">
                                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="mt-auto space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                </div>
                            </div>
                            <div className="h-10 bg-gray-200 border-t-2 border-gray-100" />
                        </div>
                    ))
                ) : (
                    filteredRooms.map((room) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -2 }}
                            className="bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all overflow-hidden group cursor-pointer flex flex-col h-full"
                            onClick={() => handleJoinRoom(room.id)}
                        >
                            {/* Header - Height increased to h-10 */}
                            <div className="px-4 py-2.5 border-b-2 border-black bg-gray-50 flex justify-between items-center h-10">
                                <div className="flex gap-2 items-center">
                                    <span className="bg-black text-white text-xs font-black px-2 py-0.5 rounded-md tracking-wide uppercase">
                                        {room.game_format}
                                    </span>
                                    <span className={cn(
                                        "text-xs font-black px-2 py-0.5 rounded-md border border-black uppercase tracking-wide",
                                        room.level_requirement === 'BEGINNER' ? "bg-pastel-acid text-black" :
                                            room.level_requirement === 'INTERMEDIATE' ? "bg-pastel-lilac text-black" :
                                                "bg-pastel-pink text-black"
                                    )}>
                                        {room.level_requirement}
                                    </span>
                                </div>
                                {room.mode === 'RANKED' && (
                                    <Trophy className="w-4 h-4 text-orange-500" />
                                )}
                            </div>

                            <div className="p-4 flex-1 flex flex-col gap-2 min-h-[90px]">
                                <h3 className="text-base font-black text-black leading-tight uppercase line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">{room.title}</h3>

                                <div className="mt-auto space-y-2">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4 shrink-0" />
                                        <p className="text-xs font-bold leading-none">{new Date(room.match_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {room.start_time?.slice(0, 5)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin className="w-4 h-4 shrink-0" />
                                        <p className="text-xs font-bold leading-none truncate">{room.court_name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer - Height increased to h-10 */}
                            <div className="px-4 py-2.5 border-t-2 border-black bg-white flex justify-between items-center h-10">
                                <span className="text-base font-black text-black">
                                    {room.price_per_person > 0
                                        ? `IDR ${(room.price_per_person / 1000)}k`
                                        : 'Free'
                                    }
                                </span>

                                <button className="px-3 py-1 bg-pastel-mint text-black font-black rounded-md border border-black hover:bg-green-400 transition-colors text-xs uppercase flex items-center gap-1.5 shadow-sm hover:translate-y-px hover:shadow-none">
                                    Join <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {!isLoading && filteredRooms.length === 0 && (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-black border-dashed opacity-70">
                    <div className="bg-white w-10 h-10 rounded-lg border-2 border-black shadow flex items-center justify-center mx-auto mb-3 rotate-3">
                        <Users className="w-5 h-5 text-black" />
                    </div>
                    <h3 className="text-sm font-black uppercase mb-1">No Matches Found</h3>
                    <button onClick={() => setShowCreateModal(true)} className="mt-2 bg-black text-white px-4 py-1.5 rounded font-bold text-[10px] border border-transparent hover:bg-gray-800 transition-colors">
                        Create Match
                    </button>
                </div>
            )}

            {/* Create Modal (Kept standard size for usability) */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white w-full max-w-xl rounded-2xl border-4 border-black shadow-hard-xl overflow-hidden my-8 relative"
                    >
                        <div className="p-5 border-b-4 border-black bg-pastel-acid flex justify-between items-center relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-display font-black uppercase tracking-tight">Create Match</h3>
                                <p className="font-bold text-black/60 text-xs">Set up your battlefield</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="bg-white p-2 rounded-lg border-2 border-black shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all relative z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRoom} className="p-6 space-y-4 bg-white max-h-[70vh] overflow-y-auto tags-input">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-full">
                                    <label className="block text-[10px] font-black uppercase mb-1 ml-1">Room Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 border-2 border-black rounded-lg font-bold text-sm focus:bg-gray-50 outline-none transition-all shadow-sm focus:shadow-hard-sm"
                                        placeholder="e.g. Sunday Morning Smash"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                {/* ... Rest of form inputs simplified for brevity but kept functional ... */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 ml-1">Location</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 border-2 border-black rounded-lg font-bold text-sm focus:bg-gray-50 outline-none shadow-sm focus:shadow-hard-sm"
                                        placeholder="GOR Name"
                                        value={formData.courtName}
                                        onChange={e => setFormData({ ...formData, courtName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 ml-1">City</label>
                                    <select
                                        className="w-full p-3 border-2 border-black rounded-lg font-bold text-sm bg-white focus:bg-gray-50 outline-none shadow-sm focus:shadow-hard-sm"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    >
                                        <option value="Jakarta">Jakarta</option>
                                        <option value="Bandung">Bandung</option>
                                        <option value="Surabaya">Surabaya</option>
                                        <option value="Tangerang">Tangerang</option>
                                        <option value="Bekasi">Bekasi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 ml-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 border-2 border-black rounded-lg font-bold text-sm focus:bg-gray-50 outline-none shadow-sm focus:shadow-hard-sm"
                                        value={formData.matchDate}
                                        onChange={e => setFormData({ ...formData, matchDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase mb-1 ml-1">Start</label>
                                        <input
                                            type="time"
                                            required
                                            className="w-full p-3 border-2 border-black rounded-lg font-bold text-sm text-center focus:bg-gray-50 outline-none shadow-sm focus:shadow-hard-sm"
                                            value={formData.startTime}
                                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase mb-1 ml-1">End</label>
                                        <input
                                            type="time"
                                            required
                                            className="w-full p-3 border-2 border-black rounded-lg font-bold text-sm text-center focus:bg-gray-50 outline-none shadow-sm focus:shadow-hard-sm"
                                            value={formData.endTime}
                                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 ml-1">Price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        className="w-full p-3 border-2 border-black rounded-lg font-bold text-sm focus:bg-gray-50 outline-none shadow-sm focus:shadow-hard-sm"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 ml-1">Format</label>
                                    <select
                                        className="w-full p-3 border-2 border-black rounded-lg font-bold text-sm bg-white focus:bg-gray-50 outline-none shadow-sm focus:shadow-hard-sm"
                                        value={formData.gameFormat}
                                        onChange={e => setFormData({ ...formData, gameFormat: e.target.value as GameFormat })}
                                    >
                                        <option value="DOUBLE">Double</option>
                                        <option value="SINGLE">Single</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 ml-1">Stats</label>
                                    <select
                                        className="w-full p-3 border-2 border-black rounded-lg font-bold text-sm bg-white focus:bg-gray-50 outline-none shadow-sm focus:shadow-hard-sm"
                                        value={formData.levelRequirement}
                                        onChange={e => setFormData({ ...formData, levelRequirement: e.target.value as LevelRequirement })}
                                    >
                                        <option value="BEGINNER">Beginner</option>
                                        <option value="INTERMEDIATE">Intermediate</option>
                                        <option value="ADVANCED">Advanced</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 ml-1">My Spot</label>
                                    <select
                                        className="w-full p-3 border-2 border-black rounded-lg font-bold text-sm bg-white focus:bg-gray-50 outline-none shadow-sm focus:shadow-hard-sm"
                                        value={formData.mySlot}
                                        onChange={e => setFormData({ ...formData, mySlot: e.target.value as CourtSlot })}
                                    >
                                        <option value="A_BACK">A - Back</option>
                                        <option value="A_FRONT">A - Front</option>
                                        <option value="B_BACK">B - Back</option>
                                        <option value="B_FRONT">B - Front</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t-2 border-dashed border-gray-200 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-3 font-bold text-xs text-gray-500 hover:text-black transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-6 py-3 bg-black text-white rounded-lg font-black text-sm border-2 border-transparent shadow-hard hover:translate-y-0.5 hover:shadow-none hover:bg-gray-900 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isCreating ? '...' : 'Launch 🚀'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )

    const renderRoom = () => (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <button
                onClick={() => setView('LOBBY')}
                className="mb-6 flex items-center gap-2 font-bold text-black bg-white px-4 py-2 border-2 border-black rounded-lg shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all"
            >
                ← Back to Lobby
            </button>

            {selectedRoomId && (
                <VisualCourtSelector
                    roomId={selectedRoomId}
                    currentUser={currentUser}
                    initialParticipants={[]} // Data will fetch via realtime/client load in component
                    gameFormat={rooms.find(r => r.id === selectedRoomId)?.game_format || 'DOUBLE'}
                />
            )}

            <div className="mt-8 bg-white border-2 border-black rounded-xl p-5 shadow-hard">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-wide">Review Keterampilan</h3>
                        <p className="text-xs text-gray-500 font-medium">
                            Beri penilaian setelah match selesai.
                        </p>
                    </div>
                    {roomDetail?.status && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-1 rounded-full">
                            {roomDetail.status}
                        </span>
                    )}
                </div>

                {roomDetailLoading ? (
                    <div className="text-sm text-gray-500 font-medium">Memuat data match...</div>
                ) : roomDetailError ? (
                    <div className="text-sm text-red-500 font-medium">{roomDetailError}</div>
                ) : !isRoomCompleted ? (
                    <div className="text-sm text-gray-500 font-medium">
                        Review tersedia setelah match selesai.
                    </div>
                ) : !isCurrentUserParticipant ? (
                    <div className="text-sm text-gray-500 font-medium">
                        Hanya peserta match yang bisa memberikan review.
                    </div>
                ) : reviewTargets.length === 0 ? (
                    <div className="text-sm text-gray-500 font-medium">
                        Tidak ada peserta lain untuk direview.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reviewTargets.map((participant) => {
                            const revieweeId = participant.user_id
                            const revieweeName = participant.users?.full_name || 'Player'
                            const revieweeAvatar = participant.users?.avatar_url
                            const draft = reviewDrafts[revieweeId] || { rating: 5, comment: '' }
                            const status = reviewStatus[revieweeId]
                            const isReviewed = reviewedUserIds.has(revieweeId)

                            return (
                                <div key={revieweeId} className="border-2 border-black/10 rounded-xl p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-gray-200">
                                                {revieweeAvatar ? (
                                                    <img src={revieweeAvatar} alt={revieweeName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-black text-gray-500">
                                                        {revieweeName.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="font-bold text-sm">{revieweeName}</div>
                                        </div>
                                        {isReviewed && (
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-pastel-mint/40 text-black px-2 py-1 rounded-full border border-black">
                                                Sudah Direview
                                            </span>
                                        )}
                                    </div>

                                    {!isReviewed && (
                                        <div className="mt-3 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rating</label>
                                                <select
                                                    value={draft.rating}
                                                    onChange={(event) => handleReviewFieldChange(revieweeId, 'rating', event.target.value)}
                                                    className="px-3 py-2 border-2 border-black rounded-lg text-sm font-bold bg-white"
                                                >
                                                    {[5, 4, 3, 2, 1].map((value) => (
                                                        <option key={value} value={value}>{value}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <textarea
                                                value={draft.comment}
                                                onChange={(event) => handleReviewFieldChange(revieweeId, 'comment', event.target.value)}
                                                className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm font-medium"
                                                rows={3}
                                                placeholder="Tulis catatan singkat (opsional)"
                                            />

                                            {status?.error && (
                                                <div className="text-xs text-red-500 font-bold">{status.error}</div>
                                            )}
                                            {status?.success && (
                                                <div className="text-xs text-green-600 font-bold">Review tersimpan.</div>
                                            )}

                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSubmitReview(revieweeId)}
                                                    disabled={status?.submitting}
                                                    className="px-4 py-2 bg-black text-white text-xs font-black uppercase rounded-lg border-2 border-black hover:bg-gray-900 transition-colors disabled:opacity-50"
                                                >
                                                    {status?.submitting ? 'Menyimpan...' : 'Submit Review'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <section className="min-h-screen bg-[#F4F7FE] pt-24 pb-20 font-sans relative overflow-hidden">
            {/* Grid Background */}
            <div
                className="absolute inset-0 z-0 w-full h-full pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(160, 82, 45, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 82, 45, 0.15) 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}
            />

            <div className="relative z-10">
                {view === 'LOBBY' ? renderLobby() : renderRoom()}
            </div>
        </section>
    )
}
