import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";
import { redirect } from "next/navigation";
import { ActivityFeed } from "@/components/activity-feed";

// Always fetch fresh data when the dashboard is opened (no static cache)
export const dynamic = "force-dynamic";

async function getDashboardStats() {
  const [todaySchedules, conflicts, rooms, usedRooms] = await Promise.all([
    prisma.schedule.count(),
    prisma.schedule.count({
      where: {
        status: "PENDING"
      }
    }),
    prisma.room.count(),
    prisma.schedule.groupBy({
      by: ["roomId"],
      _count: { _all: true }
    })
  ]);

  const roomUtilization =
    rooms === 0 ? 0 : Math.min(100, Math.round((usedRooms.length / rooms) * 100));

  return { todaySchedules, conflicts, roomUtilization };
}

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const programId = (session?.user as any)?.programId;
  // Chairman Admin with a program: send to their primary dashboard (Subject Offerings)
  if (role === "CHAIRMAN_ADMIN" && programId) {
    redirect("/dashboard/offerings");
  }
  const { todaySchedules, conflicts, roomUtilization } = await getDashboardStats();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Campus Intelligence Core
        </h1>
        <p className="text-xs text-slate-400">
          High-level view of today&apos;s academic activity and room usage.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-panel rounded-2xl px-4 py-4 text-xs">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Today&apos;s Schedules
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            {todaySchedules}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Total approved and draft entries.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-4 py-4 text-xs">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Conflicts / Pending
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">
            {conflicts}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Awaiting resolution by administrators.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-4 py-4 text-xs">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Room Utilization
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {roomUtilization}%
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Distinct rooms used across all schedules.
          </p>
        </div>
      </div>
      <div className="glass-panel mt-2 rounded-2xl px-4 py-4 text-xs text-slate-300">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Live Activity (Audit Feed)
        </p>
        <ActivityFeed
          role={(session?.user as any)?.role ?? ""}
          collegeId={(session?.user as any)?.collegeId ?? null}
          programId={(session?.user as any)?.programId ?? null}
          userId={(session?.user as any)?.id ?? null}
        />
      </div>
    </div>
  );
}

