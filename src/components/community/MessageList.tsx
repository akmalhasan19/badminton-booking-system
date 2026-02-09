import { useEffect, useRef, useState, useCallback } from "react"
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Loader2, Edit2, Trash2 } from "lucide-react"
import { CommunityMessage, editCommunityMessage, deleteCommunityMessage, addReaction } from "@/app/communities/[id]/chat/actions"
import { MessageReactions } from "@/components/community/MessageReactions"
import { ReactionPicker } from "@/components/community/ReactionPicker"
import { useLongPress } from "@/hooks/useLongPress"
import { MobileMessageMenu } from "@/components/community/MobileMessageMenu"
import { toast } from "sonner"

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
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState("")
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
    const [isAtBottom, setIsAtBottom] = useState(true)
    const [selectedMessage, setSelectedMessage] = useState<CommunityMessage | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const messageEndRef = useRef<HTMLDivElement>(null)
    const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const lastNewestMessageIdRef = useRef<string | null>(null)

    const scrollToBottom = useCallback(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
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

    // Scroll to bottom on initial load
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            scrollToBottom()
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

    const handleMessageLongPress = (message: CommunityMessage) => {
        // Only allow long press actions if not editing
        if (!editingMessageId) {
            setSelectedMessage(message)
            // Vibrate if supported
            if (navigator.vibrate) {
                navigator.vibrate(50)
            }
        }
    }

    // Prepare Long Press Hook
    const bindLongPress = (message: CommunityMessage) => {
        return useLongPress(() => handleMessageLongPress(message), {
            threshold: 500
        })
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
            {displayMessages.map((message) => {
                const { onMouseLeave: onLongPressLeave, ...otherLongPressHandlers } = bindLongPress(message)

                return (
                    <div
                        key={message.id}
                        ref={(el) => {
                            if (el) messageRefs.current[message.id] = el
                        }}
                        onMouseEnter={() => setHoveredMessageId(message.id)}
                        onMouseLeave={(e) => {
                            setHoveredMessageId(null)
                            onLongPressLeave && onLongPressLeave(e)
                        }}
                        className="group relative"
                        {...otherLongPressHandlers}
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
                            <div className="flex gap-3 items-end justify-end group select-none">
                                <div className="flex flex-col gap-1 max-w-[80%] items-end">
                                    <div className="bg-[#FEF9C3] text-[#171717] border border-[#171717] px-4 py-3 rounded-l-xl rounded-tr-xl rounded-br-none shadow-[2px_2px_0px_0px_#171717] transition-all active:scale-[0.98]">
                                        {editingMessageId === message.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full p-2 border border-[#171717] rounded bg-white text-[#171717] font-medium resize-none"
                                                    rows={2}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditMessage(message.id); }}
                                                        className="px-3 py-1 text-xs font-bold bg-[#171717] text-white border border-[#171717] rounded"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingMessageId(null); }}
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
                            <div className="flex gap-3 items-start group select-none">
                                {/* Avatar */}
                                <div className="w-9 h-9 shrink-0 bg-white rounded-full border border-[#171717] overflow-hidden mt-1">
                                    {message.user?.avatar_url ? (
                                        <img
                                            src={message.user.avatar_url}
                                            alt={message.user.full_name}
                                            className="w-full h-full object-cover"
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
                                    <div className="bg-white border border-[#171717] p-4 rounded-lg shadow-[2px_2px_0px_0px_#171717] relative overflow-hidden transition-all active:scale-[0.98]">
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
                                                        onClick={(e) => e.stopPropagation()}
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

                                    {/* Message Actions Desktop */}
                                    <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity">
                                        {hoveredMessageId === message.id && editingMessageId !== message.id && (
                                            <div className="flex gap-2 mt-1 items-center">
                                                <ReactionPicker messageId={message.id} />
                                                <button
                                                    className="p-1 hover:bg-gray-100 rounded text-gray-500"
                                                    onClick={() => onReply?.(message)}
                                                    title="Reply"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
                                                </button>
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
                            </div>
                        )}
                    </div>
                )
            })}

            <div ref={messageEndRef} />

            {/* Mobile Long Press Menu */}
            {selectedMessage && (
                <MobileMessageMenu
                    isOpen={!!selectedMessage}
                    onClose={() => setSelectedMessage(null)}
                    message={selectedMessage}
                    currentUserId={currentUserId}
                    onReply={() => onReply?.(selectedMessage)}
                    onReaction={async (emoji) => {
                        await addReaction(selectedMessage.id, emoji)
                    }}
                    onCopy={() => {
                        navigator.clipboard.writeText(selectedMessage.content)
                        toast.success("Message copied!")
                    }}
                    onReport={() => {
                        toast.success("Message reported to admins")
                    }}
                    onEdit={() => {
                        setEditingMessageId(selectedMessage.id)
                        setEditContent(selectedMessage.content)
                    }}
                    onDelete={() => handleDeleteMessage(selectedMessage.id)}
                />
            )}
        </div>
    )
}
