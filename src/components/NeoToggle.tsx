"use client"

import { motion } from "framer-motion"

interface NeoToggleProps {
    active: boolean
    onToggle: () => void
    color?: string
}

export const NeoToggle = ({ active, onToggle, color = 'bg-blue-500' }: NeoToggleProps) => (
    <button
        onClick={onToggle}
        className={`w-14 h-8 rounded-full border-2 border-black p-1 transition-colors relative ${active ? color : 'bg-gray-200'}`}
    >
        <motion.div
            layout
            className="w-5 h-5 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            animate={{ x: active ? 22 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
    </button>
)
