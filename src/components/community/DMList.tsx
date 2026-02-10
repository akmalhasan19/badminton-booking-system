"use client"

import { useCallback, useEffect, useState } from "react"
import { getDMConversations, type DMConversation } from "@/app/communities/[id]/chat/actions"
import { Loader2 } from "lucide-react"

interface DMListProps {
    communityId: string
    onSelectConversation: (conversation: DMConversation) => void
    selectedConversationId?: string
}

export function DMList({
    communityId,
    onSelectConversation,
    selectedConversationId
}: DMListProps) {
    const [conversations, setConversations] = useState<DMConversation[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadConversations = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await getDMConversations(communityId)
            if (!result.error) {
                setConversations(result.data || [])
            }
        } finally {
            setIsLoading(false)
        }
    }, [communityId])

    useEffect(() => {
        loadConversations()
    }, [loadConversations])

    return (
        <div className="w-full lg:w-80 border-r-2 border-black dark:border-white bg-white dark:bg-gray-800 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b-2 border-black dark:border-white bg-gray-50 dark:bg-gray-700">
                <h2 className="font-bold text-lg text-black dark:text-white uppercase">
                    Messages
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Direct conversations
                </p>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-black dark:text-white" />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <p className="text-sm font-medium">No conversations yet</p>
                        <p className="text-xs">Start a DM with a community member</p>
                    </div>
                ) : (
                    <div className="space-y-2 p-3">
                        {conversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                onClick={() => onSelectConversation(conversation)}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${selectedConversationId === conversation.id
                                        ? "bg-neo-green border-black dark:border-white shadow-hard"
                                        : "border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white bg-white dark:bg-gray-700"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 overflow-hidden border-2 border-black dark:border-white">
                                        {conversation.other_user?.avatar_url ? (
                                            <img
                                                src={conversation.other_user.avatar_url}
                                                alt={conversation.other_user.full_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-black">
                                                {conversation.other_user?.full_name?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-black dark:text-white text-sm truncate">
                                            {conversation.other_user?.full_name}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                            {conversation.last_message || "No messages yet"}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
