"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react"
import { Tab } from "@/types"
import { SmashLogo } from "@/components/SmashLogo"
import { getCurrentUser, signOut } from "@/lib/auth/actions"
import { useRouter } from "next/navigation"

interface NavbarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { delayChildren: 0.2, staggerChildren: 0.1 }
    },
    exit: {
        opacity: 0,
        transition: { staggerChildren: 0.05, staggerDirection: -1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0, filter: "blur(5px)" },
    visible: { y: 0, opacity: 1, filter: "blur(0px)" },
    exit: { y: -20, opacity: 0, filter: "blur(5px)" }
};

const menuItems = [
    { tab: Tab.HOME, label: "HOME", color: "pastel-acid" },
    { tab: Tab.BOOK, label: "BOOK", color: "pastel-mint" },
    { tab: Tab.SHOP, label: "SHOP", color: "pastel-pink" }
];

import { AuthModal } from "@/components/AuthModal"

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
    const router = useRouter()
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [highlightStyle, setHighlightStyle] = useState({ left: 0, width: 0, opacity: 0 })
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

    // User state
    const [user, setUser] = useState<{ name: string; email: string } | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [showUserDropdown, setShowUserDropdown] = useState(false)

    // Check auth on mount
    useEffect(() => {
        async function checkAuth() {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setIsLoggedIn(true);
                setUser({ name: currentUser.name, email: currentUser.email });
            }
        }
        checkAuth();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    useEffect(() => {
        const activeIndex = menuItems.findIndex(item => item.tab === activeTab)
        const element = tabsRef.current[activeIndex]

        if (element) {
            setHighlightStyle({
                left: element.offsetLeft,
                width: element.offsetWidth,
                opacity: 1
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    const getBackgroundColor = (tab: Tab) => {
        switch (tab) {
            case Tab.HOME: return 'bg-pastel-acid';
            case Tab.BOOK: return 'bg-pastel-mint';
            case Tab.SHOP: return 'bg-pastel-pink';
            default: return 'bg-transparent';
        }
    }

    const handleLogout = async () => {
        // Update local state immediately
        setIsLoggedIn(false);
        setUser(null);
        setShowUserDropdown(false);

        // Sign out from Supabase
        await signOut();

        // Refresh the page to update all components
        router.refresh();
    }

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-2 ${scrolled ? 'bg-white/90 backdrop-blur-md border-black py-3' : 'bg-transparent border-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <div
                        className="flex items-center space-x-2 cursor-pointer group"
                        onClick={() => setActiveTab(Tab.HOME)}
                    >
                        <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
                            <SmashLogo className="w-full h-full bg-black" />
                        </div>
                        <span className="text-2xl font-display font-bold tracking-tight">Smash<span className="text-pastel-lilac">.</span></span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-2 bg-white p-1 rounded-xl border-2 border-black shadow-hard-sm relative">
                        {/* Sliding Highlight */}
                        <motion.div
                            className={`absolute top-1 bottom-1 rounded-lg border-2 border-black z-0 ${getBackgroundColor(activeTab)}`}
                            initial={false}
                            animate={{
                                left: highlightStyle.left,
                                width: highlightStyle.width,
                                opacity: highlightStyle.opacity
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />

                        {menuItems.map((item, index) => (
                            <button
                                key={item.tab}
                                ref={el => { tabsRef.current[index] = el }}
                                onClick={() => setActiveTab(item.tab)}
                                className={`relative px-6 py-2 rounded-lg font-bold text-sm transition-colors z-10 ${activeTab === item.tab ? "text-black" : "text-gray-500 hover:text-black"}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* User Account / Login Button */}
                    <div className="hidden md:block relative">
                        {isLoggedIn && user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                    className="bg-white text-black px-4 py-2.5 rounded-lg font-bold text-sm border-2 border-black shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
                                >
                                    <div className="w-8 h-8 bg-pastel-acid rounded-full border-2 border-black flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span>{user.name}</span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>

                                {/* Dropdown */}
                                {showUserDropdown && (
                                    <>
                                        {/* Click outside to close */}
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowUserDropdown(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute right-0 top-full mt-2 w-64 bg-white border-2 border-black rounded-xl shadow-hard-lg overflow-hidden z-50"
                                        >
                                            <div className="p-4 border-b-2 border-gray-100">
                                                <p className="font-bold text-sm text-black">{user.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all border-2 border-transparent hover:border-black hover:bg-white hover:text-black shadow-hard-sm">
                                Login
                            </button>
                        )}
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
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center font-display"
                    >
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex flex-col items-center space-y-6"
                        >
                            {menuItems.map((item) => (
                                <motion.button
                                    key={item.tab}
                                    variants={itemVariants}
                                    onClick={() => { setActiveTab(item.tab); setMobileMenuOpen(false); }}
                                    className={`text-4xl font-bold text-black hover:text-${item.color} transition-colors`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {item.label}
                                </motion.button>
                            ))}
                            <motion.button
                                variants={itemVariants}
                                onClick={() => { setMobileMenuOpen(false); setShowAuthModal(true); }}
                                className="text-4xl font-bold text-gray-500 hover:text-black transition-colors"
                            >
                                Login
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onLoginSuccess={(userData) => {
                    console.log("Logged in:", userData);
                    setIsLoggedIn(true);
                    setUser(userData);
                    setShowAuthModal(false);
                }}
            />
        </>
    )
}
