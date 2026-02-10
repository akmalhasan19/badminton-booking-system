"use client"

import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { Marquee } from "@/components/Marquee"
import { BentoGrid } from "@/components/BentoGrid"
import { BookingSection } from "@/components/BookingSection"
import { ShopSection } from "@/components/ShopSection"
import { MatchSection } from "@/components/MatchSection"
import { Footer } from "@/components/Footer"
import { AICoach } from "@/components/AICoach"
import { Preloader } from "@/components/Preloader"
import { Tab } from "@/types"

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTabState] = useState<Tab>(Tab.HOME)

  // Sync state with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'book' && activeTab !== Tab.BOOK) setActiveTabState(Tab.BOOK)
    else if (tabParam === 'match' && activeTab !== Tab.MATCH) setActiveTabState(Tab.MATCH)
    else if (tabParam === 'shop' && activeTab !== Tab.SHOP) setActiveTabState(Tab.SHOP)
    else if (!tabParam && activeTab !== Tab.HOME) setActiveTabState(Tab.HOME)
  }, [searchParams, activeTab])

  const handleSetActiveTab = (tab: Tab) => {
    setActiveTabState(tab)

    // Update URL without full reload
    const params = new URLSearchParams(searchParams.toString())
    if (tab === Tab.HOME) params.delete('tab')
    else if (tab === Tab.BOOK) params.set('tab', 'book')
    else if (tab === Tab.MATCH) params.set('tab', 'match')
    else if (tab === Tab.SHOP) params.set('tab', 'shop')

    // Clean up other params if switching main tabs, except when going deeper
    if (tab !== Tab.BOOK) params.delete('venueId')

    router.push(`/?${params.toString()}`, { scroll: false })
  }

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has already seen the preloader in this session
    const hasSeenPreloader = sessionStorage.getItem("has_seen_preloader")
    if (hasSeenPreloader) {
      setIsLoading(false)
    }
  }, [])

  const handlePreloaderComplete = () => {
    setIsLoading(false)
    sessionStorage.setItem("has_seen_preloader", "true")
  }

  const renderContent = () => {
    switch (activeTab) {
      case Tab.BOOK:
        return <BookingSection />
      case Tab.MATCH:
        return <MatchSection />
      case Tab.SHOP:
        return <ShopSection />
      case Tab.HOME:
      default:
        return (
          <div className="flex flex-col w-full">
            <Hero setActiveTab={handleSetActiveTab} />
            <Marquee />
            <BentoGrid setActiveTab={handleSetActiveTab} />
          </div>
        )
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-pastel-acid selection:text-black">
      <AnimatePresence mode="wait">
        {isLoading && (
          <Preloader key="preloader" onComplete={handlePreloaderComplete} />
        )}
      </AnimatePresence>

      {!isLoading && (
        <>
          <Navbar activeTab={activeTab} setActiveTab={handleSetActiveTab} />

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
        </>
      )}
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}
