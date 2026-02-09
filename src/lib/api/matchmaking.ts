'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { updateCompletedMatchRooms } from '@/lib/match-rooms/status'

export type MatchMode = 'RANKED' | 'CASUAL' | 'DRILLING'
export type LevelRequirement = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'
export type GameFormat = 'SINGLE' | 'DOUBLE' | 'MIXED'
export type CourtSlot = 'A_FRONT' | 'A_BACK' | 'B_FRONT' | 'B_BACK'

interface CreateRoomParams {
    title: string
    courtName: string
    matchDate: string
    startTime: string
    endTime: string
    price: number
    city: string
    mode: MatchMode
    levelRequirement: LevelRequirement
    gameFormat: GameFormat
    mySlot: CourtSlot
}

interface JoinRoomParams {
    roomId: string
    slot: CourtSlot
}

/**
 * Creates a new match room and automatically adds the host as the first participant
 */
export async function createMatchRoom(params: CreateRoomParams) {
    const supabase = await createClient()

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        // 1. Create Room
        const { data: room, error: roomError } = await supabase
            .from('match_rooms')
            .insert({
                host_user_id: user.id,
                title: params.title,
                court_name: params.courtName,
                match_date: params.matchDate,
                start_time: params.startTime,
                end_time: params.endTime,
                price_per_person: params.price,
                city: params.city,
                mode: params.mode,
                level_requirement: params.levelRequirement,
                game_format: params.gameFormat,
                status: 'OPEN'
            })
            .select()
            .single()

        if (roomError) throw new Error(`Failed to create room: ${roomError.message}`)

        // 2. Add Host as Participant
        const teamSide = params.mySlot.startsWith('A') ? 'A' : 'B'

        const { error: participantError } = await supabase
            .from('room_participants')
            .insert({
                room_id: room.id,
                user_id: user.id,
                status: 'APPROVED',
                team_side: teamSide,
                court_slot: params.mySlot
            })

        if (participantError) {
            // Rollback room creation if participant insertion fails
            await supabase.from('match_rooms').delete().eq('id', room.id)
            throw new Error(`Failed to join room: ${participantError.message}`)
        }

        revalidatePath('/matchmaking')
        return { success: true, roomId: room.id }

    } catch (error: any) {
        console.error('Create Room Error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Joins an existing match room with validation
 */
export async function joinMatchRoom(params: JoinRoomParams) {
    const supabase = await createClient()

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        // 1. Fetch Room Details & User Profile
        const { data: room, error: roomError } = await supabase
            .from('match_rooms')
            .select('*')
            .eq('id', params.roomId)
            .single()

        if (roomError || !room) throw new Error('Room not found')

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('skill_level') // Assuming profile has skill_level
            .eq('id', user.id)
            .single()

        // Note: If profile logic is not fully set up, we might skip this or use a default
        // For now, let's assume we proceed validation if profile exists
        if (profile && profile.skill_level) {
            // Simple mapping for numeric comparison if needed, or direct string check
            // Ideally we map levels to numbers: Beginner=1, Int=2, Adv=3, Pro=4
            // Logic: User Level >= Room Level
            const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO']
            const userLevelIdx = levels.indexOf(profile.skill_level.toUpperCase())
            const roomLevelIdx = levels.indexOf(room.level_requirement)

            if (userLevelIdx < roomLevelIdx) {
                throw new Error(`Skill level too low. Required: ${room.level_requirement}`)
            }
        }

        // 2. Join Room (Database constraint will handle slot collision)
        const teamSide = params.slot.startsWith('A') ? 'A' : 'B'

        const { error: joinError } = await supabase
            .from('room_participants')
            .insert({
                room_id: params.roomId,
                user_id: user.id,
                status: 'APPROVED', // Auto-approve for now, or PENDING if logic requires
                team_side: teamSide,
                court_slot: params.slot
            })

        if (joinError) {
            if (joinError.code === '23505') { // Unique violation
                throw new Error('Slot already taken')
            }
            throw new Error(`Failed to join: ${joinError.message}`)
        }

        revalidatePath(`/matchmaking/room/${params.roomId}`)
        return { success: true }

    } catch (error: any) {
        console.error('Join Room Error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Leaves a match room
 */
export async function leaveMatchRoom(roomId: string) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { error } = await supabase
            .from('room_participants')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', user.id)

        if (error) throw new Error(error.message)

        revalidatePath(`/matchmaking/room/${roomId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Fetches all open match rooms
 */
export async function getMatchRooms() {
    const supabase = await createClient()

    try {
        await updateCompletedMatchRooms({ supabase })

        const { data, error } = await supabase
            .from('match_rooms')
            .select(`
                *,
                participants:room_participants(count)
            `)
            .eq('status', 'OPEN')
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)

        return data || []
    } catch (error) {
        console.error('Get Rooms Error:', error)
        return []
    }
}

export async function getMatchRoomDetail(roomId: string) {
    const supabase = await createClient()

    try {
        await updateCompletedMatchRooms({ supabase, roomIds: [roomId] })

        const { data: room, error: roomError } = await supabase
            .from('match_rooms')
            .select('*')
            .eq('id', roomId)
            .single()

        if (roomError || !room) {
            throw roomError || new Error('Room not found')
        }

        const { data: participants, error: participantsError } = await supabase
            .from('room_participants')
            .select(`
                id,
                user_id,
                status,
                users (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq('room_id', roomId)
            .eq('status', 'APPROVED')
            .order('created_at', { ascending: true })

        if (participantsError) {
            throw participantsError
        }

        return { room, participants: participants || [] }
    } catch (error: any) {
        console.error('Get Match Room Detail Error:', error)
        return { error: error?.message || 'Failed to fetch room detail' }
    }
}
