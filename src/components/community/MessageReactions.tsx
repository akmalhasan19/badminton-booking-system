"use client"

import { removeReaction, type MessageReaction } from "@/app/communities/[id]/chat/actions"

interface MessageReactionsProps {
    reactions: MessageReaction[]
    messageId: string
    currentUserId?: string
}

export function MessageReactions({
    reactions,
    messageId,
    currentUserId
}: MessageReactionsProps) {
    // Group reactions by emoji
    const reactionGroups = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = []
        }
        acc[reaction.emoji].push(reaction)
        return acc
    }, {} as Record<string, MessageReaction[]>)

    const handleRemoveReaction = async (emoji: string) => {
        await removeReaction(messageId, emoji)
    }

    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(reactionGroups).map(([emoji, reactionList]) => {
                const userReacted = (reactionList as MessageReaction[]).some(r => r.user_id === currentUserId)

                return (
                    <button
                        key={emoji}
                        onClick={() => {
                            if (userReacted) {
                                handleRemoveReaction(emoji)
                            }
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full border-2 transition-all ${userReacted
                            ? "bg-neo-green border-black dark:border-white shadow-hard cursor-pointer hover:shadow-hard-hover"
                            : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                            }`}
                        title={(reactionList as MessageReaction[]).map(r => r.user?.full_name).join(", ")}
                    >
                        <span>{emoji}</span>
                        <span className="text-xs font-bold text-black dark:text-white">
                            {(reactionList as MessageReaction[]).length}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
