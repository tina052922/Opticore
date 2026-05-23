"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { findScheduleConflicts, type ScheduleSlot } from "@/lib/scheduling/conflicts";

type Schedule = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: { code: string; title: string };
  section: { program: { code: string }; name: string };
  instructor: { name: string };
  room: { id: string; code: string };
  roomId: string;
  instructorId: string;
  sectionId: string;
  status: string;
};

function getConflictType(schedule: Schedule, all: Schedule[]): string | null {
  const slots: ScheduleSlot[] = all.map((s) => ({
    id: s.id,
    day: s.day,
    startTime: s.startTime,
    endTime: s.endTime,
    roomId: s.roomId,
    instructorId: s.instructorId,
    sectionId: s.sectionId
  }));
  const hits = findScheduleConflicts(slots).filter(
    (c) => c.entryAId === schedule.id || c.entryBId === schedule.id
  );
  if (!hits.length) return null;
  const c = hits[0];
  if (c.type === "ROOM") return "Room double-booked";
  if (c.type === "INSTRUCTOR") return "Instructor overlap";
  if (c.type === "SECTION") return "Section overlap";
  return "Conflict";
}

export function TimetablingClient({
  schedules,
  rooms,
  onGenerate,
  onToggleStatus,
  canGenerate,
  canToggle
}: {
  schedules: Schedule[];
  rooms: { id: string; code: string }[];
  onGenerate: () => Promise<void>;
  onToggleStatus: (id: string, current: string) => Promise<void>;
  canGenerate: boolean;
  canToggle: boolean;
}) {
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "room">("list");

  const filtered =
    roomFilter === "all"
      ? schedules
      : schedules.filter((s) => s.roomId === roomFilter);

  const conflictCount = findScheduleConflicts(
    schedules.map((s) => ({
      id: s.id,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      roomId: s.roomId,
      instructorId: s.instructorId,
      sectionId: s.sectionId
    }))
  ).length;

  const byRoom = filtered.reduce<Record<string, Schedule[]>>((acc, s) => {
    const code = s.room.code;
    if (!acc[code]) acc[code] = [];
    acc[code].push(s);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          How it works
        </h3>
        <ul className="space-y-1 text-xs text-slate-300">
          <li>
            <strong className="text-slate-200">Auto Generate</strong> creates draft
            schedules for sections using available rooms and time slots.
          </li>
          <li>
            <strong className="text-slate-200">Conflicts</strong> (red rows) = same
            room, instructor, or section at the same time. Resolve before marking
            Pending.
          </li>
          <li>
            <strong className="text-slate-200">View by room</strong> helps check
            room usage. <strong className="text-slate-200">Mark Pending</strong> when
            ready for College Admin to submit.
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 px-3 py-2">
            <span className="text-[11px] text-slate-400">Total:</span>
            <span className="font-semibold text-slate-100">{filtered.length}</span>
            <span className="text-[11px] text-slate-400">schedules</span>
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
              conflictCount > 0 ? "bg-red-950/40" : "bg-emerald-950/40"
            }`}
          >
            <span className="text-[11px] text-slate-400">Conflicts:</span>
            <span
              className={`font-semibold ${conflictCount > 0 ? "text-red-300" : "text-emerald-300"}`}
            >
              {conflictCount}
            </span>
            {conflictCount === 0 && filtered.length > 0 && (
              <span className="text-[10px] text-emerald-400/80">✓ Ready</span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded px-2 py-1 text-[11px] ${
                viewMode === "list"
                  ? "bg-brand-teal/20 text-brand-teal"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("room")}
              className={`rounded px-2 py-1 text-[11px] ${
                viewMode === "room"
                  ? "bg-brand-teal/20 text-brand-teal"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              By room
            </button>
          </div>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-[11px] text-slate-200"
          >
            <option value="all">All rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code}
              </option>
            ))}
          </select>
        </div>
        {canGenerate && (
          <form action={onGenerate}>
            <Button type="submit" size="sm">
              Auto Generate Draft
            </Button>
          </form>
        )}
      </div>

      {viewMode === "room" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(byRoom)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([roomCode, list]) => (
              <div
                key={roomCode}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-3"
              >
                <h4 className="mb-2 text-xs font-semibold text-slate-200">
                  Room {roomCode}
                </h4>
                <div className="space-y-1 text-[11px]">
                  {list
                    .sort(
                      (a, b) =>
                        ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].indexOf(
                          a.day
                        ) -
                        ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].indexOf(
                          b.day
                        )
                    )
                    .map((s) => {
                      const conflict = getConflictType(s, schedules);
                      return (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between rounded px-2 py-1 ${
                            conflict ? "bg-red-950/40" : "bg-slate-900/60"
                          }`}
                        >
                          <span>
                            {s.day.slice(0, 3)} {s.startTime} · {s.subject.code}{" "}
                            ({s.section.program.code} {s.section.name})
                          </span>
                          {conflict && (
                            <span
                              className="rounded bg-red-900/60 px-1.5 py-0.5 text-[10px] text-red-300"
                              title={conflict}
                            >
                              Conflict
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          {Object.keys(byRoom).length === 0 && (
            <p className="col-span-2 py-8 text-center text-xs text-slate-400">
              No schedules for selected room.
            </p>
          )}
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="max-h-[420px] overflow-auto text-xs">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-900/95 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Day</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Section</th>
                  <th className="px-3 py-2">Instructor</th>
                  <th className="px-3 py-2">Room</th>
                  <th className="px-3 py-2">Status</th>
                  {canToggle && (
                    <th className="px-3 py-2 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const conflict = getConflictType(s, schedules);
                  return (
                    <tr
                      key={s.id}
                      className={
                        conflict
                          ? "bg-red-950/50 hover:bg-red-950/60"
                          : "odd:bg-slate-900/40"
                      }
                    >
                      <td className="px-3 py-2">{s.day}</td>
                      <td className="px-3 py-2">
                        {s.startTime}–{s.endTime}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-medium text-slate-100">
                          {s.subject.code}
                        </span>{" "}
                        <span className="text-slate-400">· {s.subject.title}</span>
                      </td>
                      <td className="px-3 py-2">
                        {s.section.program.code} {s.section.name}
                      </td>
                      <td className="px-3 py-2">{s.instructor.name}</td>
                      <td className="px-3 py-2">{s.room.code}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            s.status === "DRAFT"
                              ? "bg-slate-800 text-slate-200"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {s.status}
                        </span>
                        {conflict && (
                          <span
                            className="ml-1 rounded bg-red-900/60 px-1.5 py-0.5 text-[10px] text-red-300"
                            title={conflict}
                          >
                            {conflict}
                          </span>
                        )}
                      </td>
                      {canToggle && (
                        <td className="px-3 py-2 text-right">
                          <form
                            action={async () => {
                              await onToggleStatus(
                                s.id,
                                s.status === "DRAFT" ? "PENDING" : "DRAFT"
                              );
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="text-[11px]"
                            >
                              {s.status === "DRAFT"
                                ? "Mark Pending"
                                : "Mark Draft"}
                            </Button>
                          </form>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={canToggle ? 8 : 7}
                      className="px-3 py-10 text-center text-xs text-slate-400"
                    >
                      No schedules yet.{" "}
                      {canGenerate && (
                        <>
                          Use{" "}
                          <span className="font-semibold text-brand-teal">
                            Auto Generate Draft
                          </span>{" "}
                          to create a baseline.
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
