"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageHeaderProps {
    title: string
    description?: string
    showBack?: boolean
}

export function PageHeader({ title, description, showBack = true }: PageHeaderProps) {
    const router = useRouter()

    return (
        <div className="mb-8">
            {showBack && (
                <button
                    onClick={() => router.back()}
                    className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            )}
            <div className="relative inline-block">
                <h1 className="text-4xl font-display font-black text-black uppercase tracking-tight relative z-10">
                    {title}
                </h1>
                <div className="absolute -bottom-2 -right-2 w-full h-3 bg-pastel-mint/50 -z-0"></div>
            </div>
            {description && (
                <p className="mt-2 text-gray-600 font-medium max-w-2xl">
                    {description}
                </p>
            )}
            <div className="h-1 w-full bg-black mt-6 rounded-full"></div>
        </div>
    )
}
