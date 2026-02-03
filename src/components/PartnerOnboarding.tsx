"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Check, Sparkles, TrendingUp, Calendar, CreditCard, Users, Trophy, Gem } from "lucide-react"
import Image from "next/image"
import { SubscriptionPlanSelector } from "@/components/SubscriptionPlanSelector"
import { SubscriptionPlan } from "@/lib/constants/plans"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface PartnerOnboardingProps {
    onComplete: (goals: string[], plan?: SubscriptionPlan) => void
}

export function PartnerOnboarding({ onComplete }: PartnerOnboardingProps) {
    const { t } = useLanguage()
    const [step, setStep] = useState(0)
    const [selectedGoals, setSelectedGoals] = useState<string[]>([])
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

    const GOALS = [
        { id: "bookings", label: t.goal_bookings, icon: TrendingUp },
        { id: "management", label: t.goal_management, icon: Calendar },
        { id: "payments", label: t.goal_payments, icon: CreditCard },
        { id: "members", label: t.goal_members, icon: Users },
        { id: "tournaments", label: t.goal_tournaments, icon: Trophy },
    ]

    const toggleGoal = (id: string) => {
        if (selectedGoals.includes(id)) {
            setSelectedGoals(selectedGoals.filter(g => g !== id))
        } else {
            if (selectedGoals.length < 5) {
                setSelectedGoals([...selectedGoals, id])
            }
        }
    }

    const nextStep = () => {
        if (step < 3) {
            setStep(step + 1)
        } else {
            onComplete(selectedGoals, selectedPlan || undefined)
        }
    }

    const prevStep = () => {
        if (step > 0) {
            setStep(step - 1)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50/90 backdrop-blur-sm overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-pastel-mint/30 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-pastel-lilac/30 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-6xl h-[90vh] max-h-[850px] rounded-3xl border-2 border-black shadow-hard-lg overflow-hidden flex flex-col md:flex-row"
            >
                {/* Left Side - Content */}
                <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col h-full relative z-10">

                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-6 shrink-0">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`h-2 rounded-full flex-1 transition-all duration-300 ${i <= step ? "bg-pastel-acid border border-black" : "bg-gray-200"
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col py-2 scrollbar-thin pr-2">
                        <AnimatePresence mode="wait">
                            {step === 0 && (
                                <motion.div
                                    key="step0"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <div className="inline-flex items-center gap-2 bg-pastel-yellow px-4 py-1.5 rounded-full border border-black shadow-hard-sm">
                                        <Sparkles className="w-4 h-4" />
                                        <span className="font-bold text-sm">{t.welcome_partner}</span>
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
                                        {t.revolutionize_your} <br />
                                        <span className="text-pastel-lilac text-stroke-2">{t.sports_venue}</span>
                                    </h1>
                                    <p className="text-lg text-gray-600">
                                        {t.onboarding_desc}
                                    </p>
                                </motion.div>
                            )}

                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <div className="inline-flex items-center gap-2 bg-pastel-mint px-4 py-1.5 rounded-full border border-black shadow-hard-sm">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="font-bold text-sm">{t.your_goals}</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-display font-bold">
                                        {t.goals_title}
                                    </h2>
                                    <p className="text-gray-600">
                                        {t.goals_desc}
                                    </p>

                                    <div className="flex flex-wrap gap-3 mt-4">
                                        {GOALS.map((goal) => (
                                            <button
                                                key={goal.id}
                                                onClick={() => toggleGoal(goal.id)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-200 flex items-center gap-2 ${selectedGoals.includes(goal.id)
                                                    ? "bg-pastel-acid border-black shadow-hard-sm"
                                                    : "bg-white border-gray-200 text-gray-500 hover:border-black hover:text-black"
                                                    }`}
                                            >
                                                <goal.icon className="w-4 h-4" />
                                                {goal.label}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6 h-full flex flex-col"
                                >
                                    {/* Mobile Only: Content */}
                                    <div className="md:hidden space-y-6">
                                        <div className="inline-flex items-center gap-2 bg-pastel-lilac px-4 py-1.5 rounded-full border border-black shadow-hard-sm">
                                            <Gem className="w-4 h-4" />
                                            <span className="font-bold text-sm">{t.choose_plan}</span>
                                        </div>
                                        <h2 className="text-3xl font-display font-bold">
                                            {t.select_subscription}
                                        </h2>
                                        <div className="mt-4">
                                            <SubscriptionPlanSelector
                                                selectedPlan={selectedPlan}
                                                onSelect={setSelectedPlan}
                                            />
                                        </div>
                                    </div>

                                    {/* Desktop Only: Illustration in Left Panel */}
                                    <div className="hidden md:flex flex-col items-center justify-center flex-1 relative">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                                            <div
                                                className="w-full h-full"
                                                style={{
                                                    backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                                                    backgroundSize: '20px 20px'
                                                }}
                                            />
                                        </div>

                                        <motion.div
                                            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                                            transition={{ duration: 6, repeat: Infinity }}
                                            className="relative z-10 w-48 h-48 bg-pastel-lilac rounded-full border-2 border-black flex items-center justify-center shadow-hard"
                                        >
                                            <Image
                                                src="/design-2d-tas-badminton.webp"
                                                width={120}
                                                height={120}
                                                alt="Bag"
                                                className="object-contain"
                                            />
                                        </motion.div>

                                        <div className="mt-8 text-center relative z-10">
                                            <h3 className="text-2xl font-bold font-display">{t.pick_your_plan}</h3>
                                            <p className="text-gray-500 mt-2 flex items-center justify-center gap-2">
                                                {t.see_options_right} <ArrowRight className="w-4 h-4" />
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <div className="inline-flex items-center gap-2 bg-pastel-pink px-4 py-1.5 rounded-full border border-black shadow-hard-sm">
                                        <Check className="w-4 h-4" />
                                        <span className="font-bold text-sm">{t.all_set}</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-display font-bold">
                                        {t.ready_to} <br />
                                        <span className="bg-pastel-acid px-2">{t.level_up}</span> 🚀
                                    </h2>
                                    <p className="text-gray-600 text-lg">
                                        {t.boost_msg}
                                    </p>

                                    <div className="bg-gray-50 p-6 rounded-xl border-2 border-black border-dashed">
                                        <h4 className="font-bold mb-2">{t.next_step}</h4>
                                        <p className="text-sm text-gray-600">{t.next_step_desc}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 shrink-0 relative z-20 bg-white md:bg-transparent">
                        <button
                            onClick={prevStep}
                            disabled={step === 0}
                            className={`text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors ${step === 0 ? "opacity-0 cursor-default" : "opacity-100"}`}
                        >
                            {t.back_btn}
                        </button>

                        <div className="flex items-center gap-4">
                            {step < 3 && step !== 2 && (
                                <button
                                    onClick={() => onComplete([])}
                                    className="text-gray-500 font-medium text-sm hover:text-black transition-colors"
                                >
                                    {t.skip_btn}
                                </button>
                            )}

                            {/* Disable continue if on Plan Selection (Step 2) and no plan selected */}
                            <button
                                onClick={nextStep}
                                disabled={step === 2 && !selectedPlan}
                                className="bg-black text-white px-6 py-3 rounded-xl font-bold border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all shadow-hard-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {step === 3 ? t.get_started : t.continue_btn} <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                </div>

                {/* Right Side - Dynamic Content */}
                <div className="hidden md:block w-1/2 bg-gray-50 relative overflow-hidden border-l-2 border-black">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                            opacity: 0.1
                        }}
                    />

                    {/* Step 2 Special Case: Subscription Selector on Right */}
                    <AnimatePresence mode="wait">
                        {step === 2 ? (
                            <motion.div
                                key="plans-right"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                className="absolute inset-0 flex flex-col p-8 z-10 overflow-y-auto"
                            >
                                <div className="mb-6">
                                    <div className="inline-flex items-center gap-2 bg-pastel-lilac px-4 py-1.5 rounded-full border border-black shadow-hard-sm mb-4">
                                        <Gem className="w-4 h-4" />
                                        <span className="font-bold text-sm">{t.choose_plan}</span>
                                    </div>
                                    <h2 className="text-4xl font-display font-bold leading-tight">
                                        {t.select_your_power} <br />
                                        <span className="bg-pastel-acid px-2 skew-x-[-10deg] inline-block">{t.subscription_word}</span>
                                    </h2>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <SubscriptionPlanSelector
                                        selectedPlan={selectedPlan}
                                        onSelect={setSelectedPlan}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            // Standard Illustrations for other steps
                            <motion.div
                                key="standard-ill"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center p-12"
                            >
                                <AnimatePresence mode="wait">
                                    {step === 0 && (
                                        <motion.div
                                            key="ill-0"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="relative w-full h-full flex items-center justify-center"
                                        >
                                            {/* Central Circle */}
                                            <div className="w-64 h-64 rounded-full bg-pastel-mint border-2 border-black flex items-center justify-center relative shadow-hard z-10">
                                                <Image
                                                    src="/design-2d-raket-badminton.webp"
                                                    width={150}
                                                    height={150}
                                                    alt="Racket"
                                                    className="object-contain hover:rotate-12 transition-transform duration-500"
                                                />
                                            </div>
                                            {/* Floating elements */}
                                            <motion.div
                                                animate={{ y: [0, -20, 0] }}
                                                transition={{ duration: 4, repeat: Infinity }}
                                                className="absolute top-20 right-20 bg-white p-4 rounded-xl border-2 border-black shadow-hard-sm rotate-6"
                                            >
                                                <span className="text-2xl">🏸</span>
                                            </motion.div>
                                            <motion.div
                                                animate={{ y: [0, 20, 0] }}
                                                transition={{ duration: 5, repeat: Infinity }}
                                                className="absolute bottom-32 left-20 bg-white p-4 rounded-xl border-2 border-black shadow-hard-sm -rotate-3"
                                            >
                                                <span className="text-2xl">⚡</span>
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    {step === 1 && (
                                        <motion.div
                                            key="ill-1"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            className="relative w-full h-full flex flex-col items-center justify-center"
                                        >
                                            <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                                                <motion.div
                                                    whileHover={{ scale: 1.05 }}
                                                    className="bg-white p-6 rounded-2xl border-2 border-black shadow-hard aspect-square flex flex-col items-center justify-center gap-4"
                                                >
                                                    <div className="w-12 h-12 bg-pastel-pink rounded-full border-2 border-black flex items-center justify-center">
                                                        <TrendingUp className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-bold text-sm">Growth</span>
                                                </motion.div>
                                                <motion.div
                                                    whileHover={{ scale: 1.05 }}
                                                    className="bg-pastel-yellow p-6 rounded-2xl border-2 border-black shadow-hard aspect-square flex flex-col items-center justify-center gap-4 mt-8"
                                                >
                                                    <div className="w-12 h-12 bg-white rounded-full border-2 border-black flex items-center justify-center">
                                                        <Users className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-bold text-sm">Community</span>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div
                                            key="ill-3"
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -50 }}
                                            className="relative w-full h-full flex items-center justify-center"
                                        >
                                            <div className="relative">
                                                <div className="w-80 h-auto bg-white rounded-2xl border-2 border-black shadow-hard-lg overflow-hidden">
                                                    <div className="bg-black text-white p-3 text-center font-bold text-sm border-b-2 border-black">
                                                        {t.verified_partner}
                                                    </div>
                                                    <div className="p-8 flex flex-col items-center">
                                                        <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 border-2 border-black flex items-center justify-center">
                                                            <Image
                                                                src="/design-2d-tas-badminton.webp"
                                                                width={60}
                                                                height={60}
                                                                alt="Profile"
                                                            />
                                                        </div>
                                                        <div className="w-32 h-4 bg-gray-200 rounded-full mb-2"></div>
                                                        <div className="w-20 h-3 bg-gray-100 rounded-full"></div>
                                                    </div>
                                                    <div className="bg-pastel-acid p-4 text-center border-t-2 border-black font-bold">
                                                        {t.ready_to_launch}
                                                    </div>
                                                </div>

                                                {/* Confetti elements */}
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                    className="absolute -top-10 -right-10 w-20 h-20"
                                                >
                                                    <Sparkles className="w-full h-full text-pastel-acid" />
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    )
}
