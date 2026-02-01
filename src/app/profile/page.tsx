"use client"

import { User, Mail, Phone, MapPin, Camera, Calendar, CreditCard, Bell, Settings, HelpCircle, LogOut, ChevronRight, Gift, Lock, Shield, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { SmashLogo } from "@/components/SmashLogo"
import { ImageCropper } from "@/components/ImageCropper"
import { uploadAvatar, getCurrentUser } from "@/lib/auth/actions"
import { useState, useRef, useEffect } from "react"
import { Toast, ToastType } from "@/components/ui/Toast"

export default function ProfilePage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'info' | 'security'>('info')

    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [imageToCrop, setImageToCrop] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Toast state
    const [toast, setToast] = useState<{ message: string, type: ToastType, isVisible: boolean }>({
        message: '',
        type: 'success',
        isVisible: false
    })

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ message, type, isVisible: true })
    }

    // Fetch user data on mount
    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser()
            if (user?.avatar_url) {
                setAvatarUrl(user.avatar_url)
            }
        }
        fetchUser()
    }, [])

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => {
                setImageToCrop(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
        // Reset file input so same file can be selected again
        e.target.value = ''
    }

    const handleCropComplete = async (croppedImageUrl: string) => {
        // Optimistic update
        setAvatarUrl(croppedImageUrl)
        setImageToCrop(null)

        try {
            // Convert Data URL to Blob
            const response = await fetch(croppedImageUrl)
            const blob = await response.blob()
            const file = new File([blob], "avatar.webp", { type: "image/webp" })

            const formData = new FormData()
            formData.append('file', file)

            const result = await uploadAvatar(formData)

            if (result.error) {
                console.error("Upload failed:", result.error)
                showToast(result.error, 'error')
                // Revert optimistic update if needed or just leave it for session
            } else if (result.avatarUrl) {
                // Success - backend updated
                console.log("Avatar updated:", result.avatarUrl)
                showToast("Foto profil berhasil diperbarui", 'success')
                // Dispatch event to update Navbar
                window.dispatchEvent(new Event('user_updated'))
                // setAvatarUrl(result.avatarUrl) // Server action revalidates path, so this might be redundant but safe
            }
        } catch (error) {
            console.error("Error uploading avatar:", error)
            showToast("Terjadi kesalahan saat mengupload. Silakan coba lagi.", 'error')
        }
    }

    const handleCropCancel = () => {
        setImageToCrop(null)
    }

    // Sidebar menu items
    const menuItems = [
        { label: "Booking Saya", icon: Calendar, path: "/bookings", color: "text-blue-600" },
        { label: "Kartu Saya", icon: CreditCard, path: "/payment-methods", color: "text-blue-600" },
        { label: "Notifikasi", icon: Bell, path: "/notifications", color: "text-blue-600" },
        { label: "Pengaturan", icon: Settings, path: "/settings", color: "text-blue-600" },
        { label: "Pusat Bantuan", icon: HelpCircle, path: "/help", color: "text-blue-600" },
    ]

    return (
        <main className="min-h-screen bg-white pt-6 pb-12 relative overflow-hidden">
            {/* Grid Background */}
            <div
                className="absolute inset-0 z-0 w-full h-full pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(160, 82, 45, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 82, 45, 0.15) 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}
            />

            {/* Logo Link - Absolute Top Right */}
            <div
                onClick={() => router.push('/')}
                className="absolute top-6 right-8 flex items-center gap-2 cursor-pointer group z-20"
            >
                <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                    <SmashLogo className="w-full h-full bg-black" />
                </div>
                <span className="text-xl font-display font-bold tracking-tight">Smash<span className="text-pastel-lilac">.</span></span>
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">

                    {/* Left Sidebar */}
                    <div className="space-y-6">
                        {/* Profile Summary Card */}
                        <div className="bg-white border-2 border-black rounded-xl p-6 shadow-hard text-center flex flex-col items-center">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div onClick={handleAvatarClick} className="relative mb-4 group cursor-pointer">
                                <div className="w-20 h-20 bg-gray-100 rounded-full border-2 border-black flex items-center justify-center overflow-hidden">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-display font-bold text-2xl text-gray-400">AH</span>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <h2 className="font-bold text-xl">Akmal Hasan</h2>
                            <p className="text-gray-500 text-sm font-medium">Google</p>
                        </div>

                        {/* Member Tier Banner */}
                        <div className="bg-[#C19A6B] border-2 border-black rounded-xl p-4 shadow-hard text-white relative overflow-hidden group cursor-pointer hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10 blur-xl"></div>
                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <p className="text-xs font-bold uppercase opacity-80">Member Status</p>
                                    <p className="font-display font-black text-lg">Bronze Priority</p>
                                </div>
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Points Balance */}
                        <div className="bg-white border-2 border-black rounded-xl p-4 shadow-hard flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-pastel-yellow border-2 border-black flex items-center justify-center">
                                <Gift className="w-4 h-4 text-black" />
                            </div>
                            <div>
                                <p className="font-display font-black text-lg leading-none">0</p>
                                <p className="text-xs font-bold text-gray-500">Poin</p>
                            </div>
                        </div>

                        {/* Navigation Menu */}
                        <div className="bg-white border-2 border-black rounded-xl shadow-hard overflow-hidden">
                            {menuItems.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => router.push(item.path)}
                                    className="w-full text-left px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors flex items-center gap-3 font-bold text-sm text-gray-700"
                                >
                                    <item.icon className="w-5 h-5 text-gray-400" />
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <button className="w-full flex items-center justify-center gap-2 text-red-600 font-bold py-3 hover:bg-red-50 rounded-xl transition-colors">
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </button>
                    </div>

                    {/* Right Content */}
                    <div className="space-y-6">
                        <h1 className="text-3xl font-display font-black">Pengaturan</h1>

                        {/* Tabs */}
                        <div className="flex gap-8 border-b-2 border-gray-100">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`pb-4 border-b-4 font-bold transition-colors ${activeTab === 'info' ? 'border-pastel-acid text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
                            >
                                Informasi Akun
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`pb-4 border-b-4 font-bold transition-colors ${activeTab === 'security' ? 'border-pastel-acid text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
                            >
                                Password & Keamanan
                            </button>
                        </div>

                        {/* Main Content Area */}
                        {activeTab === 'info' ? (
                            <>
                                <div className="bg-white border-2 border-black rounded-xl shadow-hard p-8">
                                    <h2 className="font-bold text-lg mb-6 border-b border-gray-100 pb-4">Data Pribadi</h2>

                                    <form className="space-y-6">
                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-500">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                defaultValue="Akmal Hasan"
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none transition-colors"
                                            />
                                            <p className="text-xs text-gray-400">Nama lengkap Anda akan disingkat untuk nama profil.</p>
                                        </div>

                                        {/* Gender & Birth Date Row */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-500">Kelamin</label>
                                                <div className="relative">
                                                    <select defaultValue="Laki-laki" className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none appearance-none cursor-pointer">
                                                        <option>Laki-laki</option>
                                                        <option>Perempuan</option>
                                                    </select>
                                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-500">Tanggal Lahir</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="relative">
                                                        <select defaultValue="19" className="w-full px-2 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none appearance-none cursor-pointer text-center">
                                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                                <option key={d} value={d}>{d}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 w-3 h-3 text-gray-400 pointer-events-none" />
                                                    </div>
                                                    <div className="relative col-span-1">
                                                        <select defaultValue="Mar" className="w-full px-2 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none appearance-none cursor-pointer text-center">
                                                            {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"].map((m) => (
                                                                <option key={m} value={m}>{m}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 w-3 h-3 text-gray-400 pointer-events-none" />
                                                    </div>
                                                    <div className="relative">
                                                        <select defaultValue="2003" className="w-full px-2 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none appearance-none cursor-pointer text-center">
                                                            {Array.from({ length: 50 }, (_, i) => 2010 - i).map(y => (
                                                                <option key={y} value={y}>{y}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 w-3 h-3 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* City */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-500">Kota Tempat Tinggal</label>
                                            <input
                                                type="text"
                                                placeholder="Kota Tempat Tinggal"
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none transition-colors"
                                            />
                                        </div>

                                        {/* Submit Buttons */}
                                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                            <button type="button" className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                                                Batal
                                            </button>
                                            <button type="submit" className="px-8 py-2.5 bg-pastel-acid text-black border-2 border-black rounded-lg font-bold shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                                Simpan
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Contact Info Section */}
                                <div className="bg-white border-2 border-black rounded-xl shadow-hard p-8">
                                    <h2 className="font-bold text-lg mb-6 border-b border-gray-100 pb-4">Kontak</h2>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-500">Email</label>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                                                <Mail className="w-5 h-5 text-gray-400" />
                                                <span className="font-medium">akmal@example.com</span>
                                                <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Verified</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-500">Nomor Ponsel</label>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                                                <Phone className="w-5 h-5 text-gray-400" />
                                                <span className="font-medium">+62 812 3456 7890</span>
                                                <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white border-2 border-black rounded-xl shadow-hard p-8">
                                <h2 className="font-bold text-lg mb-6 border-b border-gray-100 pb-4">Ubah Password</h2>

                                <form className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-500">Password Saat Ini</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none transition-colors"
                                                placeholder="Masukkan password lama"
                                            />
                                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-500">Password Baru</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none transition-colors"
                                                    placeholder="Minimal 8 karakter"
                                                />
                                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-500">Konfirmasi Password</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none transition-colors"
                                                    placeholder="Ulangi password baru"
                                                />
                                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-yellow-300 border-2 border-black p-5 rounded-xl flex gap-4 items-start shadow-hard relative overflow-hidden">
                                        {/* Decorative background element */}
                                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-white/30 rounded-full blur-xl pointer-events-none"></div>

                                        <div className="bg-black/5 p-2 rounded-lg border-2 border-black/10 shrink-0">
                                            <AlertTriangle className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <h4 className="font-display font-bold text-black text-base">Tips Keamanan</h4>
                                            <p className="text-sm text-black/80 font-medium mt-1 leading-relaxed">
                                                Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol untuk password yang lebih kuat.
                                                Jangan gunakan tanggal lahir atau informasi pribadi yang mudah ditebak.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                        <button type="button" className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                                            Batal
                                        </button>
                                        <button type="submit" className="px-8 py-2.5 bg-pastel-acid text-black border-2 border-black rounded-lg font-bold shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                            Ubah Password
                                        </button>
                                    </div>
                                </form>

                                <div className="mt-12 pt-8 border-t-2 border-gray-100">
                                    <h2 className="font-bold text-lg mb-6">Device Management</h2>
                                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 flex justify-between items-center group hover:border-black transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center">
                                                <Shield className="w-5 h-5 text-green-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold">Chrome on Windows 11</h4>
                                                <p className="text-xs text-gray-500">Device ini • Jakarta, Indonesia</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                                            Aktif Sekarang
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Cropper Modal */}
            {imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </main>
    )
}
