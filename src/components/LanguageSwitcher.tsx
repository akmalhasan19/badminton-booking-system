"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, Check } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { Language } from "@/lib/i18n/dictionary"

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)

    const languages: { code: Language; label: string; flag: string }[] = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
        { code: 'jv', label: 'Basa Jawi', flag: '🟤' }, // Using brown circle as placeholder or generic symbol if flag unavailable
    ]

    const currentLang = languages.find(l => l.code === language)

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-bold text-sm bg-white border-2 border-black shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{language}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-black rounded-xl shadow-hard-lg overflow-hidden z-50"
                        >
                            <div className="py-1">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setLanguage(lang.code)
                                            setIsOpen(false)
                                        }}
                                        className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${language === lang.code ? 'bg-pastel-acid/20 font-bold' : ''}`}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className="flex-1 text-sm">{lang.label}</span>
                                        {language === lang.code && <Check className="w-4 h-4 text-black" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
