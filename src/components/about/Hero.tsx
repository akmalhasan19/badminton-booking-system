"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const Hero: React.FC = () => {
    // const { t } = useLanguage(); // Placeholder for future i18n
    return (
        <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden border-b-3 border-black bg-neo-bg text-neo-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <div className="space-y-8">
                        <div className="inline-block border-2 border-black bg-neo-yellow px-4 py-1 shadow-hard-sm transform -rotate-1">
                            <span className="font-mono font-bold text-sm sm:text-base uppercase tracking-wider">
                                Since 2023
                            </span>
                        </div>

                        <h1 className="font-display font-bold text-6xl sm:text-7xl lg:text-8xl leading-none tracking-tight">
                            WE ARE <br />
                            <span className="text-neo-blue relative inline-block">
                                BOLD.
                                <svg className="absolute w-full h-4 -bottom-2 left-0 text-black" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                                </svg>
                            </span>
                        </h1>

                        <p className="font-mono text-lg sm:text-xl text-black max-w-lg leading-relaxed bg-white border-2 border-black p-4 shadow-hard-sm">
                            We disrupt the court booking game. We build digital experiences that punch you in the face (respectfully).
                            Welcome to the revolution.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button className="group relative inline-flex items-center justify-center px-8 py-4 font-mono font-bold text-black transition-all duration-200 bg-neo-green border-2 border-black shadow-hard hover:shadow-hard-hover hover:translate-x-1 hover:translate-y-1 focus:outline-none cursor-pointer">
                                <span className="mr-2 uppercase text-lg">Join the Cult</span>
                                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                            </button>

                            <button className="inline-flex items-center justify-center px-8 py-4 font-mono font-bold text-black transition-all duration-200 bg-white border-2 border-black shadow-hard hover:shadow-hard-hover hover:translate-x-1 hover:translate-y-1 hover:bg-neo-pink focus:outline-none uppercase text-lg cursor-pointer">
                                Read Manifesto
                            </button>
                        </div>
                    </div>

                    {/* Image / Visual */}
                    <div className="relative">
                        <div className="relative aspect-square sm:aspect-[4/3] w-full">
                            {/* Decorative elements behind */}
                            <div className="absolute -top-4 -right-4 w-full h-full bg-neo-pink border-2 border-black"></div>
                            <div className="absolute -bottom-4 -left-4 w-full h-full bg-neo-blue border-2 border-black"></div>

                            {/* Main Image Container */}
                            <div className="relative h-full w-full bg-white border-3 border-black shadow-hard-lg overflow-hidden flex items-center justify-center group">
                                <img
                                    src="https://picsum.photos/800/800?grayscale"
                                    alt="Brutalist Architecture"
                                    className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                                <div className="absolute inset-0 bg-neo-green/20 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                {/* Overlay Text */}
                                <div className="absolute bottom-0 right-0 bg-black text-white px-4 py-2 font-mono text-sm border-t-2 border-l-2 border-black">
                                    FIG. 01: THE VISION
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Background Decor */}
            <div className="absolute top-20 right-10 w-32 h-32 bg-neo-purple rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-neo-yellow rounded-full mix-blend-multiply filter blur-xl opacity-50 pointer-events-none"></div>
        </section>
    );
};

export default Hero;
