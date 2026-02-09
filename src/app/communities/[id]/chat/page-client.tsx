"use client"

import { useState } from "react"
import { ArrowLeft, MessageSquare, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { ChatRoom } from "@/components/community/ChatRoom"
import { DMList } from "@/components/community/DMList"
import { DMChat } from "@/components/community/DMChat"
import { type DMConversation } from "./actions"

interface ChatPageClientProps {
    communityId: string
    communityName: string
    currentUserId: string
    isAdmin: boolean
}

type TabType = "room" | "dm"

export default function ChatPageClient({
    communityId,
    communityName,
    currentUserId,
    isAdmin
}: ChatPageClientProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabType>("room")
    const [selectedConversation, setSelectedConversation] = useState<DMConversation | null>(null)

    return (
        <main className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-light dark:text-text-dark">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white dark:bg-gray-800 border-3 border-black dark:border-white rounded-lg hover:shadow-hard transition-all"
                    >
                        <ArrowLeft className="w-6 h-6 text-black dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black uppercase text-black dark:text-white">
                            {communityName}
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Community Chat
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 mb-6 border-b-3 border-black dark:border-white">
                    <button
                        onClick={() => {
                            setActiveTab("room")
                            setSelectedConversation(null)
                        }}
                        className={`flex items-center gap-2 px-5 py-3 font-bold uppercase text-sm transition-all border-b-3 ${
                            activeTab === "room"
                                ? "border-black dark:border-white text-black dark:text-white"
                                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                        }`}
                    >
                        <Users className="w-5 h-5" />
                        Room Chat
                    </button>
                    <button
                        onClick={() => setActiveTab("dm")}
                        className={`flex items-center gap-2 px-5 py-3 font-bold uppercase text-sm transition-all border-b-3 ${
                            activeTab === "dm"
                                ? "border-black dark:border-white text-black dark:text-white"
                                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                        }`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        Direct Messages
                    </button>
                </div>

                {/* Content */}
                <div className="h-[calc(100vh-280px)]">
                    {activeTab === "room" ? (
                        <ChatRoom
                            communityId={communityId}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                        />
                    ) : (
                        <div className="flex gap-3 h-full">
                            <DMList
                                communityId={communityId}
                                onSelectConversation={setSelectedConversation}
                                selectedConversationId={selectedConversation?.id}
                            />

                            {selectedConversation ? (
                                <DMChat
                                    conversationId={selectedConversation.id}
                                    currentUserId={currentUserId}
                                    otherUser={selectedConversation.other_user}
                                    onBack={() => setSelectedConversation(null)}
                                />
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 rounded-xl border-2 border-black dark:border-white">
                                    <div className="text-center">
                                        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400 font-bold">
                                            Select a conversation to start messaging
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
