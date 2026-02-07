"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Community = {
    id: string
    name: string
    description: string | null
    sport: string
    logo_url: string | null
    cover_url?: string | null
    city?: string | null
    privacy?: 'public' | 'private'
    members_count?: number
    role?: string
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
    const privacy = formData.get('privacy') as string || 'public'

    if (!name) {
        return { error: "Name is required" }
    }

    if (!city) {
        return { error: "City is required" }
    }

    try {
        // Create the community
        const { data: community, error: createError } = await supabase
            .from('communities')
            .insert({
                name,
                description,
                sport,
                city,
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

