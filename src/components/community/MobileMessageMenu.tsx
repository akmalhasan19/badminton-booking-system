"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Copy, Flag, MessageCircle, SmilePlus, Trash2, Edit2 } from "lucide-react"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { CommunityMessage } from "@/app/communities/[id]/chat/actions"

interface MobileMessageMenuProps {
    isOpen: boolean
    onClose: () => void
    onReply: () => void
    onReaction: (emoji: string) => void
    onReport: () => void
    onCopy: () => void
    onEdit?: () => void
    onDelete?: () => void
    message: CommunityMessage
    currentUserId?: string
}

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"]

export function MobileMessageMenu({
    isOpen,
    onClose,
    onReply,
    onReaction,
    onReport,
    onCopy,
    onEdit,
    onDelete,
    message,
    currentUserId
}: MobileMessageMenuProps) {
    const [mounted, setMounted] = useState(false)
    const isOwnMessage = message.user_id === currentUserId

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
                    />

                    {/* Menu Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-[9999] p-4 border-t border-gray-200 dark:border-gray-800 safe-area-bottom shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]"
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose()
                        }}
                    >
                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6" />

                        {/* Quick Reactions */}
                        <div className="flex justify-between mb-8 px-2">
                            {REACTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => {
                                        onReaction(emoji)
                                        // onClose() // Keep open or close? Usually close.
                                        onClose()
                                    }}
                                    className="text-3xl hover:scale-125 transition-transform active:scale-95 p-1"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        {/* Actions List */}
                        <div className="space-y-2">
                            <MenuButton icon={MessageCircle} label="Reply" onClick={() => { onReply(); onClose(); }} />
                            <MenuButton icon={Copy} label="Copy Text" onClick={() => { onCopy(); onClose(); }} />

                            {isOwnMessage ? (
                                <>
                                    <MenuButton icon={Edit2} label="Edit Message" onClick={() => { onEdit?.(); onClose(); }} />
                                    <MenuButton
                                        icon={Trash2}
                                        label="Delete Message"
                                        onClick={() => { onDelete?.(); onClose(); }}
                                        destructive
                                        className="text-red-500 bg-red-50 dark:bg-red-900/10"
                                    />
                                </>
                            ) : (
                                <MenuButton
                                    icon={Flag}
                                    label="Report Message"
                                    onClick={() => { onReport(); onClose(); }}
                                    destructive
                                />
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}

function MenuButton({
    icon: Icon,
    label,
    onClick,
    destructive = false,
    className = ""
}: {
    icon: any,
    label: string,
    onClick: () => void,
    destructive?: boolean,
    className?: string
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 p-4 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-colors ${destructive ? "text-red-500" : "text-gray-700 dark:text-gray-200"
                } ${className}`}
        >
            <Icon className="w-5 h-5" />
            <span className="font-semibold text-base">{label}</span>
        </button>
    )
}
