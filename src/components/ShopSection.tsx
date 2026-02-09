"use client"

import { Tag, Star, ArrowRight, ShoppingBag, Heart } from "lucide-react"
import { MOCK_PRODUCTS } from "@/constants"
import { Marquee } from "./Marquee"
import { useState } from "react"
import { motion } from "framer-motion"

export function ShopSection() {
    const [activeCategory, setActiveCategory] = useState("All")
    const categories = ["All", "Rackets", "Shoes", "Apparel", "Accessories"]

    const filteredProducts = activeCategory === "All"
        ? MOCK_PRODUCTS
        : MOCK_PRODUCTS.filter(p => {
            // Map display categories to data structure
            const categoryMap: Record<string, string> = {
                "Rackets": "Racket",
                "Shoes": "Shoes",
                "Apparel": "Apparel",
                "Accessories": "Accessory"
            }
            return p.category === categoryMap[activeCategory]
        })

    return (
        <div className="w-full bg-white pb-20 font-sans">
            {/* 1. Dynamic Hero Section */}
            <div className="relative w-full h-[70vh] bg-black overflow-hidden flex flex-col justify-between border-b-4 border-black">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=2076&auto=format&fit=crop"
                        alt="Shop Hero"
                        className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                </div>

                {/* Top Bar Navigation (Visual only) */}
                <div className="relative z-20 flex justify-between items-center p-6 text-white mix-blend-difference">
                    <span className="font-bold tracking-widest uppercase text-sm">Est. 2024</span>
                    <span className="font-bold tracking-widest uppercase text-sm">Jakarta, ID</span>
                </div>

                {/* Main Hero Content */}
                <div className="relative z-20 px-6 md:px-12 mb-12">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-5xl"
                    >
                        <div className="inline-flex items-center gap-2 bg-pastel-acid text-black border-2 border-black px-4 py-1 rounded-full mb-6 shadow-[4px_4px_0px_0px_white]">
                            <Star className="w-4 h-4 fill-black animate-spin-slow" />
                            <span className="font-black text-xs uppercase tracking-wider">New Collection Drop</span>
                        </div>
                        <h1 className="text-7xl md:text-[9rem] font-display font-black text-white leading-[0.85] tracking-tighter uppercase drop-shadow-[0_4px_0_#000]">
                            Court <br /> <span className="text-stroke-2 text-transparent hover:text-pastel-lilac transition-colors duration-300">Couture</span>
                        </h1>
                    </motion.div>
                </div>

                {/* Marquee Banner */}
                <div className="relative z-20 bg-pastel-yellow border-y-4 border-black py-3 rotate-1 scale-105 overflow-hidden">
                    <Marquee className="w-full" pauseOnHover>
                        <span className="text-2xl font-black uppercase mx-4 flex items-center gap-4">
                            Premium Gear <Star className="w-6 h-6 fill-black" />
                            Limited Edition <Star className="w-6 h-6 fill-black" />
                            Pro Level Performance <Star className="w-6 h-6 fill-black" />
                            Free Shipping on Orders over $50 <Star className="w-6 h-6 fill-black" />
                        </span>
                    </Marquee>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 mt-20">
                {/* 2. Category Navigation */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                    <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-full font-bold text-sm uppercase transition-all border-2 border-black whitespace-nowrap
                                    ${activeCategory === cat
                                        ? 'bg-black text-white shadow-[4px_4px_0px_0px_#A0E7E5] -translate-y-1'
                                        : 'bg-white text-black hover:bg-gray-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold border-b-2 border-black pb-1 cursor-pointer hover:text-pastel-lilac transition-colors">
                        <span>Filter & Sort</span>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>

                {/* 3. Product Grid (Masonry-ish) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {filteredProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group flex flex-col relative"
                        >
                            {/* Product Card Image */}
                            <div className="relative bg-gray-100 aspect-[4/5] w-full rounded-2xl border-2 border-black overflow-hidden mb-4 shadow-hard transition-all duration-300 group-hover:shadow-none group-hover:translate-x-[4px] group-hover:translate-y-[4px]">
                                {product.isNew && (
                                    <div className="absolute top-3 left-3 z-10 bg-pastel-pink border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-wider transform -rotate-2">
                                        New Drop
                                    </div>
                                )}
                                <button className="absolute top-3 right-3 z-10 bg-white/50 hover:bg-white border-2 border-transparent hover:border-black p-2 rounded-full transition-all">
                                    <Heart className="w-4 h-4" />
                                </button>

                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                />

                                {/* Quick Add Overlay */}
                                <div className="absolute inset-x-4 bottom-4 translate-y-[150%] group-hover:translate-y-0 transition-transform duration-300">
                                    <button className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:bg-gray-800 border-2 border-white/20 shadow-lg">
                                        <ShoppingBag className="w-4 h-4" /> Add to Cart
                                    </button>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{product.category}</p>
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`w-3 h-3 rounded-full border border-black ${i === 1 ? 'bg-red-400' : i === 2 ? 'bg-blue-400' : 'bg-yellow-400'}`}></div>
                                        ))}
                                    </div>
                                </div>
                                <h3 className="font-display font-bold text-lg leading-tight uppercase group-hover:underline decoration-2 underline-offset-2">
                                    {product.name}
                                </h3>
                                <p className="font-black text-xl font-mono mt-1">
                                    ${product.price}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 4. Newsletter Section */}
                <div className="mt-32 mb-12 relative">
                    <div className="absolute inset-0 bg-black translate-x-3 translate-y-3 rounded-[3rem]" />
                    <div className="relative bg-pastel-lilac rounded-[3rem] border-4 border-black p-8 md:p-16 overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 p-8 opacity-20 hidden md:block">
                            <Star className="w-64 h-64 fill-black text-black animate-slow-spin" />
                        </div>

                        <div className="relative z-10 max-w-2xl">
                            <h3 className="text-5xl md:text-7xl font-display font-black uppercase leading-[0.9] mb-6">
                                Don't Miss <br /> The Drop
                            </h3>
                            <p className="font-medium text-lg mb-8 border-l-4 border-black pl-4">
                                Sign up for early access to limited edition rackets, court-ready apparel, and exclusive community events.
                            </p>

                            <form className="flex flex-col md:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="email"
                                    placeholder="YOUR@EMAIL.COM"
                                    className="flex-1 bg-white border-2 border-black rounded-xl px-6 py-4 font-bold placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] focus:-translate-y-1 transition-all"
                                />
                                <button className="bg-black text-white px-10 py-4 rounded-xl border-2 border-black font-bold uppercase tracking-wider hover:bg-pastel-acid hover:text-black hover:shadow-[4px_4px_0px_0px_white] transition-all">
                                    Join the Club
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
