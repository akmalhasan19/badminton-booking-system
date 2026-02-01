"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Loader2, Bot } from "lucide-react"
import { Message } from "@/types"
import { SYSTEM_INSTRUCTION } from "@/constants"
import { chatWithAI } from "@/lib/ai/actions"

export function AICoach() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: "Yo! Smashy here. 🏸 Need a court or gear advice? Don't be shy!" }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', text: userMessage }])
        setIsLoading(true)

        try {
            const result = await chatWithAI(userMessage)

            if (result.success && result.response) {
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: result.response
                }])
            } else {
                setMessages(prev => [...prev, { role: 'model', text: "Yikes, something went wrong. Let's try again later! 🙈" }])
            }
        } catch (error) {
            console.error("AI Error:", error)
            setMessages(prev => [...prev, { role: 'model', text: "Yikes, something went wrong. Let's try again later! 🙈" }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 group z-50 transition-all duration-300 hover:-translate-y-1
          ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            >
                <div className="bg-black text-white p-4 rounded-2xl border-2 border-white shadow-hard flex items-center justify-center group-hover:bg-pastel-acid group-hover:text-black group-hover:border-black transition-colors">
                    <Bot className="w-8 h-8" />
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-pastel-pink rounded-full border-2 border-black animate-pulse"></span>
                </div>
            </button>

            {/* Chat Interface */}
            <div className={`fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl border-2 border-black shadow-hard-lg z-50 overflow-hidden transition-all duration-500 transform origin-bottom-right
        ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>

                {/* Header */}
                <div className="bg-pastel-acid border-b-2 border-black p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                            <Bot className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h3 className="font-display font-black text-black uppercase tracking-tight">Smashy AI</h3>
                            <p className="text-xs font-bold text-gray-700">Always Online</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white rounded-lg border-2 border-transparent hover:border-black transition-all"
                    >
                        <X className="w-5 h-5 text-black" />
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="h-96 overflow-y-auto p-4 bg-gray-50 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]
                ${msg.role === 'user'
                                    ? 'bg-black text-white border-black rounded-br-none'
                                    : 'bg-white text-black border-black rounded-bl-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] p-3 rounded-2xl rounded-bl-none">
                                <Loader2 className="w-5 h-5 animate-spin text-black" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t-2 border-black">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-gray-100 border-2 border-transparent focus:bg-white focus:border-black rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="p-3 bg-pastel-mint text-black border-2 border-black rounded-xl hover:bg-pastel-acid disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
