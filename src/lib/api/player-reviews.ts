'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'

export interface CreatePlayerReviewInput {
    roomId: string
    revieweeUserId: string
    rating: number
    comment?: string
}

export async function createPlayerReview(input: CreatePlayerReviewInput) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    if (input.revieweeUserId === user.id) {
        return { error: 'Tidak bisa mereview diri sendiri' }
    }

    if (!Number.isFinite(input.rating) || input.rating < 1 || input.rating > 5) {
        return { error: 'Rating harus di antara 1 sampai 5' }
    }

    const { error } = await supabase
        .from('player_reviews')
        .insert({
            room_id: input.roomId,
            reviewer_user_id: user.id,
            reviewee_user_id: input.revieweeUserId,
            rating: input.rating,
            comment: input.comment || null
        })

    if (error) {
        console.error('Create Player Review Error:', error)
        return { error: 'Gagal menyimpan review' }
    }

    return { success: true }
}

export async function getMyRoomReviews(roomId: string) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Unauthorized', data: [] as string[] }
    }

    const { data, error } = await supabase
        .from('player_reviews')
        .select('reviewee_user_id')
        .eq('room_id', roomId)
        .eq('reviewer_user_id', user.id)

    if (error) {
        console.error('Get My Room Reviews Error:', error)
        return { error: 'Gagal memuat review', data: [] as string[] }
    }

    return { data: (data || []).map(row => row.reviewee_user_id) }
}
