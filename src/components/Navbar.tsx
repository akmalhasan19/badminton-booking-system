"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Tab } from "@/types"

interface NavbarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-2 ${scrolled ? 'bg-white/90 backdrop-blur-md border-black py-3' : 'bg-transparent border-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <div
                        className="flex items-center space-x-2 cursor-pointer group"
                        onClick={() => setActiveTab(Tab.HOME)}
                    >
                        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-hard-sm group-hover:bg-pastel-acid group-hover:text-black transition-colors">
                            <span className="text-white font-display font-bold text-xl group-hover:text-black">S</span>
                        </div>
                        <span className="text-2xl font-display font-bold tracking-tight">Smash<span className="text-pastel-lilac">.</span></span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-2 bg-white p-1 rounded-xl border-2 border-black shadow-hard-sm">
                        <button
                            onClick={() => setActiveTab(Tab.HOME)}
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === Tab.HOME ? 'bg-pastel-acid text-black border-2 border-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            HOME
                        </button>
                        <button
                            onClick={() => setActiveTab(Tab.BOOK)}
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === Tab.BOOK ? 'bg-pastel-mint text-black border-2 border-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            BOOK
                        </button>
                        <button
                            onClick={() => setActiveTab(Tab.SHOP)}
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === Tab.SHOP ? 'bg-pastel-pink text-black border-2 border-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            SHOP
                        </button>
                    </div>

                    <div className="hidden md:block">
                        <button className="bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all border-2 border-transparent hover:border-black hover:bg-white hover:text-black shadow-hard-sm">
                            Login
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-black bg-white border-2 border-black rounded-lg shadow-hard-sm"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center space-y-6 animate-slide-down font-display origin-top">
                    <button
                        onClick={() => { setActiveTab(Tab.HOME); setMobileMenuOpen(false); }}
                        className="text-4xl font-bold text-black hover:text-pastel-acid transition-colors"
                    >
                        HOME
                    </button>
                    <button
                        onClick={() => { setActiveTab(Tab.BOOK); setMobileMenuOpen(false); }}
                        className="text-4xl font-bold text-black hover:text-pastel-mint transition-colors"
                    >
                        BOOK
                    </button>
                    <button
                        onClick={() => { setActiveTab(Tab.SHOP); setMobileMenuOpen(false); }}
                        className="text-4xl font-bold text-black hover:text-pastel-pink transition-colors"
                    >
                        SHOP
                    </button>
                </div>
            )}
        </>
    )
}
