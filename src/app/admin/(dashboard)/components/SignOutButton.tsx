'use client'


import { LogOut } from "lucide-react"
import { signOut } from "@/lib/auth/actions"
import { useRouter } from "next/navigation"

export function SignOutButton() {
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    return (
        <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 font-bold border-2 border-transparent hover:bg-neo-pink hover:border-neo-black hover:shadow-hard-sm transition-all"
        >
            <LogOut className="w-5 h-5" />
            Sign Out
        </button>
    )
}
