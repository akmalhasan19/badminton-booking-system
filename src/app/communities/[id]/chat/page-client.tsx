"use client"

import { useRouter } from "next/navigation"
import { ChatRoom } from "@/components/community/ChatRoom"

interface ChatPageClientProps {
    communityId: string
    communityName: string
    communityImage?: string | null
    currentUserId: string
    isAdmin: boolean
}

export default function ChatPageClient({
    communityId,
    communityName,
    communityImage,
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
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                        >
                            <span className="material-icons-round text-[#171717] text-2xl">arrow_back</span>
                        </button>

                        {/* Profile Picture */}
                        <div className="w-10 h-10 border border-[#171717] rounded-lg overflow-hidden shadow-[2px_2px_0px_0px_#171717] flex-shrink-0 bg-gray-100">
                            {communityImage ? (
                                <img
                                    src={communityImage}
                                    alt={communityName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-[#171717] font-bold">
                                    {communityName[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col min-w-0">
                            <h1 className="font-extrabold text-lg leading-tight tracking-tight text-[#171717] truncate">
                                {communityName}
                            </h1>
                            <span className="text-xs font-semibold text-gray-500 truncate">Community Chat</span>
                        </div>
                    </div>
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
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
