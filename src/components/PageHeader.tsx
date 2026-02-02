"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageHeaderProps {
    title: string
    description?: string
    showBack?: boolean
    action?: React.ReactNode
}

export function PageHeader({ title, description, showBack = true, action }: PageHeaderProps) {
    const router = useRouter()

    return (
        <div className="mb-8">
            {showBack && (
                <button
                    onClick={() => router.back()}
                    className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </button>
            )}
            <div className="flex justify-between items-end gap-4">
                <div className="relative">
                    <div className="relative inline-block">
                        <h1 className="text-4xl font-display font-black text-black uppercase tracking-tight relative z-10 leading-none">
                            {title}
                        </h1>
                        <div className="absolute -bottom-2 -right-2 w-full h-3 bg-pastel-mint/50 -z-0"></div>
                    </div>
                    {description && (
                        <p className="mt-2 text-gray-600 font-medium max-w-2xl">
                            {description}
                        </p>
                    )}
                </div>
                {action && (
                    <div className="mb-1">
                        {action}
                    </div>
                )}
            </div>
            <div className="h-1 w-full bg-black mt-6 rounded-full"></div>
        </div>
    )
}
