// Simple greedy scheduling algorithm for OptiCore.
// NOTE: This is intentionally simple; you can later plug in an advanced solver
// such as Google OR-Tools by replacing the core loop here.

import { DayOfWeek, ScheduleStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const TIMESLOTS = [
  { startTime: "07:00", endTime: "12:00" },
  { startTime: "12:00", endTime: "17:00" },
  { startTime: "17:00", endTime: "21:00" }
];

// Simple policy-based rules (can be extended later)
const MAX_DAILY_MINUTES_PER_INSTRUCTOR = 6 * 60; // e.g. 6 hours per day

function slotDurationMinutes(slot: { startTime: string; endTime: string }): number {
  const [sh, sm] = slot.startTime.split(":").map(Number);
  const [eh, em] = slot.endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

const DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY
];

type GenerateOptions = {
  semester: string;
  academicYear: string;
  collegeId?: string;
};

export async function greedyGenerateDraft(options: GenerateOptions) {
  const { semester, academicYear, collegeId } = options;

  const sectionWhere = collegeId
    ? { program: { collegeId } }
    : {};

  const [sections, subjects, rooms, faculty, existing] = await Promise.all([
    prisma.section.findMany({
      where: sectionWhere,
      include: { program: true }
    }),
    prisma.subject.findMany(),
    prisma.room.findMany(),
    prisma.user.findMany({
      where: { role: Role.INSTRUCTOR },
      include: {
        facultyProfile: {
          include: { canTeach: { include: { subject: true } } }
        }
      }
    }),
    prisma.schedule.findMany({
      where: { semester, academicYear }
    })
  ]);

  const usedSlots = new Set(
    existing.map(
      (s) =>
        `${s.day}-${s.startTime}-${s.endTime}-${s.roomId}-${s.sectionId}-${s.instructorId}`
    )
  );

  // Track per-instructor daily load (in minutes) to enforce policy rules
  const instructorDayMinutes = new Map<
    string,
    Map<DayOfWeek, number>
  >();

  const addMinutes = (instructorId: string, day: DayOfWeek, mins: number) => {
    let dayMap = instructorDayMinutes.get(instructorId);
    if (!dayMap) {
      dayMap = new Map<DayOfWeek, number>();
      instructorDayMinutes.set(instructorId, dayMap);
    }
    const current = dayMap.get(day) ?? 0;
    dayMap.set(day, current + mins);
  };

  // Seed with existing schedules so we don't exceed limits when adding new ones
  for (const s of existing) {
    const mins = slotDurationMinutes({ startTime: s.startTime, endTime: s.endTime });
    addMinutes(s.instructorId, s.day, mins);
  }

  const created: string[] = [];

  for (const section of sections) {
    const candidateSubjects = subjects.slice(0, 3); // simple: first 3 subjects

    for (const subject of candidateSubjects) {
      const instructor =
        faculty.find((f) =>
          f.facultyProfile?.canTeach?.some((ct) => ct.subject.code === subject.code)
        ) ?? faculty[0];
      if (!instructor) continue;

      for (const day of DAYS) {
        for (const slot of TIMESLOTS) {
          const room = rooms.find((r) => r.capacity >= section.studentCount);
          if (!room) continue;

          const key = `${day}-${slot.startTime}-${slot.endTime}-${room.id}-${section.id}-${instructor.id}`;
          if (usedSlots.has(key)) continue;

          // Policy rule: don't exceed daily teaching load per instructor
          const slotMins = slotDurationMinutes(slot);
          const dayMap = instructorDayMinutes.get(instructor.id) ?? new Map<DayOfWeek, number>();
          const currentMins = dayMap.get(day) ?? 0;
          if (currentMins + slotMins > MAX_DAILY_MINUTES_PER_INSTRUCTOR) {
            continue;
          }

          await prisma.schedule.create({
            data: {
              subjectId: subject.id,
              instructorId: instructor.id,
              sectionId: section.id,
              roomId: room.id,
              day,
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: ScheduleStatus.DRAFT,
              semester,
              academicYear
            }
          });
          usedSlots.add(key);
          addMinutes(instructor.id, day, slotMins);
          created.push(key);
          break;
        }
      }
    }
  }

  return { createdCount: created.length };
}

