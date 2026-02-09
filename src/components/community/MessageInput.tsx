"use client"

import { useState, useRef } from "react"
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react"
import { sendCommunityMessage } from "@/app/communities/[id]/chat/actions"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface MessageInputProps {
    communityId: string
    onMessageSent?: () => void
}

export function MessageInput({ communityId, onMessageSent }: MessageInputProps) {
    const [content, setContent] = useState("")
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const convertToWebP = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement("canvas")
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"))
                    return
                }
                ctx.drawImage(img, 0, 0)
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error("Failed to convert to WebP"))
                    }
                }, "image/webp", 0.8)
            }
            img.onerror = (e) => reject(e)
            img.src = URL.createObjectURL(file)
        })
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB")
            return
        }

        try {
            setIsLoading(true)

            const webpBlob = await convertToWebP(file)
            const webpFile = new File([webpBlob], `${file.name.split(".")[0]}.webp`, { type: "image/webp" })

            const supabase = createClient()
            const fileName = `${communityId}/${Date.now()}_${Math.random().toString(36).slice(2)}.webp`

            const { error: uploadError } = await supabase.storage
                .from("communities")
                .upload(fileName, webpFile)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from("communities")
                .getPublicUrl(fileName)

            setPreviewImage(publicUrl)
            toast.success("Image uploaded successfully")
        } catch (error) {
            console.error("Error uploading image:", error)
            toast.error("Failed to upload image")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendMessage = async () => {
        if (!content.trim() && !previewImage) {
            toast.error("Message or image is required")
            return
        }

        setIsLoading(true)
        try {
            const result = await sendCommunityMessage(communityId, content, previewImage || undefined)
            if (result.error) {
                toast.error(result.error)
            } else {
                setContent("")
                setPreviewImage(null)
                toast.success("Message sent!")
                onMessageSent?.()
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && e.ctrlKey) {
            handleSendMessage()
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 border-t-2 border-black dark:border-white p-4 space-y-4">
            {previewImage && (
                <div className="relative w-full max-w-sm">
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full rounded-lg border-2 border-black dark:border-white"
                    />
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 border-2 border-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex gap-3">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message... (Ctrl+Enter to send)"
                    disabled={isLoading}
                    className="flex-1 p-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium resize-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                    rows={3}
                />

                <div className="flex flex-col gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isLoading}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="p-3 bg-white dark:bg-gray-700 border-2 border-black dark:border-white rounded-lg hover:shadow-hard transition-all disabled:opacity-50 flex items-center justify-center"
                        title="Upload image"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-black dark:text-white" />
                        ) : (
                            <ImageIcon className="w-5 h-5 text-black dark:text-white" />
                        )}
                    </button>

                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || (!content.trim() && !previewImage)}
                        className="p-3 bg-black dark:bg-white border-2 border-black dark:border-white text-white dark:text-black rounded-lg hover:shadow-hard transition-all disabled:opacity-50 flex items-center justify-center"
                        title="Send message (Ctrl+Enter)"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
