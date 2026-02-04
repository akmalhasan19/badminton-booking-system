"use client";

import React from 'react';
import { TIMELINE } from './data';

const Timeline: React.FC = () => {
    return (
        <section id="journey" className="py-20 bg-white border-b-3 border-black text-neo-black">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <h2 className="font-display font-black text-5xl sm:text-6xl uppercase tracking-tight">
                        Our Journey
                    </h2>
                    <p className="font-mono mt-4 text-xl">From zero to slightly more than zero.</p>
                </div>

                <div className="relative">
                    {/* The Thick Vertical Line */}
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-3 bg-black transform md:-translate-x-1/2"></div>

                    <div className="space-y-12">
                        {TIMELINE.map((item, index) => (
                            <div key={item.id} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>

                                {/* Connector Dot */}
                                <div className="absolute left-4 md:left-1/2 w-8 h-8 bg-white border-4 border-black rounded-full z-10 transform -translate-x-1/2 flex items-center justify-center">
                                    <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                                </div>

                                {/* Content Box */}
                                <div className={`ml-16 md:ml-0 w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                                    <div className={`
                    relative 
                    bg-neo-bg 
                    border-3 border-black 
                    p-6 
                    shadow-hard 
                    hover:shadow-hard-lg hover:-translate-y-1 
                    transition-all duration-200
                  `}>
                                        {/* Tab style top */}
                                        <div className="absolute -top-4 left-4 bg-black text-white px-3 py-1 font-mono text-sm font-bold">
                                            FOLDER: {item.year}
                                        </div>

                                        <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border-2 border-black ${item.color}`}></div>

                                        <h3 className="font-display font-bold text-2xl mt-2 mb-2">{item.title}</h3>
                                        <p className="font-mono text-sm sm:text-base">{item.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Timeline;
