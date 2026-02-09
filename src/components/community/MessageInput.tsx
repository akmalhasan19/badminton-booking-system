"use client"

import { useState } from "react"
import { Loader2, X } from "lucide-react"
import { sendCommunityMessage, type CommunityMessage } from "@/app/communities/[id]/chat/actions"
import { toast } from "sonner"

interface MessageInputProps {
    communityId: string
    onMessageSent?: () => void
    value?: string
    onChange?: (value: string) => void
    replyingTo?: CommunityMessage | null
    onCancelReply?: () => void
}

export function MessageInput({
    communityId,
    onMessageSent,
    value,
    onChange,
    replyingTo,
    onCancelReply
}: MessageInputProps) {
    // Fallback local state if no props provided (backwards compatibility)
    const [localContent, setLocalContent] = useState("")
    const content = value !== undefined ? value : localContent
    const setContent = onChange || setLocalContent

    const [isLoading, setIsLoading] = useState(false)

    const handleSendMessage = async () => {
        if (!content.trim()) {
            console.log("Message empty, not sending")
            return
        }

        console.log("Sending message:", { communityId, content })
        setIsLoading(true)
        try {
            let finalContent = content
            if (replyingTo) {
                const quote = `> ${replyingTo.content}\n\n`
                finalContent = quote + content
            }

            const result = await sendCommunityMessage(communityId, finalContent)
            console.log("Send message result:", result)
            if (result.error) {
                console.error("Error sending message:", result.error)
                toast.error(result.error)
            } else {
                console.log("Message sent successfully!")
                setContent("")
                onMessageSent?.()
                onCancelReply?.()
                // toast.success("Message sent!") - Removed for seamless experience
            }
        } catch (error) {
            console.error("Unexpected error:", error)
            toast.error("Failed to send message")
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <footer className="bg-white p-4 border-t border-[#171717] w-full">
            {replyingTo && (
                <div className="flex items-center justify-between bg-gray-50 p-2 mb-2 rounded border-l-4 border-emerald-500">
                    <div className="flex-1 min-w-0 mr-2">
                        <div className="text-sm font-semibold text-emerald-500 truncate">
                            {replyingTo.user?.full_name || "Unknown User"}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                            {replyingTo.content}
                        </div>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            )}
            <div className="flex items-center gap-3">
                <button
                    className="w-11 h-11 bg-[#EF4444] text-white rounded-full border border-[#171717] shadow-[2px_2px_0px_0px_#171717] flex items-center justify-center hover:translate-y-[-1px] hover:shadow-[2px_3px_0px_0px_#171717] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#171717] transition-all shrink-0"
                    title="Add attachment"
                >
                    <span className="material-icons-round text-2xl font-bold">add</span>
                </button>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        disabled={isLoading}
                        className="w-full bg-white border border-[#171717] rounded py-3 px-4 pr-12 text-sm font-medium text-[#171717] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#171717] focus:border-[#171717] transition-all shadow-sm disabled:opacity-50"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !content.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#171717] hover:text-[#EF4444] transition-colors disabled:opacity-30 inline-flex items-center justify-center h-10 w-10"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <span className="material-icons-round text-xl">send</span>
                        )}
                    </button>
                </div>
            </div>
        </footer>
    )
}
