"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCheck, Check, X } from "lucide-react"
import { getMessageReadReceipts, type ReadReceipts } from "@/app/communities/[id]/chat/actions"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

interface MessageInfoModalProps {
    isOpen: boolean
    onClose: () => void
    communityId: string
    messageId: string
    content: string
    senderName: string
}

export function MessageInfoModal({
    isOpen,
    onClose,
    communityId,
    messageId,
    content,
    senderName
}: MessageInfoModalProps) {
    const [loading, setLoading] = useState(true)
    const [receipts, setReceipts] = useState<ReadReceipts | null>(null)
    const [activeTab, setActiveTab] = useState<'read' | 'delivered'>('read')

    useEffect(() => {
        if (isOpen && messageId) {
            setLoading(true)
            getMessageReadReceipts(communityId, messageId)
                .then(result => {
                    if (result.data) {
                        setReceipts(result.data)
                    }
                })
                .finally(() => setLoading(false))
        }
    }, [isOpen, communityId, messageId])

    if (!isOpen) return null

    const renderMessagePreview = (messageContent: string) => {
        if (messageContent.startsWith("> ")) {
            const firstNewLineIndex = messageContent.indexOf("\n\n")
            if (firstNewLineIndex !== -1) {
                const fullQuote = messageContent.substring(2, firstNewLineIndex)
                const replyPart = messageContent.substring(firstNewLineIndex + 2)

                let quoteSenderName = ""
                let quoteContent = fullQuote

                const idMatch = fullQuote.match(/^\[(.*?)\] \[id:(.*?)\] ([\s\S]*)/)
                if (idMatch) {
                    quoteSenderName = idMatch[1]
                    quoteContent = idMatch[3]
                } else {
                    const nameMatch = fullQuote.match(/^\[(.*?)\] ([\s\S]*)/)
                    if (nameMatch) {
                        quoteSenderName = nameMatch[1]
                        quoteContent = nameMatch[2]
                    }
                }

                return (
                    <div className="flex flex-col gap-2">
                        <div className="border-l-4 border border-[#171717] bg-white p-3 rounded shadow-sm">
                            {quoteSenderName && (
                                <p className="text-xs font-bold text-[#171717] mb-1">
                                    {quoteSenderName}
                                </p>
                            )}
                            <p className="text-sm text-[#171717] whitespace-pre-wrap break-words">
                                {quoteContent}
                            </p>
                        </div>
                        {replyPart.trim() ? (
                            <p className="text-sm text-[#171717] whitespace-pre-wrap break-words">
                                {replyPart}
                            </p>
                        ) : null}
                    </div>
                )
            }
        }

        return (
            <p className="text-sm text-[#171717] whitespace-pre-wrap break-words">
                {messageContent}
            </p>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-[#171717]">Message Info</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Message Preview */}
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-bold text-[#171717] mb-2">{senderName}</p>
                    <div className="bg-white p-3 rounded-lg border border-[#171717] shadow-sm inline-block max-w-full">
                        {renderMessagePreview(content)}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('read')}
                        className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'read' ? 'border-[#171717] text-[#171717]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <CheckCheck className="w-4 h-4 text-blue-500" />
                        Read ({receipts?.read.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('delivered')}
                        className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'delivered' ? 'border-[#171717] text-[#171717]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Check className="w-4 h-4 text-gray-400" />
                        Delivered ({receipts?.delivered.length || 0})
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {activeTab === 'read' ? (
                                receipts?.read.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8 text-sm">No one has read this message yet.</p>
                                ) : (
                                    receipts?.read.map(user => (
                                        <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                                        {user.full_name[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-[#171717] truncate">{user.full_name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(user.read_at), "d MMM, HH:mm", { locale: idLocale })}
                                                </p>
                                            </div>
                                            <CheckCheck className="w-4 h-4 text-blue-500 shrink-0" />
                                        </div>
                                    ))
                                )
                            ) : (
                                receipts?.delivered.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8 text-sm">Everyone has read this message!</p>
                                ) : (
                                    receipts?.delivered.map(user => (
                                        <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                                        {user.full_name[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-[#171717] truncate">{user.full_name}</p>
                                                <p className="text-xs text-gray-500">Delivered</p>
                                            </div>
                                            <Check className="w-4 h-4 text-gray-400 shrink-0" />
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
