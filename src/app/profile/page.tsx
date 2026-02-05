"use client"

import { User, Mail, Phone, MapPin, Camera, Calendar, CreditCard, Bell, Settings, HelpCircle, LogOut, ChevronRight, Gift, Lock, Shield, AlertTriangle, Loader2, CheckCircle, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { SmashLogo } from "@/components/SmashLogo"
import { MobileHeader } from "@/components/MobileHeader"
import { ImageCropper } from "@/components/ImageCropper"
import { uploadAvatar, getCurrentUser, updateProfile } from "@/lib/auth/actions"
import { sendPasswordResetCode, verifyPasswordResetCode, updatePasswordWithOTP } from "@/lib/auth/password-reset-actions"
import { useState, useRef, useEffect } from "react"
import { Toast, ToastType } from "@/components/ui/Toast"

export default function ProfilePage() {
    const router = useRouter()
    const pathname = usePathname()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Image Cropper State
    const [imageToCrop, setImageToCrop] = useState<string | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null) // To display optimized Avatar

    // Toast State
    const [toast, setToast] = useState<{ message: string, type: ToastType, isVisible: boolean }>({
        message: '',
        type: 'success',
        isVisible: false
    })

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type, isVisible: true })
    }

    const navItems = [
        { label: "Overview", path: "/dashboard", active: false },
        { label: "Bookings", path: "/bookings", active: false },
        { label: "Schedule", path: "/schedule", active: false },
        { label: "Profile", path: "/profile", active: true },
    ]

    const menuItems = [
        { icon: User, label: "Informasi Akun", path: "/profile" },
        { icon: Calendar, label: "Booking Saya", path: "/bookings" },
        // { icon: CreditCard, label: "Metode Pembayaran", path: "/payment-methods" }, // Future
        // { icon: Bell, label: "Notifikasi", path: "/notifications" }, // Future
        { icon: Settings, label: "Pengaturan", path: "/settings" },
        { icon: HelpCircle, label: "Bantuan & Support", path: "/help" }
    ]

    const [activeTab, setActiveTab] = useState<'info' | 'security' | 'billing'>('info')

    // Password Reset State
    const [passwordStep, setPasswordStep] = useState<1 | 2 | 3>(1)
    const [resetEmail, setResetEmail] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const reader = new FileReader()
            reader.onload = () => {
                setImageToCrop(reader.result as string)
            }
            reader.readAsDataURL(event.target.files[0])
        }
        // Reset input value to allow selecting same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleCropComplete = async (croppedImageUrl: string) => {
        setImageToCrop(null) // Close cropper
        showToast("Mengupload foto profil...", 'success')

        try {
            // Convert Base64/DataURL to Blob
            const response = await fetch(croppedImageUrl)
            const blob = await response.blob()

            const formData = new FormData()
            formData.append('file', blob, 'avatar.jpg')

            const result = await uploadAvatar(formData)
            if (result.success && result.avatarUrl) {
                setAvatarUrl(result.avatarUrl)
                showToast("Foto profil berhasil diperbarui", 'success')
            } else {
                showToast("Gagal mengupload foto", 'error')
            }
        } catch (error) {
            console.error("Upload error:", error)
            showToast("Terjadi kesalahan saat upload", 'error')
        }
    }

    const handleCropCancel = () => {
        setImageToCrop(null)
    }

    // Profile state
    const [isLoading, setIsLoading] = useState(false)
    const [profile, setProfile] = useState({
        name: '',
        gender: 'Laki-laki',
        day: '1',
        month: 'Jan',
        year: '2000',
        city: '',
        phone: '',
        email: ''
    })

    // Fetch user data on mount
    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser()
            if (user) {
                if (user.avatar_url) setAvatarUrl(user.avatar_url)

                const dob = user.date_of_birth ? new Date(user.date_of_birth) : null

                setProfile({
                    name: user.name || '',
                    gender: user.gender || 'Laki-laki',
                    day: dob ? dob.getDate().toString() : '1',
                    month: dob ? dob.toLocaleDateString('id-ID', { month: 'short' }) : 'Jan',
                    year: dob ? dob.getFullYear().toString() : '2000',
                    city: user.city || '',
                    phone: user.phone || '',
                    email: user.email || ''
                })
            }
        }
        fetchUser()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Convert Month Name to Index for Date Object
            const monthMap: { [key: string]: number } = {
                "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "Mei": 4, "Jun": 5,
                "Jul": 6, "Agu": 7, "Sep": 8, "Okt": 9, "Nov": 10, "Des": 11
            }

            // Construct Date string YYYY-MM-DD
            // Be careful with timezones, simpler to store as string YYYY-MM-DD for consistency
            const monthIndex = monthMap[profile.month] || 0
            const date = new Date(parseInt(profile.year), monthIndex, parseInt(profile.day), 12) // Noon to avoid timezone shift issues
            const dobString = date.toISOString().split('T')[0]

            const result = await updateProfile({
                full_name: profile.name,
                gender: profile.gender,
                date_of_birth: dobString,
                city: profile.city,
                phone: profile.phone
            })

            if (result.success) {
                showToast("Profil berhasil diperbarui", 'success')
            } else {
                showToast(result.error || "Gagal memperbarui profil", 'error')
            }
        } catch (error) {
            console.error("Save error:", error)
            showToast("Terjadi kesalahan sistem", 'error')
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <main className="min-h-screen bg-white pt-0 md:pt-6 pb-12 relative overflow-hidden">
            {/* Grid Background */}
            <div
                className="absolute inset-0 z-0 w-full h-full pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(160, 82, 45, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 82, 45, 0.15) 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}
            />

            {/* Logo Link */}
            <div
                onClick={() => router.push('/')}
                className="absolute top-6 right-8 hidden md:flex items-center gap-2 cursor-pointer group z-20"
                title="Kembali ke Beranda"
            >
                <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                    <SmashLogo className="w-full h-full bg-black" />
                </div>
                <span className="text-xl font-display font-bold tracking-tight">Smash<span className="text-pastel-lilac">.</span></span>
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                    Kembali ke Beranda
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-black transform rotate-45"></div>
                </div>
            </div>

            <MobileHeader title="Edit Profile" backPath="/account" />

            <div className="max-w-7xl mx-auto px-4 relative z-10 pt-6 md:pt-0">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">

                    {/* Left Sidebar - Hidden on mobile */}
                    <div className="hidden md:block space-y-6">
                        {/* Profile Summary Card */}
                        <div className="bg-white border-2 border-black rounded-xl p-6 shadow-hard text-center flex flex-col items-center">
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
                            <h2 className="font-bold text-xl">{profile.name || "User"}</h2>
                            <p className="text-gray-500 text-sm font-medium">Member</p>
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

                                    <form onSubmit={handleSave} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-500">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none transition-colors"
                                            />
                                            <p className="text-xs text-gray-400">Nama lengkap Anda akan disingkat untuk nama profil.</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-500">Kelamin</label>
                                                <div className="relative">
                                                    <select
                                                        value={profile.gender}
                                                        onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none appearance-none cursor-pointer"
                                                    >
                                                        <option value="Laki-laki">Laki-laki</option>
                                                        <option value="Perempuan">Perempuan</option>
                                                    </select>
                                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-500">Tanggal Lahir</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="relative">
                                                        <select
                                                            value={profile.day}
                                                            onChange={(e) => setProfile({ ...profile, day: e.target.value })}
                                                            className="w-full px-2 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none appearance-none cursor-pointer text-center"
                                                        >
                                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                                <option key={d} value={d}>{d}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 w-3 h-3 text-gray-400 pointer-events-none" />
                                                    </div>
                                                    <div className="relative col-span-1">
                                                        <select
                                                            value={profile.month}
                                                            onChange={(e) => setProfile({ ...profile, month: e.target.value })}
                                                            className="w-full px-2 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none appearance-none cursor-pointer text-center"
                                                        >
                                                            {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"].map((m) => (
                                                                <option key={m} value={m}>{m}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 w-3 h-3 text-gray-400 pointer-events-none" />
                                                    </div>
                                                    <div className="relative">
                                                        <select
                                                            value={profile.year}
                                                            onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                                                            className="w-full px-2 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none appearance-none cursor-pointer text-center"
                                                        >
                                                            {Array.from({ length: 50 }, (_, i) => 2010 - i).map(y => (
                                                                <option key={y} value={y}>{y}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 w-3 h-3 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-500">Kota Tempat Tinggal</label>
                                            <input
                                                type="text"
                                                value={profile.city}
                                                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                                placeholder="Kota Tempat Tinggal"
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none transition-colors"
                                            />
                                        </div>

                                        {/* Contact Section Moved Inside Form for Single Save Button */}
                                        <div className="pt-8 mt-8 border-t-2 border-dashed border-gray-300">
                                            <h2 className="font-bold text-lg mb-6">Kontak</h2>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-500">Email</label>
                                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200 cursor-not-allowed opacity-80">
                                                        <Mail className="w-5 h-5 text-gray-400" />
                                                        <span className="font-medium text-gray-600 truncate">{profile.email}</span>
                                                        <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded shrink-0">Verified</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400">Email tidak dapat diubah.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-500">Nomor Ponsel</label>
                                                    <div className="relative">
                                                        <input
                                                            type="tel"
                                                            value={profile.phone}
                                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                            placeholder="0812..."
                                                            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none transition-colors"
                                                        />
                                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 sticky bottom-0 bg-white/95 backdrop-blur py-4 z-10">
                                            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="px-8 py-2.5 bg-pastel-acid text-black border-2 border-black rounded-lg font-bold shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                {isLoading ? 'Menyimpan...' : 'Simpan'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white border-2 border-black rounded-xl shadow-hard p-8">
                                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                                    <h2 className="font-bold text-lg">Ubah Password</h2>
                                    {/* Step indicator */}
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3].map((step) => (
                                            <div
                                                key={step}
                                                className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-sm font-bold transition-colors ${passwordStep >= step
                                                    ? 'bg-pastel-acid text-black'
                                                    : 'bg-gray-100 text-gray-400'
                                                    }`}
                                            >
                                                {passwordStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Error/Success Messages */}
                                <AnimatePresence mode="wait">
                                    {passwordError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg text-red-700 text-sm font-medium"
                                        >
                                            {passwordError}
                                        </motion.div>
                                    )}
                                    {passwordSuccess && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-green-700 text-sm font-medium flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {passwordSuccess}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence mode="wait">
                                    {/* Step 1: Email Verification */}
                                    {passwordStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                                                <p className="text-sm text-blue-700 font-medium">
                                                    Untuk keamanan, masukkan email yang terdaftar untuk menerima kode verifikasi.
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-500">Email Terdaftar</label>
                                                <div className="relative">
                                                    <input
                                                        type="email"
                                                        value={resetEmail}
                                                        onChange={(e) => setResetEmail(e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none transition-colors"
                                                        placeholder="masukkan@email.com"
                                                    />
                                                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={passwordLoading || !resetEmail}
                                                onClick={async () => {
                                                    setPasswordLoading(true)
                                                    setPasswordError(null)
                                                    const result = await sendPasswordResetCode(resetEmail)
                                                    setPasswordLoading(false)
                                                    if (result.error) {
                                                        setPasswordError(result.error)
                                                    } else {
                                                        setPasswordSuccess(result.message || 'Kode verifikasi telah dikirim')
                                                        setTimeout(() => {
                                                            setPasswordSuccess(null)
                                                            setPasswordStep(2)
                                                        }, 1500)
                                                    }
                                                }}
                                                className="w-full px-8 py-3 bg-pastel-acid text-black border-2 border-black rounded-lg font-bold shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {passwordLoading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Mengirim...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="w-5 h-5" />
                                                        Kirim Kode Verifikasi
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* Step 2: OTP Verification */}
                                    {passwordStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                                                <p className="text-sm text-blue-700 font-medium">
                                                    Kode verifikasi 6 digit telah dikirim ke <strong>{resetEmail}</strong>
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-500">Kode Verifikasi</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={otpCode}
                                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                        className="w-full px-4 py-4 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-mono text-2xl text-center tracking-[0.5em] outline-none transition-colors"
                                                        placeholder="000000"
                                                        maxLength={6}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 text-center mt-2">
                                                    Kode berlaku selama 10 menit
                                                </p>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPasswordStep(1)
                                                        setOtpCode('')
                                                        setPasswordError(null)
                                                    }}
                                                    className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                    Kembali
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={passwordLoading || otpCode.length !== 6}
                                                    onClick={async () => {
                                                        setPasswordLoading(true)
                                                        setPasswordError(null)
                                                        const result = await verifyPasswordResetCode(resetEmail, otpCode)
                                                        setPasswordLoading(false)
                                                        if (result.error) {
                                                            setPasswordError(result.error)
                                                        } else {
                                                            setPasswordSuccess('Kode berhasil diverifikasi!')
                                                            setTimeout(() => {
                                                                setPasswordSuccess(null)
                                                                setPasswordStep(3)
                                                            }, 1000)
                                                        }
                                                    }}
                                                    className="flex-1 px-8 py-3 bg-pastel-acid text-black border-2 border-black rounded-lg font-bold shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {passwordLoading ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Memverifikasi...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-5 h-5" />
                                                            Verifikasi Kode
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 3: New Password */}
                                    {passwordStep === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="bg-green-50 border-2 border-green-200 p-4 rounded-xl flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <p className="text-sm text-green-700 font-medium">
                                                    Email terverifikasi! Silakan buat password baru.
                                                </p>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-500">Password Baru</label>
                                                    <div className="relative">
                                                        <input
                                                            type="password"
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
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
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black rounded-lg font-medium outline-none transition-colors"
                                                            placeholder="Ulangi password baru"
                                                        />
                                                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-yellow-300 border-2 border-black p-5 rounded-xl flex gap-4 items-start shadow-hard relative overflow-hidden">
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

                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPasswordStep(1)
                                                        setResetEmail('')
                                                        setOtpCode('')
                                                        setNewPassword('')
                                                        setConfirmPassword('')
                                                        setPasswordError(null)
                                                    }}
                                                    className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={passwordLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
                                                    onClick={async () => {
                                                        if (newPassword !== confirmPassword) {
                                                            setPasswordError('Password tidak cocok')
                                                            return
                                                        }
                                                        if (newPassword.length < 8) {
                                                            setPasswordError('Password harus minimal 8 karakter')
                                                            return
                                                        }
                                                        setPasswordLoading(true)
                                                        setPasswordError(null)
                                                        const result = await updatePasswordWithOTP(resetEmail, otpCode, newPassword)
                                                        setPasswordLoading(false)
                                                        if (result.error) {
                                                            setPasswordError(result.error)
                                                        } else {
                                                            setPasswordSuccess('Password berhasil diubah!')
                                                            // Reset form after success
                                                            setTimeout(() => {
                                                                setPasswordStep(1)
                                                                setResetEmail('')
                                                                setOtpCode('')
                                                                setNewPassword('')
                                                                setConfirmPassword('')
                                                                setPasswordSuccess(null)
                                                            }, 3000)
                                                        }
                                                    }}
                                                    className="flex-1 px-8 py-3 bg-pastel-acid text-black border-2 border-black rounded-lg font-bold shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {passwordLoading ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Menyimpan...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Lock className="w-5 h-5" />
                                                            Ubah Password
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-300">
                                    <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                                        Device Management
                                        <span className="text-xs font-normal bg-black text-white px-2 py-0.5 rounded-full">1 Active</span>
                                    </h2>
                                    <div className="bg-white border-2 border-black rounded-xl p-5 shadow-hard flex justify-between items-center group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-default relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 border-r-2 border-black"></div>

                                        <div className="flex items-center gap-5 pl-4">
                                            <div className="w-12 h-12 bg-pastel-blue border-2 border-black rounded-lg flex items-center justify-center shrink-0 shadow-sm relative group-hover:scale-105 transition-transform">
                                                <div className="absolute inset-0 bg-white/20 rounded-lg"></div>
                                                <Shield className="w-6 h-6 text-black relative z-10" />
                                            </div>
                                            <div>
                                                <h4 className="font-display font-bold text-lg leading-tight">Chrome on Windows 11</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full border border-black"></span>
                                                    <p className="text-xs font-bold text-gray-600">Device ini • Jakarta, Indonesia</p>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black uppercase text-black bg-green-400 px-4 py-1.5 rounded-lg border-2 border-black shadow-sm transform group-hover:rotate-2 transition-transform">
                                            Aktif
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
