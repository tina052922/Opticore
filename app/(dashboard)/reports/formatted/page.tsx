import { prisma } from "@/lib/prisma";
import FormattedReportsClient from "./formatted-client";

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

async function getFormattedSchedules(): Promise<FormattedSchedule[]> {
  const schedules = await prisma.schedule.findMany({
    include: {
      subject: true,
      room: true,
      instructor: true,
      section: {
        include: {
          program: true
        }
      }
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }]
  });

  return schedules.map((s) => ({
    id: s.id,
    day: s.day,
    startTime: s.startTime,
    endTime: s.endTime,
    subjectCode: s.subject?.code ?? "—",
    subjectTitle: s.subject?.title ?? "—",
    instructorName: s.instructor?.name ?? "—",
    roomCode: s.room?.code ?? "—",
    sectionName: s.section?.name ?? "—",
    programCode: s.section?.program?.code ?? "—"
  }));
}

export default async function FormattedReportsPage() {
  const schedules = await getFormattedSchedules();
  return <FormattedReportsClient schedules={schedules} />;
}

