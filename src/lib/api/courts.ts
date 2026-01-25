import { createClient } from '@/lib/supabase/server'
import { Court } from '@/types'

export interface CourtFilters {
    type?: 'All' | 'Rubber' | 'Wooden' | 'Synthetic'
    isActive?: boolean
}

export interface CreateCourtData {
    name: string
    description?: string
    image_url?: string
    type: 'Rubber' | 'Wooden' | 'Synthetic'
}

/**
 * Get all courts with optional filtering
 */
export async function getCourts(filters?: CourtFilters) {
    const supabase = await createClient()

    let query = supabase
        .from('courts')
        .select('*')
        .order('created_at', { ascending: false })

    if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching courts:', error)
        return []
    }

    // Client-side filtering for type if needed
    let filteredData = data || []
    if (filters?.type && filters.type !== 'All') {
        // Note: You might want to add a 'type' column to courts table
        // For now, returning all courts
    }

    return filteredData
}

/**
 * Get a single court by ID
 */
export async function getCourtById(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching court:', error)
        return null
    }

    return data
}

/**
 * Create a new court (admin only)
 */
export async function createCourt(courtData: CreateCourtData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
        .from('courts')
        .insert({
            name: courtData.name,
            description: courtData.description,
            image_url: courtData.image_url,
            created_by: user.id,
            is_active: true,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating court:', error)
        return { error: error.message }
    }

    return { data, success: true }
}

/**
 * Update a court (admin only)
 */
export async function updateCourt(id: string, updates: Partial<CreateCourtData>) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('courts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating court:', error)
        return { error: error.message }
    }

    return { data, success: true }
}

/**
 * Delete a court (admin only)
 */
export async function deleteCourt(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('courts').delete().eq('id', id)

    if (error) {
        console.error('Error deleting court:', error)
        return { error: error.message }
    }

    return { success: true }
}

/**
 * Toggle court active status (admin only)
 */
export async function toggleCourtStatus(id: string, isActive: boolean) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('courts')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error toggling court status:', error)
        return { error: error.message }
    }

    return { data, success: true }
}
