"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function Navbar() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-6 md:px-12 py-4",
                scrolled ? "bg-white/80 backdrop-blur-md border-b border-gray-100" : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="text-xl font-serif font-bold tracking-tight text-primary">
                    GOR <span className="text-gray-400">SATRIA</span>
                </Link>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                    <Link href="#fasilitas" className="hover:text-primary transition-colors">
                        Fasilitas
                    </Link>
                    <Link href="#lokasi" className="hover:text-primary transition-colors">
                        Lokasi
                    </Link>
                    <Link href="/about" className="hover:text-primary transition-colors">
                        Tentang Kami
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="hidden md:flex">
                        Masuk
                    </Button>
                    <Button size="sm">Reservasi Sekarang</Button>
                </div>
            </div>
        </nav>
    )
}
