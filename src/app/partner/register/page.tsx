"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ArrowRight, Building2, User, Mail, Phone, Hash, CheckCircle, Globe, Layout, Users, MapPin, Loader2 } from "lucide-react"

import Image from "next/image"
import { PartnerOnboarding } from "@/components/PartnerOnboarding"
import { submitPartnerApplication } from "../actions"
import { TurnstileCaptcha } from "@/components/security/TurnstileCaptcha"

const AnimatedBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-gray-50">
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-[0.1]"
            style={{
                backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}
        />

        {/* Floating Badminton Bag - Gentle Hover */}
        <motion.div
            animate={{
                y: [0, -15, 0],
                rotate: [0, 2, -2, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-[10%] w-32 h-32 opacity-80"
        >
            <Image
                src="/design-2d-tas-badminton.webp"
                alt="Badminton Bag"
                width={128}
                height={128}
                className="w-full h-full object-contain drop-shadow-hard"
            />
        </motion.div>

        {/* Swinging Racket */}
        <motion.div
            animate={{
                rotate: [0, -20, 45, 0], // Wind up, Swing, Return
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.4, 0.6, 1],
                repeatDelay: 1
            }}
            className="absolute top-40 right-[15%] w-40 h-40 origin-bottom-right opacity-80"
        >
            <Image
                src="/design-2d-raket-badminton.webp"
                alt="Badminton Racket"
                width={160}
                height={160}
                className="w-full h-full object-contain drop-shadow-hard"
            />
        </motion.div>

        {/* Flying Shuttlecock - Flying across */}
        <motion.div
            animate={{
                x: [-100, 100],
                y: [0, -50],
                rotate: [180, 220]
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "circOut",
                repeatDelay: 1
            }}
            className="absolute top-32 right-[25%] w-16 h-16 opacity-90"
        >
            <Image
                src="/shuttlecock-cursor.svg"
                alt="Shuttlecock"
                width={64}
                height={64}
                className="w-full h-full object-contain drop-shadow-hard"
            />
        </motion.div>

        {/* Walking Shoes - Bobbing with slight forward movement feeling */}
        <motion.div
            animate={{
                y: [0, -20, 0],
                rotate: [-5, 5, -5]
            }}
            transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
            }}
            className="absolute bottom-20 left-[20%] w-24 h-24 opacity-80"
        >
            <Image
                src="/design-2d-sepatu-badminton.webp"
                alt="Badminton Shoes"
                width={96}
                height={96}
                className="w-full h-full object-contain drop-shadow-hard"
            />
        </motion.div>

        {/* Second Shoe slightly offset for "Left/Right" pair effect */}
        <motion.div
            animate={{
                y: [-20, 0, -20],
                rotate: [5, -5, 5]
            }}
            transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
            }}
            className="absolute bottom-24 left-[24%] w-24 h-24 opacity-60 -z-10"
        >
            <Image
                src="/design-2d-sepatu-badminton.webp"
                alt="Badminton Shoes"
                width={96}
                height={96}
                className="w-full h-full object-contain drop-shadow-hard"
            />
        </motion.div>
    </div>
)

import { SubscriptionPlan } from "@/lib/constants/plans"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export default function PartnerRegisterPage() {
    const { t } = useLanguage()
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    const [showOnboarding, setShowOnboarding] = useState(true)
    const [formData, setFormData] = useState({
        ownerName: "",
        email: "",
        phone: "",
        venueName: "",
        venueAddress: "",
        venueLatitude: null as number | null,
        venueLongitude: null as number | null,
        socialMedia: "",
        website: "",
        flooringMaterial: "",
        routineClubs: "",
        goals: [] as string[],
        subscriptionPlan: null as SubscriptionPlan | null
    })

    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)

    const handleOnboardingComplete = (selectedGoals: string[], plan?: SubscriptionPlan) => {
        setFormData(prev => ({
            ...prev,
            goals: selectedGoals,
            subscriptionPlan: plan || null
        }))
        setShowOnboarding(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.")
            return
        }

        setIsGettingLocation(true)
        setLocationStatus('idle')

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lon = position.coords.longitude

                setFormData(prev => ({
                    ...prev,
                    venueLatitude: lat,
                    venueLongitude: lon
                }))

                try {
                    // Use OpenStreetMap Nominatim for reverse geocoding
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
                        {
                            headers: {
                                'User-Agent': 'SmashBadmintonBooking/1.0' // Required by Nominatim
                            }
                        }
                    )

                    if (response.ok) {
                        const data = await response.json()
                        if (data.display_name) {
                            setFormData(prev => ({
                                ...prev,
                                venueAddress: data.display_name
                            }))
                            toast.success("Location and address detected successfully!")
                        } else {
                            toast.success("Coordinates detected, but address could not be found.")
                        }
                    } else {
                        toast.success("Coordinates detected. Please fill address manually.")
                    }
                } catch (error) {
                    console.error("Reverse geocoding error:", error)
                    toast.success("Coordinates detected. Please fill address manually.")
                }

                setLocationStatus('success')
                setIsGettingLocation(false)
            },
            (error) => {
                console.error("Geolocation error:", error)
                setLocationStatus('error')
                setIsGettingLocation(false)
                toast.error("Failed to get location. Please enter address manually.")
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (turnstileSiteKey && !captchaToken) {
                toast.error("Please complete the captcha verification first.")
                return
            }

            const result = await submitPartnerApplication({
                ...formData,
                captchaToken: captchaToken || undefined
            })

            if (result.success) {
                toast.success("Application submitted successfully!")
                setIsSubmitted(true)
            } else {
                toast.error("Failed to submit application: " + result.error)
            }
        } catch (error) {
            console.error(error)
            toast.error("An unexpected error occurred. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (showOnboarding) {
        return <PartnerOnboarding onComplete={handleOnboardingComplete} />
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-pastel-yellow flex items-center justify-center p-4 relative overflow-hidden">
                <AnimatedBackground />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-8 rounded-xl border-2 border-black shadow-hard-lg max-w-md w-full text-center relative z-10"
                >
                    <div className="w-16 h-16 bg-pastel-mint rounded-full border-2 border-black flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-3xl font-display font-bold mb-4">{t.registration_success}</h2>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                        {t.registration_success_msg}
                    </p>
                    <button
                        onClick={() => window.location.href = "/"}
                        className="bg-black text-white px-8 py-3 rounded-lg font-bold border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all shadow-hard-sm"
                    >
                        {t.back_to_home}
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-16 pb-12 px-4 relative overflow-hidden">
            <AnimatedBackground />
            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block bg-pastel-lilac px-4 py-1 rounded-full border-2 border-black shadow-hard-xs mb-4"
                    >
                        <span className="font-bold text-sm">{t.become_partners}</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-display font-bold mb-4"
                    >
                        {t.grow_business.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br className="hidden md:block" />}</span>)} <span className="text-pastel-lilac" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>Smash.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-600 text-lg max-w-2xl mx-auto"
                    >
                        {t.join_network}
                    </motion.p>
                </div>

                {/* Registration Form */}
                <motion.form
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onSubmit={handleSubmit}
                    className="bg-white/80 backdrop-blur-sm border-2 border-black rounded-xl p-6 md:p-8 shadow-hard-lg"
                >
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Personal & Contact Information */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b-2 border-black pb-2 flex items-center gap-2">
                                <User className="w-5 h-5" /> {t.owner_details}
                            </h3>

                            <div className="space-y-2">
                                <label className="font-bold text-sm">{t.owner_name}</label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    required
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:bg-white transition-colors"
                                    placeholder={t.owner_name_placeholder}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="font-bold text-sm">{t.company_email}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full p-3 pl-10 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:bg-white transition-colors"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="font-bold text-sm">{t.whatsapp_number}</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full p-3 pl-10 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:bg-white transition-colors"
                                        placeholder="0812..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Venue Details */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b-2 border-black pb-2 flex items-center gap-2">
                                <Building2 className="w-5 h-5" /> {t.venue_info}
                            </h3>

                            <div className="space-y-2">
                                <label className="font-bold text-sm">{t.venue_name}</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="venueName"
                                        required
                                        value={formData.venueName}
                                        onChange={handleChange}
                                        className="w-full p-3 pl-10 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:bg-white transition-colors"
                                        placeholder={t.venue_name_placeholder}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="font-bold text-sm">{t.venue_location}</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="venueAddress"
                                        required
                                        value={formData.venueAddress}
                                        onChange={handleChange}
                                        className="w-full p-3 pl-10 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:bg-white transition-colors"
                                        placeholder={t.venue_location_placeholder}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        disabled={isGettingLocation}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-pastel-lilac border-2 border-black rounded-lg hover:bg-pastel-lilac/80 transition-colors disabled:opacity-50"
                                    >
                                        {isGettingLocation ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> {t.detecting}</>
                                        ) : (
                                            <><MapPin className="w-4 h-4" /> {t.use_current_location}</>
                                        )}
                                    </button>
                                    {locationStatus === 'success' && (
                                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> {t.coords_detected}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="font-bold text-sm">{t.social_media}</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="socialMedia"
                                        required
                                        value={formData.socialMedia}
                                        onChange={handleChange}
                                        className="w-full p-3 pl-10 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:bg-white transition-colors"
                                        placeholder="Instagram/Facebook URL or Handle"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="font-bold text-sm">{t.website}</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="w-full p-3 pl-10 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:bg-white transition-colors"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="font-bold text-sm">{t.flooring_material}</label>
                                <div className="relative">
                                    <Layout className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="flooringMaterial"
                                        required
                                        value={formData.flooringMaterial}
                                        onChange={handleChange}
                                        className="w-full p-3 pl-10 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:bg-white transition-colors"
                                        placeholder={t.flooring_placeholder}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="mt-8 pt-8 border-t-2 border-gray-100">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5" /> {t.club_details}
                        </h3>
                        <div className="space-y-2">
                            <label className="font-bold text-sm">{t.routine_clubs}</label>
                            <textarea
                                name="routineClubs"
                                required
                                value={formData.routineClubs}
                                onChange={handleChange}
                                rows={4}
                                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:bg-white transition-colors"
                                placeholder={t.routine_clubs_placeholder}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-10 pt-6 border-t-2 border-black flex justify-end">
                        <div className="w-full flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                            {turnstileSiteKey && (
                                <div className="flex flex-col gap-2">
                                    <TurnstileCaptcha siteKey={turnstileSiteKey} onTokenChange={setCaptchaToken} />
                                    <p className="text-xs text-gray-500">Protected by Cloudflare Turnstile.</p>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-pastel-acid text-black px-8 py-4 rounded-xl font-bold text-lg border-2 border-black shadow-hard-md hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    t.submitting
                                ) : (
                                    <>
                                        {t.submit_application} <ArrowRight className="w-6 h-6" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.form>
            </div>
        </div>
    )
}
