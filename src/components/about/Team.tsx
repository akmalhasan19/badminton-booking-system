"use client";

import React from 'react';
import { TEAM } from './data';

const Team: React.FC = () => {
    return (
        <section id="team" className="py-20 bg-neo-bg border-b-3 border-black text-neo-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b-3 border-black pb-8">
                    <h2 className="font-display font-black text-4xl sm:text-6xl md:text-7xl">
                        MEET THE <br /> MAKERS
                    </h2>
                    <p className="font-mono text-lg mt-4 md:mt-0 md:max-w-md bg-neo-yellow border-2 border-black p-4 shadow-hard-sm">
                        Warning: These people are highly caffeinated and dangerous on court.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {TEAM.map((member) => (
                        <div key={member.id} className="group">
                            <div className="relative">
                                {/* Image Container */}
                                <div className="aspect-square w-full border-3 border-black bg-white overflow-hidden relative shadow-hard group-hover:shadow-hard-lg transition-all">
                                    <img
                                        src={member.imageUrl}
                                        alt={member.name}
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                    {/* Overlay Pattern */}
                                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                                </div>

                                {/* Floating Badge */}
                                <div className={`absolute -top-3 -right-3 ${member.color} border-2 border-black w-12 h-12 flex items-center justify-center rounded-full shadow-hard-sm z-10 group-hover:rotate-12 transition-transform`}>
                                    <span className="font-display font-bold text-xl">:)</span>
                                </div>
                            </div>

                            {/* Text Details */}
                            <div className="mt-4">
                                <div className="inline-block bg-black text-white px-3 py-1 font-mono text-sm font-bold mb-2 transform -rotate-1 group-hover:rotate-0 transition-transform">
                                    {member.role}
                                </div>
                                <h3 className="font-display font-bold text-2xl border-b-2 border-black pb-1 inline-block">
                                    {member.name}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Team;
