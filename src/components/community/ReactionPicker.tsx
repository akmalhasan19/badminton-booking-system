"use client"

import { useState } from "react"
import { SmilePlus } from "lucide-react"
import { addReaction } from "@/app/communities/[id]/chat/actions"

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉", "👌", "✨"]

interface ReactionPickerProps {
    messageId: string
}

export function ReactionPicker({ messageId }: ReactionPickerProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleReaction = async (emoji: string) => {
        await addReaction(messageId, emoji)
        setIsOpen(false)
    }

    return (
        <div className="relative group">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                title="Add reaction"
            >
                <SmilePlus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded-lg shadow-hard z-50 p-2 flex gap-1 flex-wrap w-64">
                        {EMOJI_REACTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                className="text-2xl hover:scale-125 transition-transform hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
