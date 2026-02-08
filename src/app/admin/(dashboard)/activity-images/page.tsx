"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, Trash2, CheckCircle, Loader2, Image as ImageIcon, X, Crop as CropIcon } from "lucide-react"
import { toast } from "sonner"
import Cropper from 'react-easy-crop'
// Defining types locally to avoid import issues
interface Point {
    x: number
    y: number
}

interface Area {
    width: number
    height: number
    x: number
    y: number
}

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

    // Cropping State
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [aspectRatio, setAspectRatio] = useState(4 / 3) // Default

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
        // Set aspect ratio based on slot
        if (slot === 'main') {
            setAspectRatio(3 / 4) // Vertical-ish for main frame
        } else {
            setAspectRatio(16 / 9) // Landscape for sparring/fun
        }
        fileInputRef.current?.click()
    }

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ukuran file maksimal 5MB")
                return
            }
            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || null)
                setCropModalOpen(true)
            })
            reader.readAsDataURL(file)
            // Reset input so same file can be selected again if needed
            e.target.value = ''
        }
    }

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image()
            image.addEventListener('load', () => resolve(image))
            image.addEventListener('error', (error) => reject(error))
            image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
            image.src = url
        })

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area,
    ): Promise<Blob> => {
        const image = await createImage(imageSrc)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            throw new Error('No 2d context')
        }

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'))
                    return
                }
                resolve(blob)
            }, 'image/webp', 0.8) // Convert to WebP here with quality 0.8
        })
    }

    const handleCropAndUpload = async () => {
        if (!imageSrc || !croppedAreaPixels || !selectedSlot) return

        try {
            setUploadingSlot(selectedSlot)
            setCropModalOpen(false) // Close modal immediately

            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            const fileName = `${selectedSlot}_${Date.now()}.webp`
            const filePath = `${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('activity_images')
                .upload(filePath, croppedImageBlob, {
                    contentType: 'image/webp',
                    upsert: true
                })

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('activity_images')
                .getPublicUrl(filePath)

            // 3. Deactivate old image for this slot
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

            toast.success(`Gambar slot ${selectedSlot} berhasil diperbarui (Cropped & WebP)`)
            fetchImages()
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error("Gagal mengupload gambar")
        } finally {
            setUploadingSlot(null)
            setSelectedSlot(null)
            setImageSrc(null)
            setZoom(1)
        }
    }

    const closeCropModal = () => {
        setCropModalOpen(false)
        setImageSrc(null)
        setSelectedSlot(null)
        setZoom(1)
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
                        {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <CropIcon className="w-4 h-4" />}
                        {image ? "Ganti & Crop" : "Upload & Crop"}
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
                    <p className="text-gray-500 font-medium">Manage images for "Create Activity" modal. Uploads are cropped & converted to WebP.</p>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
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
                </div>
            )}

            {/* Cropping Modal */}
            {cropModalOpen && imageSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl border-3 border-neo-black shadow-hard">
                        <div className="p-4 border-b-2 border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg uppercase">Crop Image ({selectedSlot})</h3>
                            <button onClick={closeCropModal} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="relative w-full h-80 bg-gray-900">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspectRatio}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="p-6 bg-white space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold uppercase min-w-[3rem]">Zoom</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full accent-neo-black h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={closeCropModal}
                                    className="px-6 py-2.5 font-bold uppercase text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCropAndUpload}
                                    className="px-6 py-2.5 bg-neo-black text-white font-bold uppercase rounded-lg shadow-hard-sm hover:translate-y-[1px] hover:shadow-none transition-all text-sm flex items-center gap-2"
                                >
                                    <CropIcon className="w-4 h-4" />
                                    Crop & Upload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
