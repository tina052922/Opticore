import { DayOfWeek } from "@prisma/client";

export type ScheduleSlot = {
  id: string;
  day: DayOfWeek | string;
  startTime: string;
  endTime: string;
  roomId: string;
  instructorId: string;
  sectionId: string;
  subjectCode?: string;
  roomCode?: string;
  instructorName?: string;
  sectionName?: string;
};

export function parseTimeToMinutes(time: string): number {
  const normalized = time.trim().replace(/\s/g, "");
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return NaN;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return NaN;
  return h * 60 + m;
}

export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = parseTimeToMinutes(startA);
  const aEnd = parseTimeToMinutes(endA);
  const bStart = parseTimeToMinutes(startB);
  const bEnd = parseTimeToMinutes(endB);
  if ([aStart, aEnd, bStart, bEnd].some(Number.isNaN)) return false;
  return aStart < bEnd && bStart < aEnd;
}

export type ConflictRecord = {
  type: "INSTRUCTOR" | "ROOM" | "SECTION";
  entryAId: string;
  entryBId: string;
  day: string;
  description: string;
  details: {
    subjectCode?: string;
    otherSubjectCode?: string;
    startTime: string;
    endTime: string;
    otherStartTime: string;
    otherEndTime: string;
    roomCode?: string;
    instructorName?: string;
  };
};

export function findScheduleConflicts(
  entries: ScheduleSlot[],
  excludeId?: string
): ConflictRecord[] {
  const conflicts: ConflictRecord[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (excludeId && (a.id === excludeId || b.id === excludeId)) continue;
      if (a.day !== b.day) continue;
      if (!timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

      const types: ConflictRecord["type"][] = [];
      if (a.instructorId === b.instructorId) types.push("INSTRUCTOR");
      if (a.roomId === b.roomId) types.push("ROOM");
      if (a.sectionId === b.sectionId) types.push("SECTION");

      for (const type of types) {
        const key = [type, a.id, b.id].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        conflicts.push({
          type,
          entryAId: a.id,
          entryBId: b.id,
          day: String(a.day),
          description:
            type === "INSTRUCTOR"
              ? `Instructor double-booked: ${a.subjectCode ?? "class"} overlaps ${b.subjectCode ?? "class"}`
              : type === "ROOM"
              ? `Room double-booked: ${a.roomCode ?? "room"} — ${a.subjectCode ?? "class"} vs ${b.subjectCode ?? "class"}`
              : `Section overlap: ${a.sectionName ?? "section"}`,
          details: {
            subjectCode: a.subjectCode,
            otherSubjectCode: b.subjectCode,
            startTime: a.startTime,
            endTime: a.endTime,
            otherStartTime: b.startTime,
            otherEndTime: b.endTime,
            roomCode: a.roomCode,
            instructorName: a.instructorName
          }
        });
      }
    }
  }

  return conflicts;
}

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
];

const TIME_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00"
];

export type ConflictSolution = {
  day?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  roomId?: string;
  label: string;
};

export function suggestAlternatives(
  entry: ScheduleSlot,
  allEntries: ScheduleSlot[],
  rooms: { id: string; code: string }[]
): ConflictSolution[] {
  const solutions: ConflictSolution[] = [];
  const duration =
    parseTimeToMinutes(entry.endTime) - parseTimeToMinutes(entry.startTime);
  if (duration <= 0 || Number.isNaN(duration)) return solutions;

  const others = allEntries.filter((e) => e.id !== entry.id);

  for (const day of DAYS) {
    for (const start of TIME_SLOTS) {
      const startMins = parseTimeToMinutes(start);
      const endMins = startMins + duration;
      if (endMins > 18 * 60) continue;
      const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
      const candidate: ScheduleSlot = { ...entry, day, startTime: start, endTime };
      const temp = others.concat(candidate);
      if (findScheduleConflicts(temp, entry.id).length === 0) {
        solutions.push({
          day,
          startTime: start,
          endTime,
          label: `Move to ${day} ${start}–${endTime}`
        });
        if (solutions.length >= 4) return solutions;
      }
    }
  }

  for (const room of rooms) {
    if (room.id === entry.roomId) continue;
    const candidate: ScheduleSlot = { ...entry, roomId: room.id, roomCode: room.code };
    const temp = others.concat(candidate);
    if (findScheduleConflicts(temp, entry.id).length === 0) {
      solutions.push({
        roomId: room.id,
        label: `Use room ${room.code} (same day/time)`
      });
      if (solutions.length >= 6) return solutions;
    }
  }

  return solutions.slice(0, 6);
}
