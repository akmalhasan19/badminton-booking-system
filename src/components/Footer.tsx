"use client"

import { Users, Trophy } from "lucide-react"
import Link from "next/link"
import { SmashLogo } from "@/components/SmashLogo"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export function Footer() {
    const { t } = useLanguage()

    return (
        <footer className="bg-black text-white border-t-2 border-black py-16 mt-20 relative overflow-hidden">
            {/* Giant Text Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none opacity-5">
                <span className="text-[20vw] font-display font-black leading-none">SMASH</span>
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <SmashLogo className="w-full h-full bg-pastel-acid" />
                            </div>
                            <span className="text-2xl font-display font-bold tracking-tight">Smash & Serve</span>
                        </div>
                        <p className="text-gray-400 max-w-sm text-lg">
                            {t.footer_tagline} <br />
                            {t.footer_tagline_line2}
                        </p>
                        <div className="flex space-x-4">
                            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 hover:bg-pastel-acid hover:text-black hover:border-black transition-all cursor-pointer">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 hover:bg-pastel-mint hover:text-black hover:border-black transition-all cursor-pointer">
                                <Trophy className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold font-display text-xl mb-6 text-pastel-acid">{t.footer_platform}</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link href="/" className="hover:text-white cursor-pointer transition-colors">{t.footer_find_court}</Link></li>
                            <li><Link href="/tournaments" className="hover:text-white cursor-pointer transition-colors">{t.footer_tournaments}</Link></li>
                            <li><Link href="/coaching" className="hover:text-white cursor-pointer transition-colors">{t.footer_coaching}</Link></li>
                            <li><Link href="/" className="hover:text-white cursor-pointer transition-colors">{t.footer_pro_shop}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold font-display text-xl mb-6 text-pastel-mint">{t.footer_legal}</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link href="/privacy" className="hover:text-white cursor-pointer transition-colors">{t.footer_privacy}</Link></li>
                            <li><Link href="/terms" className="hover:text-white cursor-pointer transition-colors">{t.footer_terms}</Link></li>
                            <li><Link href="/cookies" className="hover:text-white cursor-pointer transition-colors">{t.footer_cookies}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>{t.footer_copyright}</p>
                    <div className="mt-4 md:mt-0 font-display font-bold tracking-widest uppercase">
                        {t.footer_designed_in}
                    </div>
                </div>
            </div>
        </footer>
    )
}
