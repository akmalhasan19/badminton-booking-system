"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { updateCompletedMatchRooms } from "@/lib/match-rooms/status"

const COMMUNITY_TIMEZONES = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'] as const
type CommunityTimeZone = typeof COMMUNITY_TIMEZONES[number]

export type Community = {
    id: string
    name: string
    description: string | null
    sport: string
    logo_url: string | null
    image_url?: string | null // Alias for logo_url for consistency in chat
    cover_url?: string | null
    city?: string | null
    timezone?: CommunityTimeZone | null
    privacy?: 'public' | 'private'
    members_count?: number
    role?: string
}

const TIMEZONE_OFFSETS: Record<CommunityTimeZone, string> = {
    'Asia/Jakarta': '+07:00',
    'Asia/Makassar': '+08:00',
    'Asia/Jayapura': '+09:00'
}

const WITA_CITY_KEYWORDS = [
    'bali', 'denpasar',
    'lombok', 'mataram', 'bima', 'ntb',
    'ntt', 'kupang', 'ende', 'labuan bajo',
    'sulawesi', 'makassar', 'manado', 'kendari', 'palu', 'gorontalo', 'mamuju',
    'kalimantan timur', 'kaltim', 'samarinda', 'balikpapan', 'bontang',
    'kalimantan selatan', 'kalsel', 'banjarmasin', 'banjarbaru',
    'kalimantan utara', 'kaltara', 'tarakan', 'nunukan'
]

const WIT_CITY_KEYWORDS = [
    'papua', 'papua barat', 'papua selatan', 'papua pegunungan', 'papua tengah',
    'jayapura', 'timika', 'merauke', 'biak', 'nabire', 'wamena',
    'sorong', 'manokwari', 'fakfak', 'raja ampat',
    'maluku', 'maluku utara', 'ambon', 'ternate', 'tidore'
]

function resolveTimeZoneFromCity(city?: string | null): CommunityTimeZone | null {
    if (!city) return null
    const normalized = city.toLowerCase()

    if (WIT_CITY_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
        return 'Asia/Jayapura'
    }

    if (WITA_CITY_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
        return 'Asia/Makassar'
    }

    return null
}

function resolveTimeZoneFromCoordinates(longitude?: number | null): CommunityTimeZone | null {
    if (typeof longitude !== 'number' || Number.isNaN(longitude)) return null

    // Rough Indonesia timezone boundaries by longitude:
    // WIB: < 112.5E, WITA: 112.5E - 127.5E, WIT: >= 127.5E
    if (longitude >= 127.5) return 'Asia/Jayapura'
    if (longitude >= 112.5) return 'Asia/Makassar'
    return 'Asia/Jakarta'
}

function getCommunityTimeZone(input: { city?: string | null; longitude?: number | null }): CommunityTimeZone {
    return (
        resolveTimeZoneFromCoordinates(input.longitude) ||
        resolveTimeZoneFromCity(input.city) ||
        'Asia/Jakarta'
    )
}

function isCommunityTimeZone(value: string | null | undefined): value is CommunityTimeZone {
    if (!value) return false
    return COMMUNITY_TIMEZONES.includes(value as CommunityTimeZone)
}

function getStartOfTodayISO(timeZone: CommunityTimeZone) {
    const today = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date())

    return `${today}T00:00:00${TIMEZONE_OFFSETS[timeZone]}`
}

export async function getCommunityById(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    try {
        // Fetch community details
        const { data: community, error } = await supabase
            .from('communities')
            .select(`
                id,
                name,
                description,
                sport,
                logo_url,
                cover_url,
                city,
                timezone,
                privacy,
                created_by
            `)
            .eq('id', id)
            .single()

        if (error) throw error

        // Get member count
        const { count: membersCount } = await supabase
            .from('community_members')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', id)

        // Get user's role if logged in
        let userRole = null
        if (user) {
            const { data: memberData } = await supabase
                .from('community_members')
                .select('role')
                .eq('community_id', id)
                .eq('user_id', user.id)
                .single()

            if (memberData) {
                userRole = memberData.role
            }
        }

        return {
            data: {
                ...community,
                image_url: community.logo_url, // Map logo_url to image_url
                members_count: membersCount || 0,
                role: userRole
            } as Community
        }
    } catch (error) {
        console.error("Error fetching community:", error)
        return { error: "Failed to fetch community" }
    }
}

export async function getCommunitiesForUser(role?: 'admin' | 'member') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        let query = supabase
            .from('community_members')
            .select(`
                role,
                community:communities (
                    id,
                    name,
                    description,
                    sport,
                    logo_url,
                    cover_url
                )
            `)
            .eq('user_id', user.id)

        if (role) {
            query = query.eq('role', role)
        }

        const { data, error } = await query

        if (error) throw error

        // Transform data to flat structure
        const communities = data.map((item: any) => ({
            ...item.community,
            role: item.role
        })) as Community[]

        // Fetch member counts for these communities
        // Note: In a real app with many communities, this might need optimization
        // For now, we'll just do it in a loop or a separate aggregate query
        // But since we only show user's communities, the list is small
        for (const community of communities) {
            const { count } = await supabase
                .from('community_members')
                .select('*', { count: 'exact', head: true })
                .eq('community_id', community.id)

            community.members_count = count || 0
        }

        return { data: communities }
    } catch (error) {
        console.error("Error fetching communities:", error)
        return { error: "Failed to fetch communities" }
    }
}

export async function createCommunity(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const sport = formData.get('sport') as string || 'Badminton'
    const city = formData.get('city') as string
    const timezoneInput = formData.get('timezone') as string | null
    const privacy = formData.get('privacy') as string || 'public'

    if (!name) {
        return { error: "Name is required" }
    }

    if (!city) {
        return { error: "City is required" }
    }

    if (timezoneInput && !isCommunityTimeZone(timezoneInput)) {
        return { error: "Invalid timezone" }
    }

    const timezone = isCommunityTimeZone(timezoneInput)
        ? timezoneInput
        : getCommunityTimeZone({ city })

    try {
        // Create the community
        const { data: community, error: createError } = await supabase
            .from('communities')
            .insert({
                name,
                description,
                sport,
                city,
                timezone,
                privacy,
                created_by: user.id
            })
            .select()
            .single()

        if (createError) {
            console.error("Error creating community:", createError)
            throw createError
        }

        // Add creator as admin member (fallback if trigger doesn't work)
        const { error: memberError } = await supabase
            .from('community_members')
            .upsert({
                community_id: community.id,
                user_id: user.id,
                role: 'admin'
            }, {
                onConflict: 'community_id,user_id'
            })

        if (memberError) {
            console.error("Error adding member:", memberError)
            // Don't throw here, community was created successfully
        }

        revalidatePath('/communities')
        return { data: community }
    } catch (error) {
        console.error("Error creating community:", error)
        return { error: "Failed to create community" }
    }
}

export async function updateCommunityCover(communityId: string, coverUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        // Verify user is admin of the community
        const { data: memberData } = await supabase
            .from('community_members')
            .select('role')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .single()

        if (!memberData || memberData.role !== 'admin') {
            return { error: "Not authorized to update this community" }
        }

        const { error } = await supabase
            .from('communities')
            .update({ cover_url: coverUrl })
            .eq('id', communityId)

        if (error) throw error

        revalidatePath(`/communities/${communityId}`)
        return { success: true }
    } catch (error) {
        console.error("Error updating community cover:", error)
        return { error: "Failed to update community cover" }
    }
}

export async function updateCommunityLogo(communityId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    const file = formData.get('file') as File
    if (!file) {
        return { error: "No file provided" }
    }

    try {
        // Verify user is admin of the community
        const { data: membership, error: membershipError } = await supabase
            .from('community_members')
            .select('role')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .single()

        if (membershipError || !membership || membership.role !== 'admin') {
            return { error: "Unauthorized: You must be an admin to update the logo" }
        }

        // 1. Upload file to storage
        const fileExt = 'webp'; // We are converting to webp on client
        const filePath = `${communityId}/profile/logo-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('communities')
            .upload(filePath, file, {
                contentType: 'image/webp',
                upsert: true
            })

        if (uploadError) throw uploadError

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('communities')
            .getPublicUrl(filePath)

        // 3. Update community record
        const { error: updateError } = await supabase
            .from('communities')
            .update({ logo_url: publicUrl })
            .eq('id', communityId)

        if (updateError) throw updateError

        revalidatePath(`/communities/${communityId}`)
        return { success: true, logo_url: publicUrl }
    } catch (error) {
        console.error("Error updating community logo:", error)
        return { error: "Failed to update community logo" }
    }
}

export async function joinCommunity(communityId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Perlu login untuk bergabung ke komunitas" }
    }

    try {
        const { error } = await supabase
            .from('community_members')
            .insert({
                community_id: communityId,
                user_id: user.id,
                role: 'member'
            })

        if (error) {
            if (error.code === '23505') { // Unique violation
                return { error: "Anda sudah menjadi anggota komunitas ini" }
            }
            throw error
        }

        revalidatePath(`/communities/${communityId}`)
        return { success: true }
    } catch (error) {
        console.error("Error joining community:", error)
        return { error: "Gagal bergabung ke komunitas" }
    }
}

export async function leaveCommunity(communityId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Perlu login untuk aksi ini" }
    }

    try {
        // Prevent leaving if admin and only admin? 
        // For now simple leave.

        const { error } = await supabase
            .from('community_members')
            .delete()
            .eq('community_id', communityId)
            .eq('user_id', user.id)

        if (error) throw error

        revalidatePath(`/communities/${communityId}`)
        return { success: true }
    } catch (error) {
        console.error("Error leaving community:", error)
        return { error: "Gagal keluar dari komunitas" }
    }
}

export async function updateCommunityDetails(communityId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const city = formData.get('city') as string
    const timezoneInput = formData.get('timezone') as string | null

    if (!name || !city) {
        return { error: "Name and City are required" }
    }

    if (timezoneInput && !isCommunityTimeZone(timezoneInput)) {
        return { error: "Invalid timezone" }
    }

    const timezone = isCommunityTimeZone(timezoneInput)
        ? timezoneInput
        : getCommunityTimeZone({ city })

    try {
        // Verify user is admin
        const { data: memberData } = await supabase
            .from('community_members')
            .select('role')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .single()

        if (!memberData || memberData.role !== 'admin') {
            return { error: "Not authorized to update community details" }
        }

        const { error } = await supabase
            .from('communities')
            .update({
                name,
                description,
                city,
                timezone,
                updated_at: new Date().toISOString()
            })
            .eq('id', communityId)

        if (error) throw error

        revalidatePath(`/communities/${communityId}`)
        return { success: true }
    } catch (error) {
        console.error("Error updating community details:", error)
        return { error: "Failed to update community details" }
    }
}

export type CommunityMember = {
    id: string
    user_id: string
    role: 'admin' | 'member'
    status: 'approved' | 'pending'
    joined_at: string
    profile: {
        full_name: string
        avatar_url: string | null
        email: string
    }
}

export async function getCommunityMembers(communityId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        // Fetch members first
        const { data: members, error: membersError } = await supabase
            .from('community_members')
            .select('*')
            .eq('community_id', communityId)
            .order('role', { ascending: true }) // admins first
            .order('joined_at', { ascending: false })

        if (membersError) throw membersError

        if (!members || members.length === 0) {
            return { data: [] }
        }

        const userIds = members.map(m => m.user_id)

        // Fetch profiles for these members
        const { data: profiles, error: profilesError } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, email')
            .in('id', userIds)

        if (profilesError) throw profilesError

        // Combine data
        const membersWithProfile = members.map(member => {
            const profile = profiles?.find(p => p.id === member.user_id)
            return {
                ...member,
                profile: profile || { full_name: 'Unknown User', avatar_url: null, email: '' }
            }
        })

        return { data: membersWithProfile as CommunityMember[] }
    } catch (error) {
        console.error("Error fetching members:", error)
        return { error: "Failed to fetch members" }
    }
}

export async function updateMemberRole(communityId: string, memberId: string, newRole: 'admin' | 'member') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        // verify actor is admin
        const { data: actorMember } = await supabase
            .from('community_members')
            .select('role')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .single()

        if (!actorMember || actorMember.role !== 'admin') {
            return { error: "Unauthorized" }
        }

        const { error } = await supabase
            .from('community_members')
            .update({ role: newRole })
            .eq('community_id', communityId) // extra safety
            .eq('user_id', memberId) // assuming memberId passed is the user_id, NOT the row id? 
        // The function signature says memberId. Let's assume it's user_id for consistency with other calls.
        // Actually, passing the user_id is safer/cleaner if we have it.

        if (error) throw error

        revalidatePath(`/communities/${communityId}`)
        return { success: true }
    } catch (error) {
        console.error("Error updating member role:", error)
        return { error: "Failed to update role" }
    }
}

export async function removeMember(communityId: string, memberUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        // verify actor is admin
        const { data: actorMember } = await supabase
            .from('community_members')
            .select('role')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .single()

        if (!actorMember || actorMember.role !== 'admin') {
            return { error: "Unauthorized" }
        }

        // Prevent removing yourself if you are the last admin? 
        // Or specific logic: can't remove self via this function, use leaveCommunity.
        if (user.id === memberUserId) {
            return { error: "Use 'Leave Community' to remove yourself." }
        }

        const { error } = await supabase
            .from('community_members')
            .delete()
            .eq('community_id', communityId)
            .eq('user_id', memberUserId)

        if (error) throw error

        revalidatePath(`/communities/${communityId}`)
        return { success: true }
    } catch (error) {
        console.error("Error removing member:", error)
        return { error: "Failed to remove member" }
    }
}

export type CommunityActivity = {
    id: string
    title: string
    match_date: string
    start_time: string | null
    end_time: string | null
    price_per_person: number | null
    mode: 'RANKED' | 'CASUAL' | 'DRILLING'
    participant_count: number
    max_participants: number
    users: {
        avatar_url: string | null
        full_name: string | null
    }[]
}

export type CommunityActivitiesResult = {
    data: CommunityActivity[]
    count: number
    totalCount?: number
    error?: string
}

export async function getCommunityActivities(communityId: string): Promise<CommunityActivitiesResult> {
    const supabase = await createClient()

    try {
        await updateCompletedMatchRooms({ supabase, communityId })

        // Resolve timezone per community (fallback to Asia/Jakarta)
        const { data: community, error: communityError } = await supabase
            .from('communities')
            .select('city, longitude, timezone')
            .eq('id', communityId)
            .single()

        if (communityError) throw communityError

        const timeZone = isCommunityTimeZone(community?.timezone)
            ? community.timezone
            : getCommunityTimeZone({
                city: community?.city,
                longitude: community?.longitude
            })
        const startOfToday = getStartOfTodayISO(timeZone)

        const roomsQuery = supabase
            .from('match_rooms')
            .select(`
                id,
                title,
                match_date,
                start_time,
                end_time,
                price_per_person,
                mode,
                host_user_id,
                max_participants
            `)
            .eq('community_id', communityId)
            .eq('status', 'OPEN')
            .gte('match_date', startOfToday)
            //.gte('match_date', new Date().toISOString()) // Only future events?
            .order('match_date', { ascending: true })

        const totalCountQuery = supabase
            .from('match_rooms')
            .select('id', { count: 'exact', head: true })
            .eq('community_id', communityId)

        const [
            { data: rooms, error: roomsError },
            { count: totalCount, error: totalCountError }
        ] = await Promise.all([roomsQuery, totalCountQuery])

        if (roomsError) throw roomsError

        if (totalCountError) {
            console.error("Error fetching community activities total count:", totalCountError)
        }

        if (!rooms || rooms.length === 0) {
            return { data: [], count: 0, totalCount: totalCount || 0 }
        }

        // For each room, get participant count and some avatars (parallelized)
        const activities: CommunityActivity[] = await Promise.all(
            rooms.map(async (room) => {
                const { data: participants, count } = await supabase
                    .from('room_participants')
                    .select(
                        `
                        user_id,
                        users:users (
                            avatar_url,
                            full_name
                        )
                    `,
                        { count: 'exact' }
                    )
                    .eq('room_id', room.id)
                    .limit(3) // Get first 3 for avatars

                const users = participants?.map((p: any) => ({
                    avatar_url: p.users?.avatar_url,
                    full_name: p.users?.full_name
                })) || []

                return {
                    id: room.id,
                    title: room.title,
                    match_date: room.match_date,
                    start_time: room.start_time,
                    end_time: room.end_time,
                    price_per_person: room.price_per_person,
                    mode: room.mode,
                    participant_count: count || 0,
                    max_participants: room.max_participants ?? 8,
                    users: users
                }
            })
        )

        return { data: activities, count: activities.length, totalCount: totalCount || activities.length }

    } catch (error) {
        console.error("Error fetching community activities:", error)
        return { data: [], count: 0, error: "Failed to fetch activities" }
    }
}

export type CommunityReview = {
    id: string
    rating: number
    comment: string | null
    tags: string[]
    created_at: string
    user: {
        id: string
        full_name: string
        avatar_url: string | null
    }
}

export type CommunityStats = {
    overallRating: number
    totalReviews: number
    criteria: { name: string; rating: number; percentage: number; color: string }[]
    categories: { name: string; rating: number; count: number; isActive: boolean }[]
}

export async function getCommunityReviews(
    communityId: string,
    options: {
        limit?: number;
        offset?: number;
        sortBy?: 'newest' | 'highest' | 'with_photo'
    } = {}
) {
    const supabase = await createClient()
    const { limit = 10, offset = 0, sortBy = 'newest' } = options

    try {
        let query = supabase
            .from('community_reviews')
            .select(`
                id,
                rating,
                comment,
                tags,
                created_at,
                user:users (
                    id,
                    full_name,
                    avatar_url
                )
            `, { count: 'exact' })
            .eq('community_id', communityId)

        if (sortBy === 'highest') {
            query = query.order('rating', { ascending: false })
        } else {
            query = query.order('created_at', { ascending: false })
        }

        query = query.range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) throw error

        const reviews = data.map((review: any) => ({
            id: review.id,
            rating: Number(review.rating),
            comment: review.comment,
            tags: review.tags || [],
            created_at: review.created_at,
            user: {
                id: review.user?.id,
                full_name: review.user?.full_name || 'Anonymous',
                avatar_url: review.user?.avatar_url
            }
        })) as CommunityReview[]

        return { data: reviews, count: count || 0 }
    } catch (error) {
        console.error("Error fetching community reviews:", error)
        return { data: [], count: 0, error: "Failed to fetch reviews" }
    }
}

export async function createCommunityReview(communityId: string, rating: number, comment: string, tags: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "You must be logged in to review." }
    }

    if (rating < 1 || rating > 5) {
        return { error: "Rating must be between 1 and 5." }
    }

    try {
        const { data: member, error: memberError } = await supabase
            .from('community_members')
            .select('status')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .single()

        if (memberError || !member || member.status !== 'approved') {
            return { error: "Only approved members can review this community." }
        }

        const { data: review, error: insertError } = await supabase
            .from('community_reviews')
            .insert({
                community_id: communityId,
                reviewer_user_id: user.id,
                rating,
                comment,
                tags
            })
            .select()
            .single()

        if (insertError) {
            if (insertError.code === '23505') {
                return { error: "You have already reviewed this community." }
            }
            throw insertError
        }

        revalidatePath(`/communities/${communityId}`)
        revalidatePath(`/communities/${communityId}/reviews`)
        return { success: true, data: review }
    } catch (error) {
        console.error("Error creating community review:", error)
        return { error: "Failed to submit review." }
    }
}

export async function getCommunityStats(communityId: string) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('community_reviews')
            .select('rating')
            .eq('community_id', communityId)

        if (error) throw error

        const totalReviews = data.length
        const sumRating = data.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0)
        const overallRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 0

        const stats: CommunityStats = {
            overallRating,
            totalReviews,
            categories: [
                { name: "Main Bareng", rating: overallRating, count: Math.floor(totalReviews * 0.8), isActive: true },
                { name: "Sparring", rating: overallRating, count: Math.floor(totalReviews * 0.2), isActive: false }
            ],
            criteria: [
                { name: "Ketepatan Waktu", rating: Math.max(overallRating - 0.1, 1), percentage: 90, color: "bg-neo-blue" },
                { name: "Sportifitas", rating: Math.min(overallRating + 0.1, 5), percentage: 95, color: "bg-secondary" },
                { name: "Komunikasi", rating: overallRating, percentage: 92, color: "bg-green-500" },
                { name: "Pembagian Waktu", rating: overallRating, percentage: 88, color: "bg-primary" }
            ]
        }

        return { data: stats }

    } catch (error) {
        console.error("Error fetching community stats:", error)
        return {
            data: {
                overallRating: 0,
                totalReviews: 0,
                categories: [],
                criteria: []
            },
            error: "Failed to fetch stats" // consistent with other actions
        }
    }
}
