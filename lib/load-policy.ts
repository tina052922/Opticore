import { prisma } from "@/lib/prisma";

// Simple teaching load policy based on CTU manual excerpt.
// This can be extended later with full rank / designation-specific rules.

export type InstructorLoadSummary = {
  instructorId: string;
  totalMinutes: number;
  totalHours: number;
  overload: boolean;
};

// For now, treat 24 teaching hours/week as the standard load threshold.
const STANDARD_LOAD_MINUTES = 24 * 60;

export async function computeInstructorLoadsForCollegeDraft(
  collegeId: string,
  academicPeriodId: string
): Promise<InstructorLoadSummary[]> {
  const schedules = await prisma.schedule.findMany({
    where: {
      section: {
        program: {
          collegeId
        }
      }
    },
    select: {
      instructorId: true,
      startTime: true,
      endTime: true
    }
  });

  const minutesByInstructor = new Map<string, number>();

  for (const s of schedules) {
    if (!s.instructorId) continue;
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    const duration = eh * 60 + em - (sh * 60 + sm);
    const prev = minutesByInstructor.get(s.instructorId) ?? 0;
    minutesByInstructor.set(s.instructorId, prev + Math.max(0, duration));
  }

  const summaries: InstructorLoadSummary[] = [];
  for (const [instructorId, totalMinutes] of minutesByInstructor.entries()) {
    const totalHours = totalMinutes / 60;
    const overload = totalMinutes > STANDARD_LOAD_MINUTES;
    summaries.push({ instructorId, totalMinutes, totalHours, overload });
  }

  return summaries;
}

