"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Construction, Hammer, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface FeatureInProgressProps {
    title?: string;
    description?: string;
    autoRedirect?: boolean;
    redirectTime?: number; // in milliseconds
    onBack?: () => void;
    className?: string;
}

export function FeatureInProgress({
    title = "Training in Progress",
    description = "This feature is currently doing specific training drills. It will be ready for the big game soon!",
    autoRedirect = true,
    redirectTime = 4000,
    onBack,
    className,
}: FeatureInProgressProps) {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(redirectTime);

    useEffect(() => {
        if (!autoRedirect) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 100)); // Update every 100ms for smoother progress
        }, 100);

        const redirectTimer = setTimeout(() => {
            if (onBack) {
                onBack();
            } else {
                router.back();
            }
        }, redirectTime);

        return () => {
            clearInterval(interval);
            clearTimeout(redirectTimer);
        };
    }, [autoRedirect, redirectTime, router, onBack]);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    const progress = Math.max(0, (timeLeft / redirectTime) * 100);

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300",
                className
            )}
        >
            <div className="relative max-w-md w-full mx-4 bg-white p-8 rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                {/* Decorative elements */}
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-pastel-pink rounded-full border-2 border-black flex items-center justify-center animate-bounce">
                    <div className="w-4 h-4 bg-black rounded-full" />
                </div>
                <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-pastel-mint rounded-full border-2 border-black flex items-center justify-center animate-spin-slow">
                    <div className="w-8 h-1 bg-black" />
                    <div className="absolute w-1 h-8 bg-black" />
                </div>

                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-pastel-yellow rounded-full animate-pulse opacity-50 blur-lg"></div>
                        <div className="relative bg-white p-4 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <Construction className="w-12 h-12 text-black" />
                        </div>
                        <Hammer className="absolute -right-2 -bottom-2 w-8 h-8 text-black animate-pulse" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-display font-black text-black uppercase tracking-tight">
                            {title}
                        </h2>
                        <p className="text-gray-600 font-medium">
                            {description}
                        </p>
                    </div>

                    {autoRedirect && (
                        <div className="w-full space-y-2">
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-black">
                                <div
                                    className="h-full bg-pastel-acid transition-all duration-100 ease-linear"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 font-mono">
                                Redirecting in <span className="font-bold text-black">{Math.ceil(timeLeft / 1000)}s</span>...
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handleBack}
                        className="w-full"
                        variant="default" // Assuming default is the primary style
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back Now
                    </Button>
                </div>
            </div>

            {/* Background Noise/Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('/noise.png')] mix-blend-overlay" />
        </div>
    );
}
