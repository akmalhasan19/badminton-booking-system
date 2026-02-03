import type { Metadata } from "next";
import { Space_Grotesk, Outfit } from "next/font/google";
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
        className={`${outfit.variable} ${spaceGrotesk.variable} antialiased min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-pastel-acid selection:text-black`}
      >
        <div className="bg-noise"></div>
        <LanguageProvider>
          <LoadingProvider>
            {children}
            <Toaster position="top-center" richColors />
          </LoadingProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
