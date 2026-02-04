import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Space_Grotesk, Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import { LoadingProvider } from "@/lib/loading-context";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Smash & Serve",
  description: "A next-gen court booking experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${spaceGrotesk.variable} ${spaceMono.variable} antialiased min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-pastel-acid selection:text-black`}
      >
        <div className="bg-noise"></div>
        <LanguageProvider>
          <LoadingProvider>
            {children}
            <Toaster position="top-center" richColors />
          </LoadingProvider>
        </LanguageProvider>
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
