"use client";

import React from 'react';
import { VALUES } from './data';

const Values: React.FC = () => {
    return (
        <section id="mission" className="py-20 bg-neo-bg border-b-3 border-black relative overflow-hidden text-neo-black">
            {/* Background grid lines */}
            <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                opacity: 0.05
            }}></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="mb-16 text-center">
                    <h2 className="inline-block bg-white border-2 border-black px-6 py-2 font-display font-bold text-4xl sm:text-5xl lg:text-6xl shadow-hard">
                        WHY WE EXIST
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {VALUES.map((value) => (
                        <div
                            key={value.id}
                            className="group relative bg-white border-3 border-black p-8 shadow-hard hover:shadow-hard-xl hover:-translate-y-2 transition-all duration-300"
                        >
                            {/* Color block that reveals on hover */}
                            <div className={`absolute top-0 right-0 w-full h-2 ${value.color} group-hover:h-full transition-all duration-300 -z-10 border-b-2 border-black`}></div>

                            <div className="relative z-10 flex flex-col items-start h-full">
                                <div className={`mb-6 p-4 border-2 border-black ${value.color} shadow-hard-sm group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all`}>
                                    {value.icon}
                                </div>

                                <h3 className="font-display font-bold text-3xl mb-4 group-hover:text-black bg-white group-hover:bg-transparent inline-block px-2">
                                    {value.title}
                                </h3>

                                <p className="font-mono text-lg leading-relaxed text-gray-800 bg-white p-2 group-hover:bg-transparent">
                                    {value.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Values;
