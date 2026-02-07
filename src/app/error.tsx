"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-neo-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Shapes */}
            <div className="absolute top-20 right-20 w-32 h-32 bg-pastel-acid rounded-md border-2 border-black shadow-neobrutalism rotate-12 opacity-50" />
            <div className="absolute bottom-20 left-20 w-40 h-40 bg-pastel-lilac rounded-full border-2 border-black shadow-neobrutalism -rotate-6 opacity-50" />

            <div className="relative z-10 max-w-xl w-full bg-white border-2 border-black shadow-hard-xl rounded-3xl p-8 md:p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary rounded-full border-2 border-black shadow-neobrutalism mb-8 animate-pulse">
                    <AlertOctagon className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-4xl font-display font-black mb-4 uppercase tracking-tighter">
                    Net Fault!
                </h1>

                <p className="text-gray-600 mb-8 text-lg">
                    Something went wrong on our side. We have hit the net. <br />
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                        Error: {error.message || "Unknown error"}
                    </span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={reset}
                        size="lg"
                        className="border-2 border-black shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all bg-primary"
                    >
                        <RotateCcw className="mr-2 h-5 w-5" />
                        Re-serve (Try Again)
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.location.href = '/'}
                        className="border-2 border-black shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                    >
                        Return Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
