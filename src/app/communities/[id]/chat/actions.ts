"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type CommunityMessage = {
    id: string
    community_id: string
    user_id: string
    content: string
    image_url: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
    user?: {
        id: string
        full_name: string
        avatar_url: string | null
    }
    reactions?: MessageReaction[]
    is_deleted: boolean
}

export type MessageReaction = {
    id: string
    message_id: string
    user_id: string
    emoji: string
    user?: {
        full_name: string
    }
}

export type DMConversation = {
    id: string
    community_id: string
    user_a_id: string
    user_b_id: string
    created_at: string
    updated_at: string
    other_user?: {
        id: string
        full_name: string
        avatar_url: string | null
    }
    last_message?: string
}

export type DMMessage = {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    image_url: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
    sender?: {
        full_name: string
        avatar_url: string | null
    }
    is_deleted: boolean
}

// Community Chat Actions

export async function getCommunityMessages(
    communityId: string,
    limit: number = 30,
    cursor?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        // Check if user is community member
        const { data: memberCheck } = await supabase
            .from("community_members")
            .select("id")
            .eq("community_id", communityId)
            .eq("user_id", user.id)
            .single()

        if (!memberCheck) {
            return { error: "You are not a member of this community" }
        }

        let query = supabase
            .from("community_messages")
            .select(`
                id,
                community_id,
                user_id,
                content,
                image_url,
                created_at,
                updated_at,
                deleted_at,
                users:user_id (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq("community_id", communityId)
            .order("created_at", { ascending: false })
            .limit(limit + 1)

        if (cursor) {
            query = query.lt("created_at", cursor)
        }

        const { data: messages, error } = await query

        if (error) throw error

        const hasMore = messages.length > limit
        const paginatedMessages = messages.slice(0, limit)
        const nextCursor = hasMore ? paginatedMessages[paginatedMessages.length - 1]?.created_at : null

        // Get reactions for messages
        const messageIds = paginatedMessages.map(m => m.id)
        const { data: reactions } = await supabase
            .from("message_reactions")
            .select(`
                id,
                message_id,
                user_id,
                emoji,
                users:user_id (
                    full_name
                )
            `)
            .in("message_id", messageIds)

        const reactionsMap = new Map<string, MessageReaction[]>()
        reactions?.forEach(r => {
            if (!reactionsMap.has(r.message_id)) {
                reactionsMap.set(r.message_id, [])
            }
            reactionsMap.get(r.message_id)?.push({
                id: r.id,
                message_id: r.message_id,
                user_id: r.user_id,
                emoji: r.emoji,
                user: Array.isArray(r.users) ? r.users[0] : r.users
            })
        })

        const formattedMessages: CommunityMessage[] = paginatedMessages.map(m => ({
            id: m.id,
            community_id: m.community_id,
            user_id: m.user_id,
            content: m.content,
            image_url: m.image_url,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            user: Array.isArray(m.users) ? m.users[0] : m.users,
            reactions: reactionsMap.get(m.id) || [],
            is_deleted: !!m.deleted_at
        }))

        return { data: formattedMessages, nextCursor, hasMore }
    } catch (error) {
        console.error("Error fetching community messages:", error)
        return { error: "Failed to fetch messages" }
    }
}

export async function sendCommunityMessage(
    communityId: string,
    content: string,
    imageUrl?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        // Check if user is community member
        const { data: memberCheck } = await supabase
            .from("community_members")
            .select("id")
            .eq("community_id", communityId)
            .eq("user_id", user.id)
            .single()

        if (!memberCheck) {
            return { error: "You are not a member of this community" }
        }

        if (!content.trim() && !imageUrl) {
            return { error: "Message content or image is required" }
        }

        const { data, error } = await supabase
            .from("community_messages")
            .insert({
                community_id: communityId,
                user_id: user.id,
                content: content.trim(),
                image_url: imageUrl || null
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath(`/communities/${communityId}/chat`)
        return { data }
    } catch (error) {
        console.error("Error sending message:", error)
        return { error: "Failed to send message" }
    }
}

export async function editCommunityMessage(
    communityId: string,
    messageId: string,
    newContent: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        // Get message to check permissions
        const { data: message } = await supabase
            .from("community_messages")
            .select("user_id")
            .eq("id", messageId)
            .single()

        if (!message) {
            return { error: "Message not found" }
        }

        // Check if user is admin (can edit any) or owner (can edit own)
        const { data: memberCheck } = await supabase
            .from("community_members")
            .select("role")
            .eq("community_id", communityId)
            .eq("user_id", user.id)
            .single()

        const isAdmin = memberCheck?.role === "admin"
        const isOwner = message.user_id === user.id

        if (!isAdmin && !isOwner) {
            return { error: "You don't have permission to edit this message" }
        }

        const { data, error } = await supabase
            .from("community_messages")
            .update({ content: newContent.trim() })
            .eq("id", messageId)
            .select()
            .single()

        if (error) throw error

        revalidatePath(`/communities/${communityId}/chat`)
        return { data }
    } catch (error) {
        console.error("Error editing message:", error)
        return { error: "Failed to edit message" }
    }
}

export async function deleteCommunityMessage(
    communityId: string,
    messageId: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        // Get message to check permissions
        const { data: message } = await supabase
            .from("community_messages")
            .select("user_id")
            .eq("id", messageId)
            .single()

        if (!message) {
            return { error: "Message not found" }
        }

        // Check if user is admin (can delete any) or owner (can delete own)
        const { data: memberCheck } = await supabase
            .from("community_members")
            .select("role")
            .eq("community_id", communityId)
            .eq("user_id", user.id)
            .single()

        const isAdmin = memberCheck?.role === "admin"
        const isOwner = message.user_id === user.id

        if (!isAdmin && !isOwner) {
            return { error: "You don't have permission to delete this message" }
        }

        // Soft delete
        const { data, error } = await supabase
            .from("community_messages")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", messageId)
            .select()
            .single()

        if (error) throw error

        revalidatePath(`/communities/${communityId}/chat`)
        return { data }
    } catch (error) {
        console.error("Error deleting message:", error)
        return { error: "Failed to delete message" }
    }
}

export async function addReaction(
    messageId: string,
    emoji: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        const { data, error } = await supabase
            .from("message_reactions")
            .insert({
                message_id: messageId,
                user_id: user.id,
                emoji
            })
            .select()
            .single()

        if (error) {
            if (error.code === "23505") {
                // Already exists, ignore
                return { data: null }
            }
            throw error
        }

        return { data }
    } catch (error) {
        console.error("Error adding reaction:", error)
        return { error: "Failed to add reaction" }
    }
}

export async function removeReaction(
    messageId: string,
    emoji: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        const { error } = await supabase
            .from("message_reactions")
            .delete()
            .eq("message_id", messageId)
            .eq("user_id", user.id)
            .eq("emoji", emoji)

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error("Error removing reaction:", error)
        return { error: "Failed to remove reaction" }
    }
}

// DM Chat Actions

export async function getDMConversations(communityId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        const { data: conversations, error } = await supabase
            .from("dm_conversations")
            .select(`
                id,
                community_id,
                user_a_id,
                user_b_id,
                created_at,
                updated_at
            `)
            .eq("community_id", communityId)
            .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
            .order("updated_at", { ascending: false })

        if (error) throw error

        // Get other user info for each conversation
        const otherUserIds = conversations?.flatMap(c => [
            c.user_a_id === user.id ? c.user_b_id : c.user_a_id
        ]) || []

        const { data: users } = await supabase
            .from("users")
            .select("id, full_name, avatar_url")
            .in("id", otherUserIds)

        const usersMap = new Map(users?.map(u => [u.id, u]) || [])

        // Get last message for each conversation
        const { data: messages } = await supabase
            .from("dm_messages")
            .select("conversation_id, content, deleted_at")
            .in("conversation_id", conversations?.map(c => c.id) || [])
            .order("created_at", { ascending: false })

        const messagesMap = new Map<string, string>()
        messages?.forEach(m => {
            if (!messagesMap.has(m.conversation_id)) {
                messagesMap.set(m.conversation_id, m.deleted_at ? "[deleted message]" : m.content)
            }
        })

        const formatted: DMConversation[] = conversations?.map(c => ({
            id: c.id,
            community_id: c.community_id,
            user_a_id: c.user_a_id,
            user_b_id: c.user_b_id,
            created_at: c.created_at,
            updated_at: c.updated_at,
            other_user: usersMap.get(c.user_a_id === user.id ? c.user_b_id : c.user_a_id),
            last_message: messagesMap.get(c.id)
        })) || []

        return { data: formatted }
    } catch (error) {
        console.error("Error fetching DM conversations:", error)
        return { error: "Failed to fetch conversations" }
    }
}

export async function getDMMessages(
    conversationId: string,
    limit: number = 30,
    cursor?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        let query = supabase
            .from("dm_messages")
            .select(`
                id,
                conversation_id,
                sender_id,
                content,
                image_url,
                created_at,
                updated_at,
                deleted_at,
                users:sender_id (
                    full_name,
                    avatar_url
                )
            `)
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false })
            .limit(limit + 1)

        if (cursor) {
            query = query.lt("created_at", cursor)
        }

        const { data: messages, error } = await query

        if (error) throw error

        const hasMore = messages.length > limit
        const paginatedMessages = messages.slice(0, limit)
        const nextCursor = hasMore ? paginatedMessages[paginatedMessages.length - 1]?.created_at : null

        const formatted: DMMessage[] = paginatedMessages.map(m => ({
            id: m.id,
            conversation_id: m.conversation_id,
            sender_id: m.sender_id,
            content: m.content,
            image_url: m.image_url,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sender: Array.isArray(m.users) ? m.users[0] : m.users,
            is_deleted: !!m.deleted_at
        }))

        return { data: formatted, nextCursor, hasMore }
    } catch (error) {
        console.error("Error fetching DM messages:", error)
        return { error: "Failed to fetch messages" }
    }
}

export async function sendDMMessage(
    communityId: string,
    recipientId: string,
    content: string,
    imageUrl?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    if (!content.trim() && !imageUrl) {
        return { error: "Message content or image is required" }
    }

    try {
        // Get or create conversation
        const userAId = [user.id, recipientId].sort()[0]
        const userBId = [user.id, recipientId].sort()[1]

        let { data: conversation } = await supabase
            .from("dm_conversations")
            .select("id")
            .eq("community_id", communityId)
            .eq("user_a_id", userAId)
            .eq("user_b_id", userBId)
            .single()

        if (!conversation) {
            const { data: newConversation, error: createError } = await supabase
                .from("dm_conversations")
                .insert({
                    community_id: communityId,
                    user_a_id: userAId,
                    user_b_id: userBId
                })
                .select()
                .single()

            if (createError) throw createError
            conversation = newConversation
        }

        if (!conversation?.id) {
            return { error: "Failed to get or create conversation" }
        }

        // Send message
        const { data, error } = await supabase
            .from("dm_messages")
            .insert({
                conversation_id: conversation.id,
                sender_id: user.id,
                content: content.trim(),
                image_url: imageUrl || null
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath(`/communities/${communityId}/chat`)
        return { data, conversationId: conversation.id }
    } catch (error) {
        console.error("Error sending DM:", error)
        return { error: "Failed to send message" }
    }
}

export async function editDMMessage(
    conversationId: string,
    messageId: string,
    newContent: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        // Must be sender
        const { data: message } = await supabase
            .from("dm_messages")
            .select("sender_id")
            .eq("id", messageId)
            .single()

        if (!message || message.sender_id !== user.id) {
            return { error: "You can only edit your own messages" }
        }

        const { data, error } = await supabase
            .from("dm_messages")
            .update({ content: newContent.trim() })
            .eq("id", messageId)
            .select()
            .single()

        if (error) throw error

        return { data }
    } catch (error) {
        console.error("Error editing DM:", error)
        return { error: "Failed to edit message" }
    }
}

export async function deleteDMMessage(
    conversationId: string,
    messageId: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        // Must be sender
        const { data: message } = await supabase
            .from("dm_messages")
            .select("sender_id")
            .eq("id", messageId)
            .single()

        if (!message || message.sender_id !== user.id) {
            return { error: "You can only delete your own messages" }
        }

        const { data, error } = await supabase
            .from("dm_messages")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", messageId)
            .select()
            .single()

        if (error) throw error

        return { data }
    } catch (error) {
        console.error("Error deleting DM:", error)
        return { error: "Failed to delete message" }
    }
}

// Presence

export async function updateUserPresence(
    communityId: string,
    status: "online" | "away" | "offline" = "online"
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        const { data, error } = await supabase
            .from("user_presence")
            .upsert({
                user_id: user.id,
                community_id: communityId,
                status,
                last_seen_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error("Error updating presence:", error)
        return { error: "Failed to update presence" }
    }
}
