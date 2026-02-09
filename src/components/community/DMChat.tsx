import { useEffect, useState, useCallback } from "react"
import useRealtimeSubscription from "../../hooks/useRealtimeSubscription"
import { getDMMessages, type DMMessage, editDMMessage, deleteDMMessage, sendDMMessage } from "@/app/communities/[id]/chat/actions"
import { Loader2, ArrowLeft, Edit2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface DMChatProps {
    conversationId: string
    currentUserId?: string
    otherUser?: {
        id: string
        full_name: string
        avatar_url: string | null
    }
    onBack?: () => void
}

export function DMChat({
    conversationId,
    currentUserId,
    otherUser,
    onBack
}: DMChatProps) {
    const [messages, setMessages] = useState<DMMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [hasMore, setHasMore] = useState(true)
    const [cursor, setCursor] = useState<string | undefined>()
    const [newMessage, setNewMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState("")
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)

    // Load initial messages
    useEffect(() => {
        const loadMessages = async () => {
            setIsLoading(true)
            const result = await getDMMessages(conversationId, 30)
            if (!result.error) {
                setMessages(result.data || [])
                setCursor(result.nextCursor)
                setHasMore(result.hasMore || false)
            }
            setIsLoading(false)
        }

        loadMessages()
    }, [conversationId])

    // Real-time subscription
    useRealtimeSubscription({
        table: "dm_messages",
        filter: `conversation_id=eq.${conversationId}`,
        event: "*",
        onInsert: (newMsg: any) => {
            setMessages(prev => [{
                id: newMsg.id,
                conversation_id: newMsg.conversation_id,
                sender_id: newMsg.sender_id,
                content: newMsg.content,
                image_url: newMsg.image_url,
                created_at: newMsg.created_at,
                updated_at: newMsg.updated_at,
                deleted_at: newMsg.deleted_at,
                is_deleted: false
            }, ...prev])
        },
        onUpdate: (updatedMsg: any) => {
            setMessages(prev => prev.map(m =>
                m.id === updatedMsg.id
                    ? { ...m, ...updatedMsg, is_deleted: !!updatedMsg.deleted_at }
                    : m
            ))
        }
    })

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !previewImage) {
            toast.error("Message or image is required")
            return
        }

        setIsSending(true)
        try {
            const result = await sendDMMessage(
                otherUser?.id || "",
                conversationId.split("_")[0],
                newMessage,
                previewImage || undefined
            )
            if (!result.error) {
                setNewMessage("")
                setPreviewImage(null)
            } else {
                toast.error(result.error)
            }
        } finally {
            setIsSending(false)
        }
    }

    const handleEditMessage = async (messageId: string) => {
        if (!editContent.trim()) {
            setEditingMessageId(null)
            return
        }

        const result = await editDMMessage(conversationId, messageId, editContent)
        if (!result.error) {
            setEditingMessageId(null)
            setEditContent("")
        }
    }

    const handleDeleteMessage = async (messageId: string) => {
        if (window.confirm("Delete this message?")) {
            await deleteDMMessage(conversationId, messageId)
        }
    }

    const displayMessages = [...messages].reverse()

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-hard border-2 border-black dark:border-white">
            {/* Header */}
            <div className="border-b-2 border-black dark:border-white p-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-800">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
                    </button>
                )}

                <div className="w-10 h-10 rounded-full bg-neo-green overflow-hidden border-2 border-black dark:border-white flex-shrink-0">
                    {otherUser?.avatar_url ? (
                        <img
                            src={otherUser.avatar_url}
                            alt={otherUser.full_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-black">
                            {otherUser?.full_name?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="font-bold text-black dark:text-white">
                        {otherUser?.full_name}
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        DM Conversation
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                {isLoading && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-96">
                        <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
                    </div>
                ) : (
                    <>
                        {displayMessages.map((message) => (
                            <div
                                key={message.id}
                                onMouseEnter={() => setHoveredMessageId(message.id)}
                                onMouseLeave={() => setHoveredMessageId(null)}
                                className={`flex gap-3 ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`max-w-xs ${message.sender_id === currentUserId ? "order-2" : "order-1"}`}>
                                    {message.is_deleted ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                            Message deleted
                                        </p>
                                    ) : editingMessageId === message.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white font-medium resize-none"
                                                rows={2}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditMessage(message.id)}
                                                    className="px-3 py-1 text-xs font-bold bg-black dark:bg-white text-white dark:text-black rounded hover:shadow-hard"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingMessageId(null)}
                                                    className="px-3 py-1 text-xs font-bold bg-white dark:bg-gray-800 text-black dark:text-white border-2 border-black dark:border-white rounded"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`p-3 rounded-lg border-2 ${message.sender_id === currentUserId
                                                ? "bg-black text-white border-black dark:border-white"
                                                : "bg-gray-100 dark:bg-gray-800 text-black dark:text-white border-black dark:border-white"
                                                }`}>
                                                <p className="break-words">{message.content}</p>
                                                {message.image_url && (
                                                    <img
                                                        src={message.image_url}
                                                        alt="Message"
                                                        className="mt-2 max-w-sm rounded border-2 border-white dark:border-gray-700"
                                                    />
                                                )}
                                                <p className={`text-xs mt-1 ${message.sender_id === currentUserId
                                                    ? "text-gray-300"
                                                    : "text-gray-600 dark:text-gray-500"
                                                    }`}>
                                                    {format(new Date(message.created_at), "HH:mm", { locale: idLocale })}
                                                </p>
                                            </div>

                                            {hoveredMessageId === message.id && (
                                                <div className="flex gap-2 mt-2 justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setEditingMessageId(message.id)
                                                            setEditContent(message.content)
                                                        }}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMessage(message.id)}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Input */}
            <div className="border-t-2 border-black dark:border-white p-4 bg-gray-50 dark:bg-gray-800 space-y-3">
                {previewImage && (
                    <div className="relative w-24 h-24">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="w-full h-full rounded-lg border-2 border-black dark:border-white object-cover"
                        />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full text-xs"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className="flex gap-3">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={isSending}
                        className="flex-1 p-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white font-medium resize-none focus:outline-none"
                        rows={2}
                    />

                    <button
                        onClick={handleSendMessage}
                        disabled={isSending || (!newMessage.trim() && !previewImage)}
                        className="p-3 bg-black dark:bg-white border-2 border-black dark:border-white text-white dark:text-black rounded-lg hover:shadow-hard disabled:opacity-50 h-fit"
                    >
                        {isSending ? "..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    )
}
