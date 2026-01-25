"use client"

import { useState } from "react"
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
        {renderContent()}
      </div>

      <Footer />
      <AICoach />
    </main>
  )
}
