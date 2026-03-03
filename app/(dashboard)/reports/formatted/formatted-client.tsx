"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type FormattedSchedule = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectTitle: string;
  instructorName: string;
  roomCode: string;
  sectionName: string;
  programCode: string;
};

const TIME_SLOTS = [
  { label: "7:00-8:00", start: "07:00" },
  { label: "8:00-9:00", start: "08:00" },
  { label: "9:00-10:00", start: "09:00" },
  { label: "10:00-11:00", start: "10:00" },
  { label: "11:00-12:00", start: "11:00" },
  { label: "12:00-1:00", start: "12:00" },
  { label: "1:00-2:00", start: "13:00" },
  { label: "2:00-3:00", start: "14:00" },
  { label: "3:00-4:00", start: "15:00" },
  { label: "4:00-5:00", start: "16:00" }
];

type Props = {
  schedules: FormattedSchedule[];
};

type Mode = "teacher" | "section" | "room";

export default function FormattedReportsClient({ schedules }: Props) {
  const [mode, setMode] = useState<Mode>("teacher");
  const [selectedKey, setSelectedKey] = useState<string>("");

  const days = useMemo(() => {
    const unique = Array.from(new Set(schedules.map((s) => s.day))).filter(Boolean);
    if (unique.length === 0) return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    return unique;
  }, [schedules]);

  const teacherOptions = useMemo(
    () =>
      Array.from(
        new Set(
          schedules
            .map((s) => s.instructorName)
            .filter((n) => n && n !== "—")
        )
      ),
    [schedules]
  );

  const sectionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          schedules
            .map((s) => `${s.programCode} ${s.sectionName}`)
            .filter((n) => n && !n.includes("—"))
        )
      ),
    [schedules]
  );

  const roomOptions = useMemo(
    () =>
      Array.from(
        new Set(
          schedules
            .map((s) => s.roomCode)
            .filter((n) => n && n !== "—")
        )
      ),
    [schedules]
  );

  const filtered = useMemo(() => {
    if (!selectedKey) return [] as FormattedSchedule[];
    switch (mode) {
      case "teacher":
        return schedules.filter((s) => s.instructorName === selectedKey);
      case "section":
        return schedules.filter((s) => `${s.programCode} ${s.sectionName}` === selectedKey);
      case "room":
        return schedules.filter((s) => s.roomCode === selectedKey);
      default:
        return [];
    }
  }, [mode, selectedKey, schedules]);

  const grid = useMemo(() => {
    const map: Record<string, Record<string, string[]>> = {};
    for (const slot of TIME_SLOTS) {
      map[slot.start] = {};
      for (const day of days) {
        map[slot.start][day] = [];
      }
    }
    for (const s of filtered) {
      const slot = TIME_SLOTS.find((t) => t.start === s.startTime);
      if (!slot) continue;
      if (!map[slot.start][s.day]) {
        map[slot.start][s.day] = [];
      }
      const cellLines: string[] = [];
      if (mode === "teacher") {
        cellLines.push(`${s.subjectCode}`);
        cellLines.push(`${s.programCode} ${s.sectionName}`);
        cellLines.push(`${s.roomCode}`);
      } else if (mode === "section") {
        cellLines.push(`${s.subjectCode}`);
        cellLines.push(`${s.instructorName}`);
        cellLines.push(`${s.roomCode}`);
      } else {
        cellLines.push(`${s.subjectCode}`);
        cellLines.push(`${s.programCode} ${s.sectionName}`);
        cellLines.push(`${s.instructorName}`);
      }
      map[slot.start][s.day].push(cellLines.join(" • "));
    }
    return map;
  }, [filtered, mode, days]);

  const handleExportPdf = () => {
    // Use the browser's print dialog; user can "Save as PDF".
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const titleLabel =
    mode === "teacher"
      ? "DAY PROGRAM BY TEACHER"
      : mode === "section"
        ? "DAY PROGRAM BY SECTION"
        : "ROOM UTILIZATION";

  const selectedLabel = selectedKey || "—";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 text-xs text-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">
            Formatted Schedule Generation
          </h1>
          <p className="text-slate-400">
            Generate INS-style schedules by teacher, section, or room and export via the browser
            PDF dialog.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExportPdf}>
          Print / Export PDF
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-900/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Mode
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={mode === "teacher" ? "default" : "outline"}
              onClick={() => {
                setMode("teacher");
                setSelectedKey("");
              }}
            >
              By Teacher
            </Button>
            <Button
              size="sm"
              variant={mode === "section" ? "default" : "outline"}
              onClick={() => {
                setMode("section");
                setSelectedKey("");
              }}
            >
              By Section
            </Button>
            <Button
              size="sm"
              variant={mode === "room" ? "default" : "outline"}
              onClick={() => {
                setMode("room");
                setSelectedKey("");
              }}
            >
              By Room
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Select
          </span>
          <select
            className="h-8 min-w-[200px] rounded-md border border-slate-700 bg-slate-950/80 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            <option value="">— Choose —</option>
            {(mode === "teacher" ? teacherOptions : mode === "section" ? sectionOptions : roomOptions).map(
              (opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Printable form-style layout */}
      <div className="rounded-2xl border border-slate-800 bg-white p-6 text-[11px] text-black print:border-0">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold">
              CEBU TECHNOLOGICAL UNIVERSITY – ARGAO CAMPUS
            </p>
            <p className="text-[10px]">Academic Year 2025–2026</p>
            <p className="mt-2 text-[11px] font-bold underline">{titleLabel}</p>
          </div>
          <div className="text-right text-[10px]">
            <p>INS Form 5X</p>
            <p>February 15, 2021</p>
            <p>Revision 2</p>
          </div>
        </div>

        {/* Header meta row */}
        <div className="mb-3 grid grid-cols-2 gap-2 border border-black p-2 text-[10px]">
          <div>
            <p>
              <span className="font-semibold">
                {mode === "teacher"
                  ? "Name of Teacher:"
                  : mode === "section"
                    ? "Curriculum and Year:"
                    : "Room Assignment:"}
              </span>{" "}
              {selectedLabel}
            </p>
          </div>
          <div>
            <p>
              <span className="font-semibold">Total Units:</span>{" "}
              {filtered.length}
            </p>
          </div>
        </div>

        {/* Timetable grid */}
        <table className="mb-4 w-full border-collapse text-[9px]">
          <thead>
            <tr>
              <th className="border border-black px-1 py-1 text-center">TIME</th>
              {days.map((day) => (
                <th key={day} className="border border-black px-1 py-1 text-center">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot.start} className="h-10 align-top">
                <td className="border border-black px-1 py-1 text-center font-semibold">
                  {slot.label}
                </td>
                {days.map((day) => (
                  <td key={day} className="border border-black px-1 py-1 align-top">
                    {grid[slot.start]?.[day]?.map((text, idx) => (
                      <div key={idx} className="whitespace-pre-wrap leading-tight">
                        {text}
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary section */}
        <div className="mb-4 grid grid-cols-2 gap-2 text-[9px]">
          <div>
            <p className="mb-1 font-semibold">SUMMARY OF SUBJECTS</p>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-black px-1 py-1 text-center">Units</th>
                  <th className="border border-black px-1 py-1 text-center">Subject code</th>
                  <th className="border border-black px-1 py-1 text-center">Descriptive title</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="border border-black px-1 py-1 text-center">3</td>
                    <td className="border border-black px-1 py-1 text-center">{s.subjectCode}</td>
                    <td className="border border-black px-1 py-1">{s.subjectTitle}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="border border-black px-1 py-2 text-center"
                    >
                      No entries for the current selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <p className="mb-1 font-semibold">DETAILS</p>
            <p>Total Units: {filtered.length * 3}</p>
            <p>Preparations: {/* Placeholder; can be computed later */}—</p>
            <p>Hours/Week: {/* Placeholder; can be computed from time spans */}—</p>
          </div>
        </div>

        {/* Footer signatures */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-[9px]">
          <div className="text-center">
            <div className="h-10" />
            <p className="font-semibold">___________________________</p>
            <p>Prepared by</p>
            <p>Chairperson, BS Information Technology</p>
          </div>
          <div className="text-center">
            <div className="h-10" />
            <p className="font-semibold">___________________________</p>
            <p>Reviewed &amp; Certified True &amp; Correct</p>
            <p>Dean of Instruction</p>
          </div>
          <div className="text-center">
            <div className="h-10" />
            <p className="font-semibold">___________________________</p>
            <p>Approved</p>
            <p>Campus Director</p>
          </div>
        </div>
      </div>
    </div>
  );
}

