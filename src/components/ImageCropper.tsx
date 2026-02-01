"use client"

import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageCropperProps {
    imageSrc: string
    onCropComplete: (croppedImageUrl: string) => void
    onCancel: () => void
}

// Helper function to create cropped image
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
    const image = new Image()
    image.src = imageSrc
    await new Promise((resolve) => { image.onload = resolve })

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

    return canvas.toDataURL('image/jpeg', 0.9)
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

    const onCropChange = useCallback((crop: { x: number; y: number }) => {
        setCrop(crop)
    }, [])

    const onZoomChange = useCallback((zoom: number) => {
        setZoom(zoom)
    }, [])

    const onCropAreaComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleConfirm = async () => {
        if (croppedAreaPixels) {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
            onCropComplete(croppedImage)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white border-2 border-black rounded-2xl shadow-hard-lg w-full max-w-lg mx-4 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b-2 border-black">
                        <h3 className="font-display font-bold text-lg">Atur Foto Profil</h3>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Cropper Area */}
                    <div className="relative w-full h-80 bg-gray-900">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropAreaComplete}
                        />
                    </div>

                    {/* Zoom Controls */}
                    <div className="p-4 border-t-2 border-black bg-gray-50">
                        <div className="flex items-center gap-4">
                            <ZoomOut className="w-5 h-5 text-gray-400" />
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-pastel-acid"
                            />
                            <ZoomIn className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 p-4 border-t-2 border-gray-100">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors border-2 border-gray-200"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 px-6 py-3 bg-pastel-acid text-black border-2 border-black rounded-xl font-bold shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            Simpan
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
