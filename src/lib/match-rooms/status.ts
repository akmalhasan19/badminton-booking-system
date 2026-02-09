'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

type MatchRoomStatusRow = {
    id: string
    match_date: string
    end_time: string | null
    status: string
}

function getRoomEndDate(room: MatchRoomStatusRow) {
    const matchDate = new Date(room.match_date)
    const endDate = new Date(matchDate)

    if (room.end_time) {
        const [hour, minute, second = '0'] = room.end_time.split(':')
        endDate.setHours(
            Number.parseInt(hour, 10),
            Number.parseInt(minute, 10),
            Number.parseInt(second, 10),
            0
        )
    }

    return endDate
}

export async function updateCompletedMatchRooms(options?: {
    supabase?: SupabaseClient
    roomIds?: string[]
    communityId?: string
}) {
    const supabase = options?.supabase ?? await createClient()

    let query = supabase
        .from('match_rooms')
        .select('id, match_date, end_time, status')
        .in('status', ['OPEN', 'PLAYING'])

    if (options?.roomIds?.length) {
        query = query.in('id', options.roomIds)
    }

    if (options?.communityId) {
        query = query.eq('community_id', options.communityId)
    }

    const { data: rooms, error } = await query

    if (error) {
        console.error('Update match room status fetch error:', error)
        return { updatedIds: [] as string[] }
    }

    if (!rooms || rooms.length === 0) {
        return { updatedIds: [] as string[] }
    }

    const now = new Date()
    const completedIds = rooms
        .filter(room => getRoomEndDate(room as MatchRoomStatusRow).getTime() <= now.getTime())
        .map(room => room.id)

    if (completedIds.length === 0) {
        return { updatedIds: [] as string[] }
    }

    const { error: updateError } = await supabase
        .from('match_rooms')
        .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
        .in('id', completedIds)

    if (updateError) {
        console.error('Update match room status error:', updateError)
        return { updatedIds: [] as string[] }
    }

    return { updatedIds: completedIds }
}
