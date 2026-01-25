"use client"

import { Tag, Star } from "lucide-react"
import { MOCK_PRODUCTS } from "@/constants"

export function ShopSection() {
    return (
        <div className="w-full bg-white pb-20">
            {/* Hero Banner for Shop - Full Width */}
            <div className="relative w-full h-[60vh] bg-black overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=2076&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
                <div className="relative z-10 text-center space-y-6 max-w-4xl px-4">
                    <div className="inline-block bg-pastel-acid text-black border-2 border-white px-6 py-2 rounded-full transform -rotate-2">
                        <span className="font-bold text-sm tracking-[0.2em] uppercase">SS24 Collection Drop</span>
                    </div>
                    <h2 className="text-6xl md:text-9xl font-display font-black text-white leading-none tracking-tighter">
                        COURT <br /> COUTURE
                    </h2>
                    <p className="text-gray-300 text-xl font-medium max-w-xl mx-auto">
                        High-performance gear meeting high-fashion aesthetics. Limited quantities available.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-20">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 px-4">
                    <h3 className="text-4xl font-display font-black text-white mix-blend-difference uppercase">Latest Drops</h3>
                    <button className="text-black font-bold border-b-2 border-black hover:text-pastel-lilac hover:border-pastel-lilac transition-colors mt-4 md:mt-0">View All Categories</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {MOCK_PRODUCTS.map((product) => (
                        <div key={product.id} className="group flex flex-col">
                            <div className="relative bg-gray-100 h-96 w-full rounded-[2rem] border-2 border-black overflow-hidden mb-6 shadow-hard group-hover:shadow-none group-hover:translate-x-[4px] group-hover:translate-y-[4px] transition-all duration-300">
                                {product.isNew && (
                                    <div className="absolute top-4 left-4 z-10 bg-pastel-acid border-2 border-black px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm flex items-center">
                                        <Tag className="w-3 h-3 mr-1" /> New In
                                    </div>
                                )}
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />

                                {/* Overlay Action */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button className="bg-white text-black px-8 py-3 rounded-full font-bold border-2 border-black shadow-hard transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-pastel-pink">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>

                            <div className="px-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{product.category}</p>
                                        <h4 className="font-display font-bold text-xl text-black uppercase leading-tight">{product.name}</h4>
                                    </div>
                                    <span className="font-display font-black text-xl text-black bg-pastel-mint px-2 border border-black rounded shadow-[2px_2px_0px_0px_#000]">${product.price}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Newsletter / Promo Banner */}
                <div className="mt-32 bg-pastel-lilac rounded-[3rem] border-2 border-black p-12 relative overflow-hidden shadow-hard-lg">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h3 className="text-5xl font-display font-black uppercase leading-[0.9]">
                                Don't Miss <br /> The Next Drop
                            </h3>
                            <p className="font-medium text-lg">Sign up for early access to limited edition rackets and apparel.</p>
                            <div className="flex gap-4">
                                <input type="email" placeholder="ENTER EMAIL" className="flex-1 bg-white border-2 border-black rounded-xl px-6 py-4 font-bold placeholder:text-gray-400 focus:outline-none focus:shadow-hard transition-shadow" />
                                <button className="bg-black text-white px-8 py-4 rounded-xl border-2 border-black font-bold hover:bg-pastel-acid hover:text-black transition-colors">JOIN</button>
                            </div>
                        </div>
                        <div className="hidden md:flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white rounded-full border-2 border-black animate-spin-slow opacity-50 blur-xl"></div>
                                <Star className="w-48 h-48 text-black fill-pastel-yellow animate-float" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
