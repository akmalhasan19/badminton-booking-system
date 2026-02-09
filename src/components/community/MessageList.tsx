"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Loader2, Edit2, Trash2 } from "lucide-react"
import { CommunityMessage, editCommunityMessage, deleteCommunityMessage } from "@/app/communities/[id]/chat/actions"
import { MessageReactions } from "@/components/community/MessageReactions"
import { ReactionPicker } from "@/components/community/ReactionPicker"

interface MessageListProps {
    messages: CommunityMessage[]
    isLoading: boolean
    onLoadMore?: () => void
    hasMore?: boolean
    currentUserId?: string
    isAdmin?: boolean
    communityId: string
}

export function MessageList({
    messages,
    isLoading,
    onLoadMore,
    hasMore,
    currentUserId,
    isAdmin,
    communityId
}: MessageListProps) {
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState("")
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const messageEndRef = useRef<HTMLDivElement>(null)
    const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

    const scrollToBottom = useCallback(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [])

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return

        const { scrollTop } = scrollRef.current
        if (scrollTop < 100 && hasMore && onLoadMore) {
            onLoadMore()
        }
    }, [hasMore, onLoadMore])

    // Scroll to bottom on initial load
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            scrollToBottom()
        }
    }, [isLoading]) // Only run when loading finishes initially. We might want to be smarter about this.

    // Scroll to bottom if user was near bottom when new message arrived
    useEffect(() => {
        // Simple implementation: just scroll to bottom when messages change and it's not a "load more" action
        // But since we prepend messages on load more, we need to be careful.
        // Actually, the user wants "open feature chat directly open bottom".
        // The above useEffect handles the "open feature" part.

        // For new messages (which are at the bottom now), we should auto-scroll if we are already at the bottom.
        // However, standard chat behavior is often just to scroll to bottom on new message if sent by self.

        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.user_id === currentUserId) {
                scrollToBottom()
            }
        }
    }, [messages, currentUserId, scrollToBottom])


    useEffect(() => {
        const scrollContainer = scrollRef.current
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", handleScroll)
            return () => scrollContainer.removeEventListener("scroll", handleScroll)
        }
    }, [handleScroll])

    const handleEditMessage = async (messageId: string) => {
        if (!editContent.trim()) {
            setEditingMessageId(null)
            return
        }

        const result = await editCommunityMessage(communityId, messageId, editContent)
        if (!result.error) {
            setEditingMessageId(null)
            setEditContent("")
        }
    }

    const handleDeleteMessage = async (messageId: string) => {
        if (window.confirm("Delete this message?")) {
            await deleteCommunityMessage(communityId, messageId)
        }
    }

    // Add date divider logic
    const getDateDivider = (date: string) => {
        const messageDate = new Date(date)
        if (isToday(messageDate)) {
            return "Today"
        } else if (isYesterday(messageDate)) {
            return "Yesterday"
        } else {
            return format(messageDate, "dd MMM yyyy", { locale: idLocale })
        }
    }

    // Reverse messages for display (newest at bottom)
    const displayMessages = [...messages].reverse()

    // Check if user is the sender
    const isOwnMessage = (message: CommunityMessage) => {
        return currentUserId === message.user_id
    }

    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-white p-4 space-y-6 flex flex-col"
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
                <div
                    key={message.id}
                    ref={(el) => {
                        if (el) messageRefs.current[message.id] = el
                    }}
                    onMouseEnter={() => setHoveredMessageId(message.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                    className="group relative"
                >
                    {/* Deleted message */}
                    {message.is_deleted ? (
                        <div className="flex gap-3 items-center opacity-50">
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 italic">
                                    Message deleted
                                </p>
                            </div>
                        </div>
                    ) : isOwnMessage(message) ? (
                        /* User's own messages - Yellow pastel bubble */
                        <div className="flex gap-3 items-end justify-end group">
                            <div className="flex flex-col gap-1 max-w-[80%] items-end">
                                <div className="bg-[#FEF9C3] text-[#171717] border border-[#171717] px-4 py-3 rounded-l-xl rounded-tr-xl rounded-br-none shadow-[2px_2px_0px_0px_#171717]">
                                    {editingMessageId === message.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full p-2 border border-[#171717] rounded bg-white text-[#171717] font-medium resize-none"
                                                rows={2}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditMessage(message.id)}
                                                    className="px-3 py-1 text-xs font-bold bg-[#171717] text-white border border-[#171717] rounded"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingMessageId(null)}
                                                    className="px-3 py-1 text-xs font-bold bg-white text-[#171717] border border-[#171717] rounded"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-medium leading-relaxed break-words">
                                            {message.content}
                                        </p>
                                    )}
                                </div>
                                <span className="text-[10px] font-semibold text-gray-400 mr-1 mt-0.5">
                                    {format(new Date(message.created_at), "HH:mm", { locale: idLocale })} • You
                                </span>
                            </div>
                        </div>
                    ) : (
                        /* Other users' messages - White bubble with accent bar */
                        <div className="flex gap-3 items-start group">
                            {/* Avatar */}
                            <div className="w-9 h-9 shrink-0 bg-white rounded-full border border-[#171717] overflow-hidden mt-1">
                                {message.user?.avatar_url ? (
                                    <img
                                        src={message.user.avatar_url}
                                        alt={message.user.full_name}
                                        className="w-full h-full object-cover grayscale contrast-125"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-sm font-bold text-[#171717]">
                                        {message.user?.full_name?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1 w-full max-w-[88%]">
                                <span className="text-xs font-bold ml-1 text-[#171717] uppercase">
                                    {message.user?.full_name}
                                </span>
                                <div className="bg-white border border-[#171717] p-4 rounded-lg shadow-[2px_2px_0px_0px_#171717] relative overflow-hidden">
                                    {/* Yellow accent bar */}
                                    <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#FDE047] border-r border-[#171717]"></div>
                                    <div className="pl-3">
                                        {editingMessageId === message.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full p-2 border border-[#171717] rounded bg-white text-[#171717] font-medium resize-none"
                                                    rows={2}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditMessage(message.id)}
                                                        className="px-3 py-1 text-xs font-bold bg-[#171717] text-white border border-[#171717] rounded"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingMessageId(null)}
                                                        className="px-3 py-1 text-xs font-bold bg-white text-[#171717] border border-[#171717] rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-800 leading-relaxed break-words">
                                                {message.content}
                                            </p>
                                        )}
                                        {message.image_url && (
                                            <img
                                                src={message.image_url}
                                                alt="Message attachment"
                                                className="mt-3 max-w-full rounded border border-[#171717]"
                                            />
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-400 ml-1 mt-0.5 flex items-center gap-1">
                                    {format(new Date(message.created_at), "HH:mm", { locale: idLocale })} • {message.user?.full_name?.split(' ')[0]}
                                </span>

                                {/* Reactions */}
                                {message.reactions && message.reactions.length > 0 && (
                                    <MessageReactions
                                        reactions={message.reactions}
                                        messageId={message.id}
                                        currentUserId={currentUserId}
                                    />
                                )}

                                {/* Message Actions */}
                                {hoveredMessageId === message.id && editingMessageId !== message.id && (
                                    <div className="flex gap-2 mt-1 items-center">
                                        <ReactionPicker messageId={message.id} />
                                        {(currentUserId === message.user_id || isAdmin) && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingMessageId(message.id)
                                                        setEditContent(message.content)
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                    title="Edit message"
                                                >
                                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMessage(message.id)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                    title="Delete message"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            <div ref={messageEndRef} />
        </div>
    )
}
