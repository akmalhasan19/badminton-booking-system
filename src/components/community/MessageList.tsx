"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Loader2, X, Edit2, Trash2 } from "lucide-react"
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

    // Reverse messages for display (newest at bottom)
    const displayMessages = [...messages].reverse()

    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 p-6 space-y-6 flex flex-col"
        >
            {/* Load more indicator */}
            {isLoading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-black dark:text-white" />
                </div>
            )}

            {hasMore && !isLoading && (
                <button
                    onClick={onLoadMore}
                    className="mx-auto px-4 py-2 text-sm font-bold text-black dark:text-white border-2 border-black dark:border-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    Load Previous Messages
                </button>
            )}

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
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    Message deleted
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden border-2 border-black dark:border-white">
                                {message.user?.avatar_url ? (
                                    <img
                                        src={message.user.avatar_url}
                                        alt={message.user.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neo-green text-sm font-bold text-black">
                                        {message.user?.full_name?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-black dark:text-white">
                                        {message.user?.full_name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {format(new Date(message.created_at), "HH:mm", {
                                            locale: idLocale
                                        })}
                                    </span>
                                    {message.created_at !== message.updated_at && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            (edited)
                                        </span>
                                    )}
                                </div>

                                {/* Message body */}
                                {editingMessageId === message.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white font-medium resize-none"
                                            rows={3}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditMessage(message.id)}
                                                className="px-3 py-1 text-sm font-bold bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white rounded hover:shadow-hard transition-all"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingMessageId(null)}
                                                className="px-3 py-1 text-sm font-bold bg-white dark:bg-gray-800 text-black dark:text-white border-2 border-black dark:border-white rounded hover:shadow-hard transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-black dark:text-gray-100 break-words">
                                            {message.content}
                                        </p>
                                        {message.image_url && (
                                            <img
                                                src={message.image_url}
                                                alt="Message attachment"
                                                className="mt-3 max-w-sm rounded-lg border-2 border-black dark:border-white shadow-hard"
                                            />
                                        )}
                                    </>
                                )}

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
                                    <div className="flex gap-2 mt-2 items-center">
                                        <ReactionPicker messageId={message.id} />
                                        {(currentUserId === message.user_id || isAdmin) && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingMessageId(message.id)
                                                        setEditContent(message.content)
                                                    }}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                    title="Edit message"
                                                >
                                                    <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMessage(message.id)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
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
