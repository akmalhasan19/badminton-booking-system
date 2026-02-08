"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, Trash2, CheckCircle, Loader2, Image as ImageIcon, Plus } from "lucide-react"
import { toast } from "sonner"

interface ActivityImage {
    id: string
    url: string
    created_at: string
    is_active: boolean
    slot: 'main' | 'sparring' | 'fun'
}

export default function ActivityImagesPage() {
    const [images, setImages] = useState<ActivityImage[]>([])
    const [loading, setLoading] = useState(true)
    const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchImages()
    }, [])

    const fetchImages = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('activity_images')
                .select('*')
                .eq('is_active', true) // Only fetch active ones for the display

            if (error) throw error
            setImages(data || [])
        } catch (error) {
            console.error('Error fetching images:', error)
            toast.error("Gagal memuat gambar")
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (slot: string) => {
        setSelectedSlot(slot)
        fileInputRef.current?.click()
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !selectedSlot) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB")
            return
        }

        try {
            setUploadingSlot(selectedSlot)
            const fileExt = file.name.split('.').pop()
            const fileName = `${selectedSlot}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('activity_images')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('activity_images')
                .getPublicUrl(filePath)

            // 3. Deactivate old image for this slot (if any)
            await supabase
                .from('activity_images')
                .update({ is_active: false })
                .eq('slot', selectedSlot)

            // 4. Save to Database
            const { error: dbError } = await supabase
                .from('activity_images')
                .insert([{
                    url: publicUrl,
                    is_active: true,
                    slot: selectedSlot
                }])

            if (dbError) throw dbError

            toast.success(`Gambar slot ${selectedSlot} berhasil diperbarui`)
            fetchImages()
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error("Gagal mengupload gambar")
        } finally {
            setUploadingSlot(null)
            setSelectedSlot(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const getImageBySlot = (slot: string) => {
        return images.find(img => img.slot === slot)
    }

    const renderUploadZone = (slot: string, label: string, heightClass: string) => {
        const image = getImageBySlot(slot)
        const isUploading = uploadingSlot === slot

        return (
            <div className={`relative rounded-xl overflow-hidden border-3 border-neo-black bg-gray-100 group ${heightClass}`}>
                {image ? (
                    <img
                        src={image.url}
                        alt={label}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">
                            {label}
                        </span>
                    </div>
                )}

                {/* Overlay for actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                        onClick={() => handleFileSelect(slot)}
                        disabled={!!uploadingSlot}
                        className="bg-primary text-black px-4 py-2 font-bold uppercase text-xs rounded-lg shadow-hard-sm hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-1"
                    >
                        {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        {image ? "Ganti" : "Upload"}
                    </button>
                </div>

                {/* Loading Details */}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                )}

                {/* Label Badge */}
                <div className="absolute bottom-3 left-3 bg-white border-2 border-black px-2 py-1 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {label}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Activity Images</h1>
                    <p className="text-gray-500 font-medium">Manage images displayed in the "Create Activity" modal.</p>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
            />

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white border-3 border-neo-black p-6 rounded-xl shadow-hard">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-dashed border-gray-200">
                            <div className="w-3 h-3 rounded-full bg-red-500 border border-black"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500 border border-black"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500 border border-black"></div>
                            <span className="ml-2 text-xs font-mono text-gray-400">PREVIEW: CREATE ACTIVITY MODAL</span>
                        </div>

                        {/* Layout Mockup - Same as Modal */}
                        <div className="grid grid-cols-2 gap-3 h-64 md:h-96">
                            {/* Frame 1 - Large Left */}
                            {renderUploadZone('main', 'Main Bareng Moment', 'h-full')}

                            <div className="grid grid-rows-2 gap-3 h-full">
                                {/* Frame 2 - Top Right */}
                                {renderUploadZone('sparring', 'Sparring', 'h-full')}

                                {/* Frame 3 - Bottom Right */}
                                {renderUploadZone('fun', 'Fun Match', 'h-full')}
                            </div>
                        </div>
                    </div>

                    <p className="mt-4 text-center text-sm text-gray-500">
                        Klik pada area gambar untuk mengupload atau mengganti gambar. Layout ini mencerminkan tampilan di aplikasi mobile.
                    </p>
                </div>
            )}
        </div>
    )
}
