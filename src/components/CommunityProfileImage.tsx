"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Camera, Loader2 } from "lucide-react"
import { updateCommunityLogo } from "@/app/communities/actions"
import { ImageCropper } from "@/components/ImageCropper"

interface CommunityProfileImageProps {
    communityId: string
    url: string | null
    name: string
    canEdit: boolean
    className?: string
}

export function CommunityProfileImage({ communityId, url, name, canEdit, className }: CommunityProfileImageProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(url)
    const [showCropper, setShowCropper] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("Ukuran gambar terlalu besar (maks 5MB)")
                return
            }

            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setSelectedImage(reader.result as string)
                setShowCropper(true)
            })
            reader.readAsDataURL(file)

            // Reset input so same file can be selected again
            e.target.value = ''
        }
    }

    const handleCropComplete = async (croppedImageUrl: string) => {
        setShowCropper(false)
        setIsUploading(true)

        // Optimistic update
        setPreviewUrl(croppedImageUrl)

        try {
            // Convert base64 to blob
            const response = await fetch(croppedImageUrl)
            const blob = await response.blob()

            // Create FormData
            const formData = new FormData()
            formData.append('file', blob, 'profile.webp')

            // Upload via server action
            const result = await updateCommunityLogo(communityId, formData)

            if (result.error) {
                toast.error(result.error)
                setPreviewUrl(url) // Revert on error
            } else {
                toast.success("Foto profil berhasil diperbarui")
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Gagal mengupload gambar")
            setPreviewUrl(url)
        } finally {
            setIsUploading(false)
        }
    }

    const triggerFileInput = () => {
        if (canEdit && !isUploading) {
            fileInputRef.current?.click()
        }
    }

    return (
        <>
            <div
                className={className || `relative w-24 h-24 rounded-xl border-2 border-black bg-white dark:bg-dark overflow-hidden shadow-neobrutalism rotate-[-3deg] group ${canEdit ? 'cursor-pointer' : ''}`}
                onClick={triggerFileInput}
            >
                {previewUrl ? (
                    <img
                        alt={name}
                        className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : ''}`}
                        src={previewUrl}
                    />
                ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-3xl font-black text-black uppercase">
                        {name.substring(0, 2)}
                    </div>
                )}

                {canEdit && (
                    <>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </>
                )}

                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-black animate-spin" />
                    </div>
                )}
            </div>

            {showCropper && selectedImage && (
                <ImageCropper
                    imageSrc={selectedImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setShowCropper(false)
                        setSelectedImage(null)
                    }}
                />
            )}
        </>
    )
}
