"use client"

import { useEffect, useState, useCallback } from "react"
import useRealtimeSubscription from "../../hooks/useRealtimeSubscription"
import { getCommunityMessages, type CommunityMessage } from "@/app/communities/[id]/chat/actions"
import { MessageList } from "@/components/community/MessageList"
import { MessageInput } from "@/components/community/MessageInput"
import { Loader2 } from "lucide-react"

interface ChatRoomProps {
    communityId: string
    currentUserId?: string
    isAdmin?: boolean
}

export function ChatRoom({ communityId, currentUserId, isAdmin }: ChatRoomProps) {
    const [messages, setMessages] = useState<CommunityMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [hasMore, setHasMore] = useState(true)
    const [cursor, setCursor] = useState<string | undefined>()

    // Load initial messages
    useEffect(() => {
        const loadMessages = async () => {
            setIsLoading(true)
            const result = await getCommunityMessages(communityId, 30)
            if (!result.error) {
                setMessages(result.data || [])
                setCursor(result.nextCursor)
                setHasMore(result.hasMore || false)
            }
            setIsLoading(false)
        }

        loadMessages()
    }, [communityId])

    // Load more messages
    const handleLoadMore = useCallback(async () => {
        if (!hasMore || !cursor) return

        setIsLoading(true)
        const result = await getCommunityMessages(communityId, 30, cursor)
        if (!result.error) {
            setMessages(prev => [...(result.data || []), ...prev])
            setCursor(result.nextCursor)
            setHasMore(result.hasMore || false)
        }
        setIsLoading(false)
    }, [communityId, cursor, hasMore])

    // Real-time subscription for new messages
    useRealtimeSubscription({
        table: "community_messages",
        filter: `community_id=eq.${communityId}`,
        event: "INSERT",
        onInsert: (newMessage: any) => {
            setMessages(prev => [...prev, {
                id: newMessage.id,
                community_id: newMessage.community_id,
                user_id: newMessage.user_id,
                content: newMessage.content,
                image_url: newMessage.image_url,
                created_at: newMessage.created_at,
                updated_at: newMessage.updated_at,
                deleted_at: newMessage.deleted_at,
                is_deleted: false
            }])
        },
        onUpdate: (updatedMessage: any) => {
            setMessages(prev => prev.map(m => 
                m.id === updatedMessage.id 
                    ? { ...m, ...updatedMessage, is_deleted: !!updatedMessage.deleted_at }
                    : m
            ))
        }
    })

    if (isLoading && messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-xl overflow-hidden shadow-hard">
            {/* Messages */}
            <MessageList
                messages={messages}
                isLoading={isLoading}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                communityId={communityId}
            />

            {/* Input */}
            <MessageInput
                communityId={communityId}
                onMessageSent={() => {
                    // Messages will be loaded via realtime
                }}
            />
        </div>
    )
}
