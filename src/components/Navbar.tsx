"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, User, Users, LogOut, ChevronDown, Calendar, CreditCard, Bell, HelpCircle, Settings, Star, Gift } from "lucide-react"
import { Tab } from "@/types"
import { SmashLogo } from "@/components/SmashLogo"
import { getCurrentUser, signOut } from "@/lib/auth/actions"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface NavbarProps {
    activeTab?: Tab;
    setActiveTab?: (tab: Tab) => void;
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

import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { AuthModal } from "@/components/AuthModal"

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
    const { t } = useLanguage()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    // ... (keep existing state declarations: scrolled, mobileMenuOpen, showAuthModal, highlightStyle, tabsRef, user, isLoggedIn, showUserDropdown, showMemberDetails) ...
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [highlightStyle, setHighlightStyle] = useState({ left: 0, width: 0, opacity: 0 })
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

    // User state
    const [user, setUser] = useState<{
        name: string;
        email: string;
        avatar_url?: string;
        skill_score?: number;
        skill_review_count?: number;
    } | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [showUserDropdown, setShowUserDropdown] = useState(false)
    const [showMemberDetails, setShowMemberDetails] = useState(false)

    // Determine current active tab
    const currentTab = activeTab || (() => {
        if (pathname === "/" && searchParams.get('tab') === 'book') return Tab.BOOK
        if (pathname === "/" && searchParams.get('tab') === 'match') return Tab.MATCH
        if (pathname === "/") return Tab.HOME
        if (pathname.startsWith("/booking")) return Tab.BOOK
        if (pathname.startsWith("/shop")) return Tab.SHOP
        return Tab.HOME
    })()

    // Handle tab click
    const handleTabClick = (tab: Tab, path: string) => {
        if (setActiveTab) {
            setActiveTab(tab)
        } else {
            router.push(path)
        }
        setMobileMenuOpen(false)
    }

    // ... (keep existing useEffects) ...
    // Check auth on mount
    useEffect(() => {
        async function checkAuth() {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setIsLoggedIn(true);
                setUser({
                    name: currentUser.name,
                    email: currentUser.email,
                    avatar_url: currentUser.avatar_url,
                    skill_score: currentUser.skill_score,
                    skill_review_count: currentUser.skill_review_count
                });
            }
        }
        checkAuth();

        // Listen for user updates (e.g. avatar upload)
        const handleUserUpdate = () => {
            checkAuth();
        };

        window.addEventListener('user_updated', handleUserUpdate);
        return () => window.removeEventListener('user_updated', handleUserUpdate);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    useEffect(() => {
        const activeIndex = menuItems.findIndex(item => item.tab === currentTab)
        const element = tabsRef.current[activeIndex]

        if (element) {
            setHighlightStyle({
                left: element.offsetLeft,
                width: element.offsetWidth,
                opacity: 1
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTab, t]) // Added t dependency to update highlight when language changes

    const getBackgroundColor = (tab: Tab) => {
        switch (tab) {
            case Tab.HOME: return 'bg-pastel-acid';
            case Tab.BOOK: return 'bg-pastel-mint';
            case Tab.MATCH: return 'bg-pastel-lilac';
            case Tab.SHOP: return 'bg-pastel-pink';
            default: return 'bg-transparent';
        }
    }

    const skillScore = user?.skill_score ?? 0
    const skillReviewCount = user?.skill_review_count ?? 0
    const formattedSkillScore = skillReviewCount > 0 ? skillScore.toFixed(1) : '0'

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
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-2 ${scrolled ? 'bg-white/90 backdrop-blur-md border-black pt-5 pb-3' : 'bg-transparent border-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <div
                        className="flex items-center space-x-2 cursor-pointer group"
                        onClick={() => handleTabClick(Tab.HOME, "/")}
                    >
                        <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
                            <SmashLogo className="w-full h-full bg-black" />
                        </div>
                        <span className="text-2xl font-display font-bold tracking-tight">Smash<span className="text-pastel-lilac">.</span></span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center p-1 bg-white border-2 border-black rounded-full shadow-hard-sm relative">
                        {/* Sliding Highlight */}
                        <motion.div
                            className={`absolute top-1 bottom-1 rounded-full border-2 border-black z-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${getBackgroundColor(currentTab)}`}
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
                                onClick={() => handleTabClick(item.tab, item.path)}
                                className={`relative px-8 py-2 rounded-full font-bold text-sm transition-colors z-10 uppercase tracking-wide ${currentTab === item.tab ? "text-black" : "text-gray-500 hover:text-black"}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* User Account / Login Button / Language Switcher */}
                    <div className="hidden md:block relative">
                        <div className="flex items-center gap-4">
                            <LanguageSwitcher />

                            <button
                                onClick={() => router.push('/partner/register')}
                                className="bg-pastel-yellow text-black px-6 py-2.5 rounded-lg font-bold text-sm border-2 border-black shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                {t.join_us}
                            </button>

                            {isLoggedIn && user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                                        className="bg-white text-black pl-1 pr-4 py-1 rounded-full font-bold text-sm border-2 border-black shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 bg-gray-100 rounded-full border-2 border-black flex items-center justify-center overflow-hidden shrink-0">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                        <span>{user.name}</span>
                                        <ChevronDown className="w-4 h-4 ml-1" />
                                    </button>

                                    {/* Traveloka-style Dropdown */}
                                    <AnimatePresence>
                                        {showUserDropdown && (
                                            <>
                                                {/* Click outside to close */}
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setShowUserDropdown(false)}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                    className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-black rounded-2xl shadow-hard-lg overflow-y-auto max-h-[80vh] overscroll-contain z-50"
                                                >
                                                    {/* Header with gradient */}
                                                    <div className="bg-gradient-to-r from-black via-gray-800 to-black p-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-14 h-14 bg-pastel-acid rounded-full border-3 border-white flex items-center justify-center shadow-lg overflow-hidden">
                                                                {user.avatar_url ? (
                                                                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-7 h-7 text-black" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-bold text-white text-lg">{user.name}</p>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setShowMemberDetails(!showMemberDetails); }}
                                                                    className="flex items-center gap-1 mt-1 hover:bg-white/10 px-2 py-0.5 rounded transition-colors -ml-2 cursor-pointer"
                                                                >
                                                                    <Star className="w-3.5 h-3.5 text-pastel-yellow fill-pastel-yellow" />
                                                                    <span className="text-xs text-gray-300">{t.smash_member}</span>
                                                                    <motion.div
                                                                        animate={{ rotate: showMemberDetails ? 180 : 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                    >
                                                                        <ChevronDown className="w-3 h-3 text-gray-400" />
                                                                    </motion.div>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Member Details Expandable Section */}
                                                        <AnimatePresence>
                                                            {showMemberDetails && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                                            <span>Bronze</span>
                                                                            <span>Silver</span>
                                                                        </div>
                                                                        <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                                                                            <motion.div
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: "20%" }}
                                                                                transition={{ delay: 0.2, duration: 0.5 }}
                                                                                className="h-full bg-pastel-yellow"
                                                                            />
                                                                        </div>
                                                                        <p className="text-[10px] text-gray-400 mt-1 text-right">200 / 1000 XP to upgrade</p>

                                                                        <div className="mt-3 space-y-2">
                                                                            <p className="text-xs font-bold text-white">Your Benefits:</p>
                                                                            <ul className="text-[10px] text-gray-300 space-y-1">
                                                                                <li className="flex items-center gap-1.5">
                                                                                    <div className="w-1 h-1 rounded-full bg-pastel-mint" />
                                                                                    Priority Booking
                                                                                </li>
                                                                                <li className="flex items-center gap-1.5">
                                                                                    <div className="w-1 h-1 rounded-full bg-pastel-mint" />
                                                                                    Tingkatkan Keterampilan
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                        {/* Points badge */}
                                                        <div className="mt-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 cursor-pointer hover:bg-white/20 transition-colors">
                                                            <div className="w-6 h-6 bg-pastel-yellow rounded-full flex items-center justify-center">
                                                                <Gift className="w-3.5 h-3.5 text-black" />
                                                            </div>
                                                            <span className="text-white font-bold text-sm">{formattedSkillScore} Keterampilan</span>
                                                            <span className="text-gray-400 text-xs ml-auto">{skillReviewCount} review</span>
                                                        </div>
                                                    </div>

                                                    {/* Menu Items */}
                                                    <div className="py-2">
                                                        <button
                                                            onClick={() => { setShowUserDropdown(false); router.push('/bookings'); }}
                                                            className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                                                        >
                                                            <div className="w-9 h-9 bg-pastel-mint/30 rounded-lg flex items-center justify-center group-hover:bg-pastel-mint/50 transition-colors">
                                                                <Calendar className="w-4.5 h-4.5 text-gray-700" />
                                                            </div>
                                                            <span>{t.my_bookings}</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { setShowUserDropdown(false); router.push('/communities'); }}
                                                            className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                                                        >
                                                            <div className="w-9 h-9 bg-pastel-blue/30 rounded-lg flex items-center justify-center group-hover:bg-pastel-blue/50 transition-colors">
                                                                <Users className="w-4.5 h-4.5 text-gray-700" />
                                                            </div>
                                                            <span>Komunitas</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { setShowUserDropdown(false); router.push('/profile'); }}
                                                            className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                                                        >
                                                            <div className="w-9 h-9 bg-pastel-lilac/30 rounded-lg flex items-center justify-center group-hover:bg-pastel-lilac/50 transition-colors">
                                                                <User className="w-4.5 h-4.5 text-gray-700" />
                                                            </div>
                                                            <span>{t.edit_profile}</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { setShowUserDropdown(false); router.push('/payment-methods'); }}
                                                            className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                                                        >
                                                            <div className="w-9 h-9 bg-pastel-pink/30 rounded-lg flex items-center justify-center group-hover:bg-pastel-pink/50 transition-colors">
                                                                <CreditCard className="w-4.5 h-4.5 text-gray-700" />
                                                            </div>
                                                            <span>{t.payment_methods}</span>
                                                        </button>

                                                        <div className="border-t border-gray-100 my-2" />

                                                        <button
                                                            onClick={() => { setShowUserDropdown(false); router.push('/notifications'); }}
                                                            className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                                                        >
                                                            <div className="w-9 h-9 bg-pastel-yellow/30 rounded-lg flex items-center justify-center group-hover:bg-pastel-yellow/50 transition-colors">
                                                                <Bell className="w-4.5 h-4.5 text-gray-700" />
                                                            </div>
                                                            <span>{t.notifications}</span>
                                                            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { setShowUserDropdown(false); router.push('/settings'); }}
                                                            className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                                                        >
                                                            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                                                <Settings className="w-4.5 h-4.5 text-gray-700" />
                                                            </div>
                                                            <span>{t.settings}</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { setShowUserDropdown(false); router.push('/help'); }}
                                                            className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                                                        >
                                                            <div className="w-9 h-9 bg-pastel-acid/30 rounded-lg flex items-center justify-center group-hover:bg-pastel-acid/50 transition-colors">
                                                                <HelpCircle className="w-4.5 h-4.5 text-gray-700" />
                                                            </div>
                                                            <span>{t.help_center}</span>
                                                        </button>
                                                    </div>

                                                    {/* Logout */}
                                                    <div className="border-t-2 border-gray-100">
                                                        <button
                                                            onClick={handleLogout}
                                                            className="w-full px-5 py-4 text-left text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                                                        >
                                                            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                                                                <LogOut className="w-4.5 h-4.5 text-red-600" />
                                                            </div>
                                                            <span>{t.logout}</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all border-2 border-transparent hover:border-black hover:bg-white hover:text-black shadow-hard-sm">
                                    {t.login}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile Language Switcher & Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <LanguageSwitcher />
                        <button
                            className="p-2 text-black bg-white border-2 border-black rounded-lg shadow-hard-sm"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
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
                                    onClick={() => handleTabClick(item.tab, item.path)}
                                    className={`text-4xl font-bold text-black hover:text-${item.color} transition-colors`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {item.label}
                                </motion.button>
                            ))}
                            <motion.button
                                variants={itemVariants}
                                onClick={() => { setMobileMenuOpen(false); router.push('/partner/register'); }}
                                className="text-4xl font-bold text-pastel-yellow hover:text-yellow-600 transition-colors"
                            >
                                {t.join_us}
                            </motion.button>

                            {/* Show user profile card or login based on auth state */}
                            {isLoggedIn && user ? (
                                <>
                                    <motion.div
                                        variants={itemVariants}
                                        onClick={() => { setMobileMenuOpen(false); router.push('/account'); }}
                                        className="flex flex-col items-center gap-2 py-4 px-6 bg-gray-50 rounded-xl border-2 border-black cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="w-16 h-16 bg-pastel-acid rounded-full border-2 border-black flex items-center justify-center overflow-hidden">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-8 h-8" />
                                            )}
                                        </div>
                                        <span className="text-lg font-bold text-black">{user.name}</span>
                                        <span className="text-sm text-gray-500">{user.email}</span>
                                    </motion.div>
                                    <motion.button
                                        variants={itemVariants}
                                        onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                                        className="text-3xl font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-2"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <LogOut className="w-8 h-8" />
                                        {t.logout}
                                    </motion.button>
                                </>
                            ) : (
                                <motion.button
                                    variants={itemVariants}
                                    onClick={() => { setMobileMenuOpen(false); setShowAuthModal(true); }}
                                    className="text-4xl font-bold text-gray-500 hover:text-black transition-colors"
                                >
                                    {t.login}
                                </motion.button>
                            )}
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
                    setIsLoggedIn(true);
                    setUser({
                        name: userData.name,
                        email: userData.email,
                        avatar_url: userData.avatar_url
                    });
                    setShowAuthModal(false);
                }}
            />
        </>
    )
}
