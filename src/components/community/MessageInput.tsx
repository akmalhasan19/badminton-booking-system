"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { sendCommunityMessage } from "@/app/communities/[id]/chat/actions"
import { toast } from "sonner"

interface MessageInputProps {
    communityId: string
    onMessageSent?: () => void
}

export function MessageInput({ communityId, onMessageSent }: MessageInputProps) {
    const [content, setContent] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSendMessage = async () => {
        if (!content.trim()) {
            console.log("Message empty, not sending")
            return
        }

        console.log("Sending message:", { communityId, content })
        setIsLoading(true)
        try {
            const result = await sendCommunityMessage(communityId, content)
            console.log("Send message result:", result)
            if (result.error) {
                console.error("Error sending message:", result.error)
                toast.error(result.error)
            } else {
                console.log("Message sent successfully!")
                setContent("")
                onMessageSent?.()
                toast.success("Message sent!")
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#171717] hover:text-[#EF4444] transition-colors disabled:opacity-30"
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
