// Simple greedy scheduling algorithm for OptiCore.
// NOTE: This is intentionally simple; you can later plug in an advanced solver
// such as Google OR-Tools by replacing the core loop here.

import { DayOfWeek, ScheduleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const TIMESLOTS = [
  { startTime: "07:00", endTime: "12:00" },
  { startTime: "12:00", endTime: "17:00" },
  { startTime: "17:00", endTime: "21:00" }
];

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
};

export async function greedyGenerateDraft(options: GenerateOptions) {
  const { semester, academicYear } = options;

  const [sections, subjects, rooms, faculty, existing] = await Promise.all([
    prisma.section.findMany(),
    prisma.subject.findMany(),
    prisma.room.findMany(),
    prisma.user.findMany({
      where: { role: "FACULTY" },
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
          created.push(key);
          break;
        }
      }
    }
  }

  return { createdCount: created.length };
}

