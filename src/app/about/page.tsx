import { Suspense } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Hero from "@/components/about/Hero";
import Stats from "@/components/about/Stats";
import Values from "@/components/about/Values";
import Timeline from "@/components/about/Timeline";
import Team from "@/components/about/Team";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-neo-bg text-neo-black font-sans selection:bg-neo-pink selection:text-black">
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>
            <main>
                <Hero />
                <Stats />
                <Values />
                <Timeline />
                <Team />
            </main>
            <Footer />
        </div>
    );
}
