import type { Metadata } from "next";
import { VT323, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { CanvasBackground } from "@/components/canvas-background";
import { PublicNav } from "@/components/public-nav";
import { ScenePicker } from "@/components/scene-picker";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "blooshoo",
    template: "%s | blooshoo",
  },
  description: "Personal blog and portfolio by blooshoo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${vt323.variable} ${ibmPlexMono.variable} font-mono bg-background text-foreground min-h-screen flex flex-col`}
      >
        <Providers>
          {/* Animated canvas background */}
          <CanvasBackground />

          {/* CRT scanline overlay */}
          <div className="scanlines" aria-hidden="true" />

          {/* Content wrapper */}
          <div className="relative z-10 flex flex-col min-h-screen">
            <PublicNav />

            <main className="flex-1">{children}</main>

            <footer className="border-t border-border mt-auto">
              <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} bloo
                  <ScenePicker />
                  hoo
                </span>
              </div>
            </footer>
          </div>

          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
