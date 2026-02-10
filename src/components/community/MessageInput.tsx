"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, X } from "lucide-react"
import { sendCommunityMessage, type CommunityMessage } from "@/app/communities/[id]/chat/actions"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface MessageInputProps {
    communityId: string
    onMessageSent?: () => void
    value?: string
    onChange?: (value: string) => void
    replyingTo?: CommunityMessage | null
    onCancelReply?: () => void
    currentUserId?: string
}

export function MessageInput({
    communityId,
    onMessageSent,
    value,
    onChange,
    replyingTo,
    onCancelReply,
    currentUserId
}: MessageInputProps) {
    // Fallback local state if no props provided (backwards compatibility)
    const [localContent, setLocalContent] = useState("")
    const content = value !== undefined ? value : localContent
    const setContent = onChange || setLocalContent

    const [isLoading, setIsLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [isPdf, setIsPdf] = useState(false)

    const isSupportedFile = (file: File) => {
        if (file.type.startsWith("image/")) return true
        if (file.type === "application/pdf") return true
        const name = file.name.toLowerCase()
        return name.endsWith(".pdf")
    }

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    const handleSelectFile = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!isSupportedFile(file)) {
            toast.error("Format file tidak didukung. Hanya gambar dan PDF.")
            event.target.value = ""
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File terlalu besar. Maksimal 5MB.")
            event.target.value = ""
            return
        }

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }

        setSelectedFile(file)
        const nextIsPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
        setIsPdf(nextIsPdf)
        setPreviewUrl(nextIsPdf ? null : URL.createObjectURL(file))
    }

    const clearSelectedFile = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        setSelectedFile(null)
        setPreviewUrl(null)
        setIsPdf(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const uploadAttachment = async (file: File) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const userId = currentUserId || user?.id
        if (!userId) {
            throw new Error("Not authenticated")
        }

        const extension = file.name.split(".").pop()?.toLowerCase() || "bin"
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`
        const filePath = `${communityId}/${userId}/${fileName}`

        const { error } = await supabase.storage
            .from("community_chat_attachments")
            .upload(filePath, file, {
                upsert: false,
                cacheControl: "3600",
                contentType: file.type || undefined
            })

        if (error) {
            throw error
        }

        return filePath
    }

    const handleSendMessage = async () => {
        if (!content.trim() && !selectedFile) {
            console.log("Message empty, not sending")
            return
        }

        console.log("Sending message:", { communityId, content })
        setIsLoading(true)
        try {
            let uploadedPath: string | undefined
            if (selectedFile) {
                setIsUploading(true)
                uploadedPath = await uploadAttachment(selectedFile)
            }

            let finalContent = content
            if (replyingTo) {
                const senderName = replyingTo.user?.full_name || "Unknown"
                const quote = `> [${senderName}] [id:${replyingTo.id}] [uid:${replyingTo.user_id}] ${replyingTo.content}\n\n`
                finalContent = quote + content
            }

            const result = await sendCommunityMessage(communityId, finalContent, uploadedPath)
            console.log("Send message result:", result)
            if (result.error) {
                console.error("Error sending message:", result.error)
                toast.error(result.error)
            } else {
                console.log("Message sent successfully!")
                setContent("")
                clearSelectedFile()
                onMessageSent?.()
                onCancelReply?.()
                // toast.success("Message sent!") - Removed for seamless experience
            }
        } catch (error) {
            console.error("Unexpected error:", error)
            toast.error("Failed to send message")
        } finally {
            setIsUploading(false)
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && !isUploading) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <footer className="bg-white px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-[#171717] w-full shrink-0">
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
            {selectedFile && (
                <div className="mb-3">
                    <div className="relative inline-flex items-center gap-3 rounded-xl border border-[#171717] bg-white p-2 shadow-[2px_2px_0px_0px_#171717]">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Attachment preview"
                                className="h-20 w-20 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                                {isPdf ? "PDF" : "File"}
                            </div>
                        )}
                        <div className="text-xs font-bold text-[#171717] max-w-[160px] truncate">
                            {selectedFile.name}
                        </div>
                        <button
                            type="button"
                            onClick={clearSelectedFile}
                            className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Remove attachment"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <button
                    className="w-11 h-11 bg-[#EF4444] text-white rounded-full border border-[#171717] shadow-[2px_2px_0px_0px_#171717] flex items-center justify-center hover:translate-y-[-1px] hover:shadow-[2px_3px_0px_0px_#171717] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#171717] transition-all shrink-0"
                    title="Add attachment"
                    type="button"
                    onClick={handleSelectFile}
                    disabled={isLoading || isUploading}
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
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isLoading || isUploading || (!content.trim() && !selectedFile)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[#171717] hover:text-[#EF4444] transition-colors disabled:opacity-30 inline-flex items-center justify-center h-10 w-10"
                    >
                        {isLoading || isUploading ? (
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
