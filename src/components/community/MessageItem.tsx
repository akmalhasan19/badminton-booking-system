import { useState } from "react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Loader2, Edit2, Trash2, Info } from "lucide-react"
import { CommunityMessage, editCommunityMessage, deleteCommunityMessage, addReaction } from "@/app/communities/[id]/chat/actions"
import { MessageReactions } from "@/components/community/MessageReactions"
import { ReactionPicker } from "@/components/community/ReactionPicker"
import { useLongPress } from "@/hooks/useLongPress"
import { MobileMessageMenu } from "@/components/community/MobileMessageMenu"
import { toast } from "sonner"
import { MessageInfoModal } from "./MessageInfoModal"

interface MessageItemProps {
    message: CommunityMessage
    currentUserId?: string
    isAdmin?: boolean
    communityId: string
    onReply?: (message: CommunityMessage) => void
}

export function MessageItem({
    message,
    currentUserId,
    isAdmin,
    communityId,
    onReply
}: MessageItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(message.content)
    const [isHovered, setIsHovered] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)

    const isOwnMessage = currentUserId === message.user_id
    const infoSenderName = isOwnMessage ? "You" : (message.user?.full_name || "Unknown")

    const handleEditMessage = async () => {
        if (!editContent.trim()) {
            setIsEditing(false)
            setEditContent(message.content) // Reset
            return
        }

        const result = await editCommunityMessage(communityId, message.id, editContent)
        if (!result.error) {
            setIsEditing(false)
        } else {
            toast.error("Failed to edit message")
        }
    }

    const handleDeleteMessage = async () => {
        if (window.confirm("Delete this message?")) {
            await deleteCommunityMessage(communityId, message.id)
        }
    }

    // Long press handler
    const onLongPress = () => {
        if (!isEditing) {
            if (navigator.vibrate) navigator.vibrate(50)
            setIsMenuOpen(true)
        }
    }

    const longPressHandlers = useLongPress(onLongPress, { threshold: 500 })

    // Merge onMouseLeave
    const { onMouseLeave: onLongPressLeave, ...otherLongPressHandlers } = longPressHandlers

    // Helper to render message content with quotes
    const renderMessageContent = (content: string, isOwn: boolean) => {
        // Check for blockquote pattern: starts with "> " and has a double newline separation
        if (content.startsWith("> ")) {
            const firstNewLineIndex = content.indexOf("\n\n")
            if (firstNewLineIndex !== -1) {
                const fullQuote = content.substring(2, firstNewLineIndex)
                const replyPart = content.substring(firstNewLineIndex + 2)

                let senderName = ""
                let messageId = ""
                let quoteContent = fullQuote

                // Check for [Name] [id:ID] format
                const idMatch = fullQuote.match(/^\[(.*?)\] \[id:(.*?)\] ([\s\S]*)/)
                if (idMatch) {
                    senderName = idMatch[1]
                    messageId = idMatch[2]
                    quoteContent = idMatch[3]
                } else {
                    // Fallback for [Name] only format
                    const nameMatch = fullQuote.match(/^\[(.*?)\] ([\s\S]*)/)
                    if (nameMatch) {
                        senderName = nameMatch[1]
                        quoteContent = nameMatch[2]
                    }
                }

                const handleScrollToMessage = () => {
                    if (messageId) {
                        const element = document.getElementById(`message-${messageId}`)
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            // Add highlight effect
                            element.classList.add('bg-yellow-100/30')
                            setTimeout(() => {
                                element.classList.remove('bg-yellow-100/30')
                            }, 2000)
                        } else {
                            toast.error("Message not found or too old to load")
                        }
                    }
                }

                return (
                    <div className="flex flex-col gap-1">
                        <div
                            onClick={messageId ? handleScrollToMessage : undefined}
                            className={`border-l-4 border border-[#171717] ${isOwn ? 'border-l-yellow-600/50' : 'border-l-emerald-500'} bg-white p-3 mb-1 rounded shadow-[2px_2px_0px_0px_#171717] ${messageId ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors' : ''}`}
                        >
                            {senderName && (
                                <p className="text-xs font-bold text-[#171717] mb-0.5">
                                    {senderName}
                                </p>
                            )}
                            <p className="text-xs italic line-clamp-1 whitespace-pre-wrap break-all text-[#171717]">
                                {quoteContent}
                            </p>
                        </div>
                        <p className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
                            {replyPart}
                        </p>
                    </div>
                )
            }
        }

        return (
            <p className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
                {content}
            </p>
        )
    }

    return (
        <>
            <div
                id={`message-${message.id}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={(e) => {
                    setIsHovered(false)
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
                ) : isOwnMessage ? (
                    /* User's own messages */
                    <div className="flex gap-3 items-end justify-end group select-none">
                        <div className="flex flex-col gap-1 max-w-[80%] items-end">
                            <div className="bg-[#FEF9C3] text-[#171717] border border-[#171717] px-4 py-3 rounded-l-xl rounded-tr-xl rounded-br-none shadow-[2px_2px_0px_0px_#171717] transition-all active:scale-[0.98]">
                                {isEditing ? (
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
                                                onClick={(e) => { e.stopPropagation(); handleEditMessage(); }}
                                                className="px-3 py-1 text-xs font-bold bg-[#171717] text-white border border-[#171717] rounded"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsEditing(false);
                                                    setEditContent(message.content);
                                                }}
                                                className="px-3 py-1 text-xs font-bold bg-white text-[#171717] border border-[#171717] rounded"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    renderMessageContent(message.content, true)
                                )}
                            </div>
                            <div className="flex items-center gap-1 justify-end">
                                <span className="text-[10px] font-bold text-[#171717] mr-1 mt-0.5">
                                    {format(new Date(message.created_at), "HH:mm", { locale: idLocale })} • You
                                </span>
                                {/* Info Button for Own Message Desktop */}
                                <button
                                    onClick={() => setIsInfoModalOpen(true)}
                                    className={`p-0.5 hover:bg-gray-100 rounded text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity`}
                                    title="Message Info"
                                >
                                    <Info className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Other users' messages */
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
                                    {renderMessageContent(message.content, false)}
                                    {message.image_url && (
                                        <img
                                            src={message.image_url}
                                            alt="Message attachment"
                                            className="mt-3 max-w-full rounded border border-[#171717]"
                                        />
                                    )}
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-[#171717] ml-1 mt-0.5 flex items-center gap-1">
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
                            <div className={`hidden md:flex transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
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
                                                    setIsEditing(true)
                                                    setEditContent(message.content)
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded"
                                                title="Edit message"
                                            >
                                                <Edit2 className="w-4 h-4 text-gray-500" />
                                            </button>
                                            <button
                                                onClick={handleDeleteMessage}
                                                className="p-1 hover:bg-gray-100 rounded"
                                                title="Delete message"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Menu */}
            <MobileMessageMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                message={message}
                currentUserId={currentUserId}
                onReply={() => onReply?.(message)}
                onReaction={async (emoji) => {
                    await addReaction(message.id, emoji)
                }}
                onCopy={() => {
                    navigator.clipboard.writeText(message.content)
                    toast.success("Message copied!")
                }}
                onReport={() => {
                    toast.success("Message reported to admins")
                }}
                onEdit={() => {
                    setIsEditing(true)
                    setEditContent(message.content)
                }}
                onDelete={handleDeleteMessage}
                onInfo={() => setIsInfoModalOpen(true)}
            />

            <MessageInfoModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
                communityId={communityId}
                messageId={message.id}
                content={message.content}
                senderName={infoSenderName}
            />
        </>
    )
}
