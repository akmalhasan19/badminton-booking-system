import { Construction, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-neo-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Pattern Background */}
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                backgroundSize: "24px 24px"
            }}
            />

            <div className="relative max-w-2xl w-full text-center space-y-8">
                <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-pastel-yellow blur-xl opacity-50 rounded-full animate-pulse"></div>
                    <div className="relative bg-white p-6 rounded-2xl border-2 border-black shadow-hard-lg rotate-3 transition-transform hover:rotate-0 duration-300">
                        <Construction className="w-20 h-20 text-black" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-display font-black text-black uppercase tracking-tighter drop-shadow-sm">
                        Under<br />Maintenance
                    </h1>

                    <div className="bg-black text-white px-4 py-1 inline-block -rotate-2 transform">
                        <span className="font-mono font-bold tracking-widest uppercase text-sm">Court Refurbishment</span>
                    </div>

                    <p className="text-xl text-gray-700 max-w-lg mx-auto leading-relaxed">
                        We are currently polishing the floors and tightening the nets. <br />
                        Check back in a few minutes!
                    </p>
                </div>

                <div className="max-w-md mx-auto bg-white border-2 border-black p-6 rounded-xl shadow-neobrutalism text-left">
                    <div className="flex items-start gap-4">
                        <Info className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold font-display text-lg mb-1">Stay Updated</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Enter your email to get notified when we are back online.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-3 py-2 border-2 border-black rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pastel-yellow"
                                    disabled
                                />
                                <Button disabled className="opacity-50 cursor-not-allowed">
                                    Notify Me
                                </Button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 italic">
                                (Notification system also under maintenance)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-8 text-sm font-mono text-gray-400">
                    Error Code: 503_SERVICE_UNAVAILABLE
                </div>
            </div>
        </div>
    );
}
