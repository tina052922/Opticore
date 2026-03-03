import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "OptiCore – Smart Campus Intelligence",
  description:
    "OptiCore is a smart campus intelligence system for CTU-Argao Campus with optimized timetabling, room navigation, and schedule analytics.",
  icons: { icon: "/icon.svg" }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50"
        suppressHydrationWarning
      >
        <div className="relative flex min-h-screen flex-col">
          <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-brand/90 flex items-center justify-center text-xs font-bold shadow-lg">
                CTU
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  OptiCore
                </p>
                <p className="text-xs text-slate-400">
                  Smart Campus Intelligence – CTU Argao
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <Providers>{children}</Providers>
          </main>
        </div>
      </body>
    </html>
  );
}

