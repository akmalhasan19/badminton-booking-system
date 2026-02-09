"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Share2, MoreVertical, Plus, Edit, Loader2, Camera, MessageCircle, Check, LogOut } from "lucide-react"
import { Community } from "@/app/communities/actions"
import { createClient } from "@/lib/supabase/client"
import { updateCommunityCover } from "@/app/communities/actions"
import { useRouter } from "next/navigation"
import { CommunityProfileImage } from "@/components/CommunityProfileImage"
import { joinCommunity, leaveCommunity } from "@/app/communities/actions"
import { motion, AnimatePresence } from "framer-motion"
import { CommunityEditModal } from "./CommunityEditModal"

interface CommunityHeroProps {
    community: Community;
    isEditable: boolean;
}

export function CommunityHero({ community, isEditable }: CommunityHeroProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const [showOverlay, setShowOverlay] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isJoining, setIsJoining] = useState(false)
    // State for member status
    const [isMember, setIsMember] = useState(!!community.role) // 'admin' or 'member' means they are a member
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    console.log("CommunityHero rendering, isMenuOpen:", isMenuOpen)

    // Check if user is admin specifically for editing rights
    const isAdmin = community.role === 'admin'

    useEffect(() => {
        setIsMobile(window.matchMedia('(pointer: coarse)').matches)
    }, [])

    const handleImageClick = () => {
        if (!isEditable || isUploading) return

        if (isMobile && !showOverlay) {
            setShowOverlay(true)
            return
        }

        fileInputRef.current?.click()
    }

    const convertToWebP = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }
                ctx.drawImage(img, 0, 0)
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Failed to convert to WebP'))
                    }
                }, 'image/webp', 0.8)
            }
            img.onerror = (e) => reject(e)
            img.src = URL.createObjectURL(file)
        })
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            // 1. Convert to WebP
            const webpBlob = await convertToWebP(file)
            const webpFile = new File([webpBlob], `${file.name.split('.')[0]}.webp`, { type: 'image/webp' })

            // 2. Upload to Supabase Storage
            const supabase = createClient()
            const fileName = `${community.id}/background/${Date.now()}_cover.webp`

            const { error: uploadError } = await supabase.storage
                .from('communities') // Ensure this bucket exists
                .upload(fileName, webpFile)

            if (uploadError) throw uploadError

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('communities')
                .getPublicUrl(fileName)

            // 4. Update Database
            await updateCommunityCover(community.id, publicUrl)

            setPreviewUrl(publicUrl)
            toast.success("Foto background berhasil diperbarui")
            router.refresh()

        } catch (error) {
            console.error("Error updating cover image:", error)
            toast.error("Gagal memperbarui foto background. Silakan coba lagi.")
        } finally {
            setIsUploading(false)
        }
    }

    const handleJoinLeave = async () => {
        setIsJoining(true)
        try {
            if (isMember) {
                // If admin, maybe warn or prevent leaving? For now specific check.
                if (isAdmin) {
                    toast.error("Admin tidak dapat keluar dari komunitas (saat ini).")
                    return
                }

                const result = await leaveCommunity(community.id)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    setIsMember(false)
                    toast.success("Berhasil keluar dari komunitas")
                    router.refresh()
                }
            } else {
                const result = await joinCommunity(community.id)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    setIsMember(true)
                    toast.success("Berhasil bergabung ke komunitas!")
                    router.refresh()
                }
            }
        } catch (error) {
            console.error("Error joining/leaving:", error)
            toast.error("Terjadi kesalahan")
        } finally {
            setIsJoining(false)
        }
    }

    const handleShare = async () => {
        const shareData = {
            title: `Join ${community.name} on Smash`,
            text: `Check out ${community.name} community on Smash!`,
            url: `${window.location.origin}/communities/${community.id}`
        }

        try {
            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(shareData.url)
                toast.success("Link komunitas disalin ke clipboard!")
            }
        } catch (error) {
            console.error("Error sharing:", error)
            // Don't show error if user cancelled share (common in mobile)
            if ((error as Error).name !== 'AbortError') {
                toast.error("Gagal membagikan komunitas")
            }
        }
    }

    return (
        <div className="relative bg-transparent dark:bg-transparent md:bg-white md:dark:bg-background-dark shadow-none overflow-hidden pb-4 md:rounded-3xl md:border-3 md:border-black md:shadow-hard transition-all">
            <div className="relative h-64 w-full">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />

                <div
                    className={`group w-full h-full relative ${isEditable ? 'cursor-pointer' : ''}`}
                    onClick={handleImageClick}
                >
                    {previewUrl || community.cover_url ? (
                        <img
                            alt="Community Cover"
                            className="w-full h-full object-cover"
                            src={previewUrl || community.cover_url!}
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 font-bold uppercase tracking-widest">No Cover Image</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                    {/* Hover Edit Overlay */}
                    {isEditable && (
                        <div
                            className={`absolute inset-0 bg-black/60 flex flex-col gap-2 items-center justify-center transition-opacity duration-200 ${showOverlay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            onMouseLeave={() => setShowOverlay(false)}
                        >
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white">
                                {isUploading ? <Loader2 className="animate-spin text-white w-6 h-6" /> : <Camera className="text-white w-6 h-6" />}
                            </div>
                            <span className="text-white text-xs font-bold uppercase tracking-widest">Upload Photo Here</span>
                        </div>
                    )}
                </div>

                {/* Top Navigation - Mobile Only primarily, but keeping structure */}
                {/* Top Navigation */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-30">
                    <button
                        onClick={() => router.back()}
                        className="bg-white w-12 h-12 flex items-center justify-center border-3 border-black shadow-hard hover:shadow-hard-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
                    >
                        <ArrowLeft className="text-black w-7 h-7 stroke-[3px]" />
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleShare}
                            className="bg-white w-12 h-12 flex items-center justify-center border-3 border-black shadow-hard hover:shadow-hard-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
                        >
                            <Share2 className="text-black w-6 h-6 stroke-[3px]" />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="bg-white w-12 h-12 flex items-center justify-center border-3 border-black shadow-hard hover:shadow-hard-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl relative z-20"
                            >
                                <MoreVertical className="text-black w-6 h-6 stroke-[3px]" />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            transition={{ duration: 0.1 }}
                                            className="absolute right-0 top-full mt-2 w-48 bg-white border-3 border-black shadow-hard rounded-xl overflow-hidden z-30 py-1"
                                        >
                                            {/* Admin Options */}
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setIsMenuOpen(false);
                                                            // Handle edit - standard navigation if on specific edit page or modal
                                                            setIsEditModalOpen(true)
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Edit Community
                                                    </button>
                                                    <div className="h-0.5 bg-gray-100 mx-2" />
                                                </>
                                            )}

                                            {/* Member Options */}
                                            {isMember && (
                                                <button
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        handleJoinLeave();
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-red-50 text-red-600 flex items-center gap-2"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Leave Community
                                                </button>
                                            )}

                                            {/* Common Options */}
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    navigator.clipboard.writeText(community.id);
                                                    toast.success("Community ID copied!");
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" />
                                                Copy ID
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    toast.info("Report submitted to admins.");
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Report
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Profile Image - Rotated */}
                {/* Profile Image - Rotated Squircle */}
                <div className="absolute -bottom-12 left-6 z-20">
                    <div className="w-28 h-28 rounded-3xl border-3 border-black bg-neo-green overflow-hidden shadow-hard rotate-[-6deg] hover:rotate-0 transition-transform duration-300">
                        <CommunityProfileImage
                            communityId={community.id}
                            url={community.logo_url}
                            name={community.name}
                            canEdit={isEditable}
                            className="group relative w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                {/* Action Buttons */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-20 items-end">
                    <button
                        onClick={handleJoinLeave}
                        disabled={isJoining}
                        className={`${isMember
                            ? "bg-white text-black hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                            : "bg-primary text-black"
                            } px-6 py-2.5 text-sm font-black border-3 border-black shadow-hard hover:shadow-hard-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider rounded-lg flex items-center gap-2`}
                    >
                        {isJoining ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isMember ? (
                            <>
                                {isAdmin ? "Admin" : "Anggota"}
                                {isAdmin ? null : <LogOut className="w-4 h-4 ml-1" />}
                            </>
                        ) : (
                            <>
                                Gabung <Plus className="w-5 h-5 stroke-[3px]" />
                            </>
                        )}
                    </button>
                    <button 
                        onClick={() => router.push(`/communities/${community.id}/chat`)}
                        className="bg-secondary px-8 py-2.5 text-sm font-black text-white border-3 border-black shadow-hard hover:shadow-hard-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider rounded-lg"
                    >
                        Chat
                    </button>
                </div>
            </div>

            <div className="pt-16 px-6 pb-0">
                <div className="mb-2">
                    <h1 className="text-4xl md:text-5xl font-black uppercase leading-[0.9] tracking-tighter mb-4 text-black dark:text-white break-words">
                        {community.name}
                    </h1>
                    <div className="flex flex-wrap gap-3 mb-6">
                        <span className="bg-black text-white text-xs font-black px-4 py-1.5 uppercase tracking-widest transform -skew-x-12 border border-black shadow-sm">
                            {community.city || "Magelang"}
                        </span>
                        <span className="bg-white border-2 border-black text-black text-xs font-black px-4 py-1.5 uppercase tracking-widest rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {community.sport}
                        </span>
                    </div>
                    <div className="flex gap-3 items-start border-l-4 border-secondary pl-4 py-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-300 leading-relaxed max-w-2xl">
                            {community.description || "Komunitas Badminton khusus penggemar Jujutsu Kaisen. Smash hard, play harder! Weekly sparring sessions and monthly tournaments. 🏸"}
                        </p>
                    </div>
                </div>
            </div>
            {/* Edit Modal */}
            <CommunityEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                community={community}
            />
        </div>
    )
}

