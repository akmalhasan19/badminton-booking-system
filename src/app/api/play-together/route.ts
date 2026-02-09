import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type PlayTogetherRequest = {
    communityId: string
    title: string
    description?: string | null
    matchDate: string
    startTime: string
    endTime: string
    venueName: string
    venueAddress?: string | null
    pricePerPerson?: number | string | null
    city?: string | null
    mode?: string
    gameFormat: string
    skillPreference?: string
    levelRequirement?: string
    maxParticipants: number
    hostCounts?: boolean
    isPublic?: boolean
    coachingSession?: boolean
    genderPreference?: string
    hostApprovalRequired?: boolean
}

const ALLOWED_MODES = new Set(['CASUAL', 'RANKED', 'DRILLING'])
const ALLOWED_GAME_FORMATS = new Set(['SINGLE', 'DOUBLE', 'MIXED'])
const ALLOWED_LEVEL_REQUIREMENTS = new Set(['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'])
const ALLOWED_GENDER_PREFERENCES = new Set(['ANY', 'MALE', 'FEMALE'])

function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function isValidDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(date.getTime())
}

function isValidTime(value: string) {
    return /^\d{2}:\d{2}(:\d{2})?$/.test(value)
}

function normalizeUpper(value?: string | null) {
    return (value || '').trim().toUpperCase()
}

function toNumber(value: number | string | null | undefined) {
    if (typeof value === 'number') return value
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
    }
    return null
}

export async function POST(request: Request) {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let payload: PlayTogetherRequest
    try {
        payload = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const communityId = payload.communityId?.trim()
    if (!communityId || !isUuid(communityId)) {
        return NextResponse.json({ error: 'communityId is required and must be a UUID' }, { status: 400 })
    }

    const title = payload.title?.trim()
    if (!title) {
        return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    if (!payload.matchDate || !isValidDate(payload.matchDate)) {
        return NextResponse.json({ error: 'matchDate must be in YYYY-MM-DD format' }, { status: 400 })
    }

    if (!payload.startTime || !isValidTime(payload.startTime)) {
        return NextResponse.json({ error: 'startTime must be in HH:MM format' }, { status: 400 })
    }

    if (!payload.endTime || !isValidTime(payload.endTime)) {
        return NextResponse.json({ error: 'endTime must be in HH:MM format' }, { status: 400 })
    }

    const venueName = payload.venueName?.trim()
    if (!venueName) {
        return NextResponse.json({ error: 'venueName is required' }, { status: 400 })
    }

    const maxParticipants = Number(payload.maxParticipants)
    if (!Number.isFinite(maxParticipants) || maxParticipants <= 0) {
        return NextResponse.json({ error: 'maxParticipants must be a positive number' }, { status: 400 })
    }

    const mode = normalizeUpper(payload.mode) || 'CASUAL'
    if (!ALLOWED_MODES.has(mode)) {
        return NextResponse.json({ error: 'mode is invalid' }, { status: 400 })
    }

    const gameFormat = normalizeUpper(payload.gameFormat)
    if (!ALLOWED_GAME_FORMATS.has(gameFormat)) {
        return NextResponse.json({ error: 'gameFormat is invalid' }, { status: 400 })
    }

    const levelRequirement = normalizeUpper(payload.levelRequirement || payload.skillPreference || 'ALL')
    if (!ALLOWED_LEVEL_REQUIREMENTS.has(levelRequirement)) {
        return NextResponse.json({ error: 'skillPreference/levelRequirement is invalid' }, { status: 400 })
    }

    const genderPreference = normalizeUpper(payload.genderPreference || 'ANY')
    if (!ALLOWED_GENDER_PREFERENCES.has(genderPreference)) {
        return NextResponse.json({ error: 'genderPreference is invalid' }, { status: 400 })
    }

    const pricePerPerson = toNumber(payload.pricePerPerson)
    if (pricePerPerson !== null && pricePerPerson < 0) {
        return NextResponse.json({ error: 'pricePerPerson must be >= 0' }, { status: 400 })
    }

    const { data: roomId, error } = await supabase.rpc('create_play_together_activity', {
        p_community_id: communityId,
        p_title: title,
        p_description: payload.description || null,
        p_match_date: payload.matchDate,
        p_start_time: payload.startTime,
        p_end_time: payload.endTime,
        p_court_name: venueName,
        p_venue_address: payload.venueAddress || null,
        p_price_per_person: pricePerPerson ?? 0,
        p_city: payload.city || null,
        p_mode: mode,
        p_level_requirement: levelRequirement,
        p_game_format: gameFormat,
        p_max_participants: maxParticipants,
        p_host_counts: payload.hostCounts ?? true,
        p_is_public: payload.isPublic ?? true,
        p_coaching_session: payload.coachingSession ?? false,
        p_gender_preference: genderPreference,
        p_host_approval_required: payload.hostApprovalRequired ?? false
    })

    if (error) {
        const message = error.message || 'Failed to create activity'
        if (message.toLowerCase().includes('conflict')) {
            return NextResponse.json({ error: message }, { status: 409 })
        }
        if (message.toLowerCase().includes('not allowed')) {
            return NextResponse.json({ error: message }, { status: 403 })
        }
        return NextResponse.json({ error: message }, { status: 400 })
    }

    revalidatePath(`/communities/${communityId}`)
    return NextResponse.json({ success: true, roomId })
}
