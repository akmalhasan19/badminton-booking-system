"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Language, Dictionary, dictionaries } from './dictionary'

type LanguageContextType = {
    language: Language
    setLanguage: (lang: Language) => void
    t: Dictionary
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Load saved language from local storage
        const savedLang = localStorage.getItem('smash_language') as Language
        if (savedLang && ['en', 'id', 'jv'].includes(savedLang)) {
            setLanguage(savedLang)
        }
        setMounted(true)
    }, [])

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang)
        localStorage.setItem('smash_language', lang)
    }

    // While not mounted, render children to avoid hydration mismatch, but it might use default language
    // ideally we'd use a loader, but for now we just render.
    // Actually, to prevent hydration mismatch for text content, we might need to wait.
    // But waiting flashes empty content. Let's just run with 'en' default on server and update on client.

    const value = {
        language,
        setLanguage: handleSetLanguage,
        t: dictionaries[language]
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
