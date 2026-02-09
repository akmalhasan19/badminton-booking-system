"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ArrowRight, User, Mail, Phone, Trophy, Award, Clock, FileText, CheckCircle, ShieldCheck, DollarSign } from "lucide-react"
import Image from "next/image"
import { submitCoachApplication } from "../actions"

const AnimatedBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-gray-50">
        <div className="absolute inset-0 opacity-[0.1]"
            style={{
                backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}
        />
        {/* Floating elements similar to partner page but coach themed if possible */}
        <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-[10%] w-32 h-32 opacity-80"
        >
            <Image src="/design-2d-raket-badminton.webp" alt="Racket" width={128} height={128} className="w-full h-full object-contain drop-shadow-hard" />
        </motion.div>
    </div>
)

export default function CoachRegisterPage() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        specialization: "",
        experience: "",
        level: "Club",
        certification: "",
        bio: "",
        priceConfig: "150000",
        availability: "Weekend"
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const result = await submitCoachApplication(formData)
            if (result.success) {
                setIsSubmitted(true)
                toast.success("Application submitted!")
            } else {
                toast.error("Failed to submit")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
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
                    <h2 className="text-3xl font-display font-bold mb-4">Application Received!</h2>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                        Thanks for applying to be a Smash Coach. We will review your qualifications and get back to you shortly.
                    </p>
                    <button
                        onClick={() => window.location.href = "/"}
                        className="bg-black text-white px-8 py-3 rounded-lg font-bold border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all shadow-hard-sm"
                    >
                        Back to Home
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden">
            <AnimatedBackground />
            <div className="max-w-3xl mx-auto relative z-10">
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block bg-pastel-mint px-4 py-1 rounded-full border-2 border-black shadow-hard-xs mb-4"
                    >
                        <span className="font-bold text-sm">Join the Elite</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-display font-bold mb-4"
                    >
                        BE A COACH <span className="text-pastel-mint" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>PRO.</span>
                    </motion.h1>
                    <p className="text-gray-600 text-lg max-w-xl mx-auto">
                        Share your expertise, train the next generation, and earn with Smash & Serve.
                    </p>
                </div>

                <motion.form
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="bg-white/80 backdrop-blur-sm border-2 border-black rounded-xl p-6 md:p-8 shadow-hard-lg space-y-8"
                >
                    {/* Personal Info */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 border-b-2 border-gray-100 pb-2">
                            <User className="w-5 h-5" /> Personal Details
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold">Full Name</label>
                                <input name="fullName" required value={formData.fullName} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-black transition-colors" placeholder="Budi Santoso" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full p-3 pl-10 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-black transition-colors" placeholder="coach@example.com" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold">Phone (WhatsApp)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full p-3 pl-10 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-black transition-colors" placeholder="0812..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professional Profile */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 border-b-2 border-gray-100 pb-2">
                            <Trophy className="w-5 h-5" /> Professional Profile
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold">Specialization</label>
                                <input name="specialization" required value={formData.specialization} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-black transition-colors" placeholder="Singles, Doubles, Tactics..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold">Years Experience</label>
                                <input name="experience" required value={formData.experience} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-black transition-colors" placeholder="e.g. 5 Years" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold">Coaching Level</label>
                                <select name="level" value={formData.level} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-black transition-colors">
                                    <option value="Club">Club Level</option>
                                    <option value="Provincial">Provincial</option>
                                    <option value="National">National</option>
                                    <option value="International">International</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold">Certification (Optional)</label>
                                <div className="relative">
                                    <Award className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                    <input name="certification" value={formData.certification} onChange={handleChange} className="w-full p-3 pl-10 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-black transition-colors" placeholder="BWF Level 1, PBSI..." />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold">Short Bio</label>
                            <textarea name="bio" rows={3} required value={formData.bio} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-black transition-colors" placeholder="Tell us about your coaching philosophy..." />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4 border-t-2 border-black flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-black text-white px-8 py-4 rounded-xl font-bold text-lg border-2 border-transparent hover:bg-gray-800 hover:scale-[1.02] transition-all shadow-hard-md flex items-center gap-2"
                        >
                            {isSubmitting ? "Submitting..." : <>Submit Application <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </div>
                </motion.form>
            </div>
        </div>
    )
}
