"use client";

import Link from "next/link";
import { ArrowLeft, MapPinOff, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-neo-bg flex flex-col items-center justify-center p-4 overflow-hidden relative">
            {/* Decorative Circles */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pastel-pink rounded-full blur-3xl opacity-30 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pastel-mint rounded-full blur-3xl opacity-30 animate-pulse delay-700" />

            <div className="relative z-10 text-center max-w-2xl w-full">
                <div className="relative inline-block mb-8">
                    <div className="text-[10rem] font-display font-black leading-none text-black select-none drop-shadow-[8px_8px_0_rgba(0,0,0,1)]">
                        404
                    </div>
                    <div className="absolute -top-6 -right-12 rotate-12 bg-neo-yellow border-2 border-black px-4 py-2 shadow-neobrutalism animate-bounce">
                        <span className="font-bold font-mono text-lg">OUT!</span>
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-black tracking-tight">
                    Out of Bounds
                </h1>

                <p className="text-lg text-gray-600 mb-10 max-w-md mx-auto leading-relaxed">
                    The shuttlecock has landed outside the court. The page you are looking for does not exist or has been moved.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/">
                        <Button size="lg" className="min-w-[200px] border-2 border-black shadow-hard hover:shadow-hard-hover transition-all">
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Return to Court
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none" />
        </div>
    );
}
