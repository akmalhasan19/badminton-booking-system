"use client";

import React from 'react';
import { STATS } from './data';

const Stats: React.FC = () => {
    return (
        <section className="border-b-3 border-black bg-white">
            {/* Mobile: Grid, Desktop: Flex row looking like a bar */}
            <div className="grid grid-cols-2 md:grid-cols-4">
                {STATS.map((stat, index) => (
                    <div
                        key={stat.id}
                        className={`
                        ${stat.color} 
                        p-8 
                        flex flex-col items-center justify-center 
                        text-center 
                        text-black
                        border-b-2 md:border-b-0 
                        ${index % 2 === 0 ? 'border-r-2' : ''} 
                        md:border-r-2 
                        md:last:border-r-0
                        group
                        hover:bg-black hover:text-white transition-colors duration-300
                        cursor-default
                    `}
                    >
                        <span className="font-display font-black text-4xl sm:text-5xl lg:text-6xl mb-2 group-hover:translate-x-1 transition-transform">
                            {stat.value}
                        </span>
                        <span className="font-mono font-bold uppercase tracking-widest text-sm sm:text-base">
                            {stat.label}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Stats;
