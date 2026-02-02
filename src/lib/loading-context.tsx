"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"

interface LoadingContextType {
    isLoading: boolean
    loadingMessage: string
    startLoading: (message?: string) => void
    stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

interface LoadingProviderProps {
    children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState("Memuat...")

    const startLoading = useCallback((message: string = "Memuat...") => {
        setLoadingMessage(message)
        setIsLoading(true)
    }, [])

    const stopLoading = useCallback(() => {
        setIsLoading(false)
    }, [])

    return (
        <LoadingContext.Provider value={{ isLoading, loadingMessage, startLoading, stopLoading }}>
            {children}
            <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
        </LoadingContext.Provider>
    )
}

export function useLoading() {
    const context = useContext(LoadingContext)
    if (context === undefined) {
        throw new Error("useLoading must be used within a LoadingProvider")
    }
    return context
}
