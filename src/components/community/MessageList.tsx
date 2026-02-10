import { useEffect, useRef, useState, useCallback, useMemo, useLayoutEffect } from "react"
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { CommunityMessage } from "@/app/communities/[id]/chat/actions"
import { MessageItem } from "@/components/community/MessageItem"

interface MessageListProps {
    messages: CommunityMessage[]
    isLoading: boolean
    onLoadMore?: () => void
    hasMore?: boolean
    currentUserId?: string
    isAdmin?: boolean
    communityId: string
    onReply?: (message: CommunityMessage) => void
}

export function MessageList({
    messages,
    isLoading,
    onLoadMore,
    hasMore,
    currentUserId,
    isAdmin,
    communityId,
    onReply
}: MessageListProps) {
    const [isAtBottom, setIsAtBottom] = useState(true)

    const scrollRef = useRef<HTMLDivElement>(null)
    const messageEndRef = useRef<HTMLDivElement>(null)
    const lastNewestMessageIdRef = useRef<string | null>(null)
    const didInitialScrollRef = useRef(false)
    const didRevealRef = useRef(false)
    const [isRevealed, setIsRevealed] = useState(false)

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        messageEndRef.current?.scrollIntoView({ behavior })
    }, [])

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current

        // Check if user is near bottom (within 100px)
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight
        setIsAtBottom(distanceFromBottom < 100)

        if (scrollTop < 100 && hasMore && onLoadMore) {
            onLoadMore()
        }
    }, [hasMore, onLoadMore])

    // Scroll to bottom on initial load without visible jump
    useLayoutEffect(() => {
        if (!isLoading && messages.length > 0 && !didInitialScrollRef.current) {
            didInitialScrollRef.current = true
            scrollToBottom("auto")
        }
    }, [isLoading, messages.length, scrollToBottom])

    // Smoothly reveal messages after initial load completes
    useEffect(() => {
        if (!isLoading && !didRevealRef.current) {
            didRevealRef.current = true
            requestAnimationFrame(() => setIsRevealed(true))
        }
    }, [isLoading])

    // Handle auto-scroll for new messages
    useEffect(() => {
        if (messages.length === 0) return

        // messages[0] is the newest message because ChatRoom prepends new messages: [newMessage, ...prev]
        const newestMessage = messages[0]

        // Only run if the newest message has changed (i.e., a new message arrived)
        if (newestMessage.id !== lastNewestMessageIdRef.current) {
            lastNewestMessageIdRef.current = newestMessage.id

            // Auto-scroll if:
            // 1. It's my own message (always scroll)
            // 2. OR I was already at the bottom (reading latest)
            if (newestMessage.user_id === currentUserId || isAtBottom) {
                // Use setTimeout to ensure DOM has updated
                setTimeout(() => {
                    scrollToBottom()
                }, 100)
            }
        }
    }, [messages, currentUserId, isAtBottom, scrollToBottom])

    useEffect(() => {
        const scrollContainer = scrollRef.current
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", handleScroll)
            // Initialize isAtBottom state
            handleScroll()
            return () => scrollContainer.removeEventListener("scroll", handleScroll)
        }
    }, [handleScroll])

    // Reverse messages for display (newest at bottom)
    const displayMessages = [...messages].reverse()
    const messageLookup = useMemo(() => {
        return new Map(messages.map(message => [message.id, message]))
    }, [messages])

    return (
        <div
            ref={scrollRef}
            className={`flex-1 min-h-0 overflow-y-auto p-4 space-y-3 flex flex-col transition-opacity duration-300 ${isRevealed ? "opacity-100" : "opacity-0"}`}
            style={{ contentVisibility: "auto" }}
        >
            {/* Load more indicator */}
            {isLoading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-[#171717]" />
                </div>
            )}

            {/* Date Divider - Today */}
            <div className="flex justify-center">
                <span className="bg-gray-100 text-gray-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-[#171717]/20">
                    Today
                </span>
            </div>

            {/* Messages */}
            {displayMessages.map((message) => (
                <MessageItem
                    key={message.id}
                    message={message}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    communityId={communityId}
                    onReply={onReply}
                    messageLookup={messageLookup}
                />
            ))}

            <div ref={messageEndRef} />
        </div>
    )
}
