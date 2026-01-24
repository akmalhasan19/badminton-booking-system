import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">

                <div className="space-y-4">
                    <Link href="/" className="text-xl font-serif font-bold tracking-tight text-primary">
                        GOR <span className="text-gray-400">SATRIA</span>
                    </Link>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Menghadirkan pengalaman olahraga kelas dunia dengan fasilitas premium dan pelayanan profesional.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-primary">Navigasi</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><Link href="/" className="hover:text-primary transition-colors">Beranda</Link></li>
                        <li><Link href="/booking" className="hover:text-primary transition-colors">Booking</Link></li>
                        <li><Link href="#fasilitas" className="hover:text-primary transition-colors">Fasilitas</Link></li>
                        <li><Link href="/about" className="hover:text-primary transition-colors">Tentang Kami</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-primary">Legal</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><Link href="/terms" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
                        <li><Link href="/privacy" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
                        <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-primary">Sosial Media</h4>
                    <div className="flex gap-4">
                        <Link href="#" className="p-2 bg-white rounded-full border border-gray-200 hover:border-gray-400 hover:text-black transition-all text-gray-500">
                            <Instagram size={20} />
                        </Link>
                        <Link href="#" className="p-2 bg-white rounded-full border border-gray-200 hover:border-gray-400 hover:text-black transition-all text-gray-500">
                            <Twitter size={20} />
                        </Link>
                        <Link href="#" className="p-2 bg-white rounded-full border border-gray-200 hover:border-gray-400 hover:text-black transition-all text-gray-500">
                            <Facebook size={20} />
                        </Link>
                    </div>
                </div>

            </div>
            <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-slate-200 text-center md:text-left text-sm text-gray-400">
                <p>&copy; {new Date().getFullYear()} GOR SATRIA. All rights reserved.</p>
            </div>
        </footer>
    )
}
