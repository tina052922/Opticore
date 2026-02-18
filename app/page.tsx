import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 flex justify-center">
        <div className="h-64 w-64 rounded-full bg-brand/40 blur-3xl" />
      </div>
      <div className="glass-panel w-full max-w-3xl rounded-3xl px-8 py-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-brand-teal">
          CTU–ARGAO CAPSTONE
        </p>
        <h1 className="mb-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          OptiCore – Smart Campus Intelligence System
        </h1>
        <p className="mb-6 max-w-2xl text-sm text-slate-200 sm:text-base">
          A unified platform for{" "}
          <span className="font-semibold text-brand-teal">
            academic timetabling
          </span>
          ,{" "}
          <span className="font-semibold text-brand-teal">
            room optimization
          </span>{" "}
          and{" "}
          <span className="font-semibold text-brand-teal">
            campus navigation
          </span>{" "}
          tailored for CTU–Argao Campus.
        </p>
        <div className="mb-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/login">Sign in to OptiCore</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/room-locator">Open Room Locator</Link>
          </Button>
        </div>
        <div className="grid gap-4 text-xs text-slate-200 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
            <p className="mb-1 text-xs font-semibold text-slate-300">
              Campus Intelligence Core
            </p>
            <p>
              Real-time view of today&apos;s schedules, conflicts, and room
              utilization.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
            <p className="mb-1 text-xs font-semibold text-slate-300">
              Timetabling & Optimization
            </p>
            <p>
              Greedy-based auto-scheduler with manual overrides and conflict
              highlighters.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
            <p className="mb-1 text-xs font-semibold text-slate-300">
              Smart Room Locator
            </p>
            <p>
              Offline campus map with building filters, floor views, and QR
              deep-links.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

