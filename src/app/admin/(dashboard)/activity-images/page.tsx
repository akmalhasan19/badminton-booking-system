"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, Trash2, CheckCircle, Loader2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

interface ActivityImage {
    id: string
    url: string
    created_at: string
    is_active: boolean
}

export default function ActivityImagesPage() {
    const [images, setImages] = useState<ActivityImage[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
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
                .order('created_at', { ascending: false })

            if (error) throw error
            setImages(data || [])
        } catch (error) {
            console.error('Error fetching images:', error)
            toast.error("Gagal memuat gambar")
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB")
            return
        }

        try {
            setUploading(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
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

            // 3. Save to Database
            const { error: dbError } = await supabase
                .from('activity_images')
                .insert([{ url: publicUrl, is_active: true }])

            if (dbError) throw dbError

            toast.success("Gambar berhasil diupload")
            fetchImages()
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error("Gagal mengupload gambar")
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDelete = async (id: string, url: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus gambar ini?")) return

        try {
            // 1. Delete from Storage (optional strictly speaking if just removing record, but good practice)
            // Extract filename from URL
            const fileName = url.split('/').pop()
            if (fileName) {
                await supabase.storage
                    .from('activity_images')
                    .remove([fileName])
            }

            // 2. Delete from Database
            const { error } = await supabase
                .from('activity_images')
                .delete()
                .eq('id', id)

            if (error) throw error

            toast.success("Gambar berhasil dihapus")
            setImages(images.filter(img => img.id !== id))
        } catch (error) {
            console.error('Error deleting image:', error)
            toast.error("Gagal menghapus gambar")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Activity Images</h1>
                    <p className="text-gray-500 font-medium">Manage images displayed in the "Create Activity" modal.</p>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-neo-black text-white px-6 py-3 font-bold uppercase border-2 border-transparent hover:bg-gray-800 transition-all shadow-hard-sm hover:translate-y-1 hover:shadow-none flex items-center gap-2"
                    >
                        {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        {uploading ? "Uploading..." : "Upload New Image"}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                </div>
            ) : images.length === 0 ? (
                <div className="bg-white border-3 border-neo-black p-12 text-center rounded-xl border-dashed">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Images Yet</h3>
                    <p className="text-gray-500 mb-6">Upload images to start displaying them in the app.</p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-neo-blue font-bold hover:underline uppercase"
                    >
                        Upload First Image
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.map((image) => (
                        <div key={image.id} className="group relative aspect-square bg-gray-100 border-3 border-neo-black shadow-hard overflow-hidden rounded-xl">
                            <img
                                src={image.url}
                                alt="Activity"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                    onClick={() => handleDelete(image.id, image.url)}
                                    className="p-3 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                    title="Delete Image"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="absolute top-2 right-2">
                                {image.is_active && (
                                    <div className="bg-green-500 text-white p-1 rounded-full shadow-sm" title="Active">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
