'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

export interface UserProfile {
    id: string
    email: string | null
    full_name: string | null
    avatar_url: string | null
    role: 'customer' | 'admin' | 'coach'
    created_at: string
    last_sign_in_at?: string | null
}

export interface UserFilters {
    search?: string
    role?: string
    page?: number
    limit?: number
}

export interface UserListResponse {
    users: UserProfile[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/**
 * Get all users with pagination, search, and filtering
 * Admin only
 */
export async function getAllUsers(filters: UserFilters = {}): Promise<UserListResponse | { error: string }> {
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Unauthorized: Please login' }
    }

    const supabase = createServiceClient()

    // Check if current user is admin
    const { data: currentUserData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentUserData?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    const page = filters.page || 1
    const limit = filters.limit || 10
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    // Note: We need to join with auth.users to get email, but Supabase JS client doesn't support joining auth schema easily.
    // For now, we'll fetch from public.users and we might technically miss emails if they aren't synced, 
    // but our triggers should handle that. 
    // Wait, public.users usually doesn't have email in some setups, let's check the schema.
    // Based on standard Supabase patterns, public.users might just have profile data.
    // Let's assume public.users has the necessary data or we fetch it.
    // Actually, looking at typical Supabase setups, auth.users has the email. 
    // However, direct access to auth.users is restricted. 
    // We'll query public.users. If email is missing there, we strictly rely on what's in public.users.

    let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (filters.role && filters.role !== 'all') {
        query = query.eq('role', filters.role)
    }

    if (filters.search) {
        const searchTerm = `%${filters.search}%`
        query = query.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
    }

    const { data, error, count } = await query.range(from, to)

    if (error) {
        console.error('Failed to fetch users:', error)
        return { error: 'Failed to fetch users' }
    }

    return {
        users: data as UserProfile[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
    }
}

/**
 * Update a user's role
 * Admin only
 */
export async function updateUserRole(userId: string, newRole: 'customer' | 'admin' | 'coach'): Promise<{ success: boolean; error?: string }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized: Please login' }
    }

    const supabase = createServiceClient()

    // Check if current user is admin
    const { data: currentUserData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentUserData?.role !== 'admin') {
        return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Validate role
    if (!['customer', 'admin', 'coach'].includes(newRole)) {
        return { success: false, error: 'Invalid role' }
    }

    // Update role
    const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        console.error('Failed to update user role:', error)
        return { success: false, error: 'Failed to update user role' }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

/**
 * Quick search for users (autocomplete)
 * Admin only
 */
export async function searchUsers(query: string): Promise<UserProfile[]> {
    const user = await getCurrentUser()

    if (!user) {
        return []
    }

    const supabase = createServiceClient()

    // Check if current user is admin
    const { data: currentUserData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentUserData?.role !== 'admin') {
        return []
    }

    if (!query || query.length < 2) {
        return []
    }

    const searchTerm = `%${query}%`
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(20)

    if (error) {
        console.error('Failed to search users:', error)
        return []
    }

    return data as UserProfile[]
}
