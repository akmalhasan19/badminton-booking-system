"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { Marquee } from "@/components/Marquee"
import { BentoGrid } from "@/components/BentoGrid"
import { BookingSection } from "@/components/BookingSection"
import { ShopSection } from "@/components/ShopSection"
import { Footer } from "@/components/Footer"
import { AICoach } from "@/components/AICoach"
import { Tab } from "@/types"

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME)

  const renderContent = () => {
    switch (activeTab) {
      case Tab.BOOK:
        return <BookingSection />
      case Tab.SHOP:
        return <ShopSection />
      case Tab.HOME:
      default:
        return (
          <div className="flex flex-col w-full">
            <Hero setActiveTab={setActiveTab} />
            <Marquee />
            <BentoGrid setActiveTab={setActiveTab} />
          </div>
        )
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-pastel-acid selection:text-black">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
      <AICoach />
    </main>
  )
}
