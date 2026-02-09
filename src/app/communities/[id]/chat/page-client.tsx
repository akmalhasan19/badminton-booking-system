"use client"

import { useRouter } from "next/navigation"
import { ChatRoom } from "@/components/community/ChatRoom"

interface ChatPageClientProps {
    communityId: string
    communityName: string
    currentUserId: string
    isAdmin: boolean
}

export default function ChatPageClient({
    communityId,
    communityName,
    currentUserId,
    isAdmin
}: ChatPageClientProps) {
    const router = useRouter()

    return (
        <main className="bg-white text-[#171717] flex justify-center min-h-screen">
            <div className="w-full max-w-[393px] bg-white relative flex flex-col h-screen overflow-hidden border-x border-[#171717] mx-auto">
                {/* Header */}
                <header className="bg-white border-b border-[#171717] p-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="bg-white p-2 border border-[#171717] rounded shadow-[1px_1px_0px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all hover:bg-gray-50"
                        >
                            <span className="material-icons-round text-[#171717] text-xl">arrow_back</span>
                        </button>
                        <div className="flex flex-col">
                            <h1 className="font-extrabold text-lg leading-tight tracking-tight text-[#171717]">
                                {communityName}
                            </h1>
                            <span className="text-xs font-semibold text-gray-500">Community Chat</span>
                        </div>
                    </div>
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-icons-round text-2xl text-[#171717]">more_vert</span>
                    </button>
                </header>

                {/* Chat Content */}
                <ChatRoom
                    communityId={communityId}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                />
            </div>
        </main>
    )
}
