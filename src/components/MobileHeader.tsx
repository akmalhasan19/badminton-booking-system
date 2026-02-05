"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { SmashLogo } from "@/components/SmashLogo"

interface MobileHeaderProps {
    title: string
    showBackButton?: boolean
    backPath?: string
}

export function MobileHeader({ title, showBackButton = true, backPath }: MobileHeaderProps) {
    const router = useRouter()

    const handleBack = () => {
        if (backPath) {
            router.push(backPath)
        } else {
            router.back()
        }
    }

    return (
        <div className="md:hidden bg-gradient-to-r from-black via-gray-800 to-black">
            {/* Top Navigation */}
            <div className="flex items-center justify-between p-4">
                {showBackButton ? (
                    <button
                        onClick={handleBack}
                        className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                ) : (
                    <div className="w-10" />
                )}

                <h1 className="text-lg font-display font-bold text-white">{title}</h1>

                <div
                    onClick={() => router.push('/')}
                    className="flex items-center gap-1.5 cursor-pointer group"
                >
                    <div className="w-6 h-6 flex items-center justify-center transition-transform group-hover:scale-110">
                        <SmashLogo className="w-full h-full bg-white" />
                    </div>
                </div>
            </div>
        </div>
    )
}
