import { DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Keep draft entries in sync when published schedule changes. */
export async function syncScheduleToDraftEntries(
  scheduleId: string,
  data: {
    startTime?: string;
    endTime?: string;
    day?: DayOfWeek;
    roomId?: string;
  }
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      section: { include: { program: true } }
    }
  });
  if (!schedule) return;

  const draft = await prisma.scheduleDraft.findFirst({
    where: {
      collegeId: schedule.section.program.collegeId,
      status: { in: ["DRAFT", "CAS_REVIEW", "DOI_REVIEW", "RETURNED", "APPROVED"] }
    },
    orderBy: { updatedAt: "desc" }
  });
  if (!draft) return;

  await prisma.scheduleEntry.updateMany({
    where: {
      draftId: draft.id,
      subjectId: schedule.subjectId,
      sectionId: schedule.sectionId,
      instructorId: schedule.instructorId,
      day: schedule.day,
      startTime: schedule.startTime
    },
    data
  });
}
