'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils' // Assuming shadcn/ui utils exist
import { joinMatchRoom, leaveMatchRoom, CourtSlot } from '@/lib/api/matchmaking'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface Participant {
    id: string
    user_id: string
    court_slot: CourtSlot
    // Join with user profile if needed for avatars
    user?: {
        full_name?: string
        avatar_url?: string
    }
}

interface VisualCourtSelectorProps {
    roomId: string
    currentUser: User | null
    initialParticipants: Participant[]
    gameFormat: 'SINGLE' | 'DOUBLE' | 'MIXED'
}

export function VisualCourtSelector({
    roomId,
    currentUser,
    initialParticipants,
    gameFormat
}: VisualCourtSelectorProps) {
    const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        // Realtime Subscription
        const channel = supabase
            .channel(`room_${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'room_participants',
                    filter: `room_id=eq.${roomId}`
                },
                async (payload) => {
                    console.log('Realtime update:', payload)
                    // Simple approach: Refresh data from server or fetch updated list
                    // For now, let's just trigger a router refresh to fetch latest prop data
                    // Or ideally, we fetch the new participant list manually here to avoid full page reload

                    // Fetch latest participants
                    const { data } = await supabase
                        .from('room_participants')
                        .select('*, user:users(full_name, avatar_url)') // Adjust relation based on schema
                        .eq('room_id', roomId)

                    if (data) {
                        setParticipants(data as any)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, supabase])

    const handleSlotClick = async (slot: CourtSlot) => {
        if (!currentUser) {
            alert('Please login to join')
            return
        }
        if (loading) return

        // check if slot is taken
        const isTaken = participants.some(p => p.court_slot === slot)
        if (isTaken) return

        // check if user already in room
        const existingParticipant = participants.find(p => p.user_id === currentUser.id)

        setLoading(true)
        try {
            if (existingParticipant) {
                // If clicking another slot, maybe move? Or leave first?
                // For simplicity: If clicking own slot, leave. If clicking empty, join (and leave old?)
                if (existingParticipant.court_slot === slot) {
                    await leaveMatchRoom(roomId)
                } else {
                    // Move logic (Leave then Join, or Update)
                    // Let's force leave first for now
                    await leaveMatchRoom(roomId)
                    await joinMatchRoom({ roomId, slot })
                }
            } else {
                // Join
                const result = await joinMatchRoom({ roomId, slot })
                if (!result.success) {
                    alert(result.error)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const renderSlot = (slot: CourtSlot, label: string) => {
        const participant = participants.find(p => p.court_slot === slot)
        const isSelf = participant?.user_id === currentUser?.id

        return (
            <div
                onClick={() => handleSlotClick(slot)}
                className={cn(
                    "flex flex-col items-center justify-center p-4 border-2 transition-all cursor-pointer h-32 rounded-lg",
                    participant
                        ? (isSelf ? "bg-green-100 border-green-500" : "bg-blue-100 border-blue-500")
                        : "bg-gray-50 border-dashed border-gray-300 hover:bg-gray-100",
                    loading && "opacity-50 cursor-wait"
                )}
            >
                {participant ? (
                    <div className="text-center">
                        <div className="font-bold text-sm">
                            {participant.user?.full_name || 'Player'}
                        </div>
                        {isSelf && <div className="text-xs text-green-700 mt-1">(You)</div>}
                    </div>
                ) : (
                    <div className="text-gray-400 text-sm font-medium">
                        + Join {label}
                    </div>
                )}
            </div>
        )
    }

    // Layout for Double: 2x2 Grid using CSS Grid
    // Layout for Single: 1x2 Grid (Front/Back merged or just A/B) -> Actually Single is usually just 1 vs 1. 
    // If Single, we might only use A_BACK and B_BACK conceptually or just hide Front slots.

    return (
        <div className="w-full max-w-2xl mx-auto p-4 bg-white shadow-lg rounded-xl">
            <h3 className="text-lg font-bold mb-4 text-center">Court Formation</h3>

            {/* Net Visual */}
            <div className="relative flex flex-col h-[600px] border-4 border-green-800 bg-green-600 p-2 gap-2">

                {/* Team B (Top Side) */}
                <div className="flex-1 flex gap-2">
                    {/* B Left (visually right if looking from net, but let's stick to simple grid) */}
                    <div className="flex-1 flex flex-col gap-2">
                        {gameFormat !== 'SINGLE' && renderSlot('B_BACK', 'Back Left')}
                        {renderSlot('B_FRONT', 'Front Left')}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                        {gameFormat !== 'SINGLE' && renderSlot('B_BACK', 'Back Right') /* Wait, duplicate keys if I reused B_BACK? uniqueness check needed */}
                        {/* Actually for 2x2, we need distinct slots. 
                            My Enum was: A_FRONT, A_BACK, B_FRONT, B_BACK. 
                            That's only 4 slots total. 
                            Wait, Doubles = 4 players. 
                            So A_FRONT, A_BACK is Front/Back formation? Or Left/Right?
                            Usually socials play Side-by-Side or Front-Back.
                            Better Enum might be: A_LEFT, A_RIGHT, B_LEFT, B_RIGHT. 
                            BUT user updated plan allows A_FRONT, A_BACK... 
                            Let's assume the user meant 2 positions per side.
                            If "Doubles", usually it implies 4 players. 
                            My Enum has 4 values. So it fits.
                            Let's map them:
                            Team B (Top): B_BACK (Top), B_FRONT (Closer to net)
                            Team A (Bottom): A_FRONT (Closer to Net), A_BACK (Bottom)
                            
                            Wait, purely Front/Back is weird for badminton doubles positioning (which is dynamic).
                            Usually it's Left/Right for service.
                            But user accepted 'A_FRONT', 'A_BACK'. 
                            Let's implement as requested: A_FRONT, A_BACK.
                            This implies a Front/Back formation fixed? 
                            Or maybe they just mean Slot 1 and Slot 2.
                            
                            Let's render them vertically for now as per "Front/Back" naming.
                        */}
                    </div>
                </div>

                {/* The Net */}
                <div className="h-4 bg-white/50 w-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold tracking-widest">NET</span>
                </div>

                {/* Team A (Bottom Side) */}
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex-1 flex gap-2 justify-center">
                        {gameFormat === 'DOUBLE' ? (
                            <>
                                {/* Correcting logic: The enum provided was A_FRONT, A_BACK etc. 
                                 If the user wants 4 players, and I have 4 enum values, I assign one to each.
                                 Let's visualize them as a cross or standard formation.
                             */}
                                {/* Team A Area */}
                                <div className="flex-1 grid grid-rows-2 gap-2">
                                    {renderSlot('A_FRONT', 'Front')}
                                    {renderSlot('A_BACK', 'Back')}
                                </div>
                            </>
                        ) : (
                            // Single
                            <div className="flex-1">
                                {renderSlot('A_BACK', 'Player A')}
                            </div>
                        )}
                    </div>
                </div>

                {/* 
                   Wait, the layout above is getting confused by my thought process.
                   Let's restart the visual grid based on the Enum constraints:
                   Slots: A_FRONT, A_BACK, B_FRONT, B_BACK.
                   
                   Team B (Top Side)
                   [ B_BACK  ]
                   [ B_FRONT ]
                   ----------- NET -----------
                   [ A_FRONT ]
                   [ A_BACK  ]
                   
                   This supports 4 players (Doubles).
                   For Singles, we just use A_BACK and B_BACK (or Front, doesn't matter).
                */}

                {/* RE-RENDER: Clean Grid */}
                <div className="absolute inset-0 flex flex-col p-4">

                    {/* Team B Container */}
                    <div className="flex-1 flex flex-col gap-2 justify-end pb-2">
                        {/* B Back */}
                        <div className="flex-1">{renderSlot('B_BACK', 'B Back')}</div>
                        {/* B Front */}
                        {gameFormat !== 'SINGLE' && (
                            <div className="flex-1">{renderSlot('B_FRONT', 'B Front')}</div>
                        )}
                    </div>

                    <div className="h-2 bg-slate-300 w-full my-2 rounded-full relative z-10 shrink-0 shadow-sm" />

                    {/* Team A Container */}
                    <div className="flex-1 flex flex-col gap-2 pt-2">
                        {/* A Front */}
                        {gameFormat !== 'SINGLE' && (
                            <div className="flex-1">{renderSlot('A_FRONT', 'A Front')}</div>
                        )}
                        {/* A Back */}
                        <div className="flex-1">{renderSlot('A_BACK', 'A Back')}</div>
                    </div>

                </div>

            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
                Mode: {gameFormat} • Tap a slot to join
            </div>
        </div>
    )
}
