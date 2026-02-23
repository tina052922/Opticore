"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

type Room = { id: string; code: string };
type College = { id: string; code: string; name: string };

function ScheduleGridViewInner({
  rooms,
  colleges,
  currentRoomId,
  currentCollegeId,
  canViewOtherColleges,
  userCollegeId
}: {
  rooms: Room[];
  colleges: College[];
  currentRoomId: string | null;
  currentCollegeId: string | null;
  canViewOtherColleges: boolean;
  userCollegeId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") p.set(key, value);
      else p.delete(key);
      router.push(`/dashboard/schedules?${p.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-slate-400">
        <span className="text-[11px]">Room:</span>
        <select
          value={currentRoomId ?? "all"}
          onChange={(e) => update("room", e.target.value)}
          className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-[11px] text-slate-200 outline-none focus:border-brand-teal"
        >
          <option value="all">All rooms</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.code}
            </option>
          ))}
        </select>
      </label>
      {canViewOtherColleges && (
        <label className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px]">College:</span>
          <select
            value={currentCollegeId ?? userCollegeId ?? "all"}
            onChange={(e) => update("college", e.target.value)}
            className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-[11px] text-slate-200 outline-none focus:border-brand-teal"
          >
            <option value="all">All colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

export function ScheduleGridView(props: Parameters<typeof ScheduleGridViewInner>[0]) {
  return (
    <Suspense fallback={<div className="h-8 w-48 animate-pulse rounded bg-slate-800" />}>
      <ScheduleGridViewInner {...props} />
    </Suspense>
  );
}
