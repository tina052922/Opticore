import { prisma } from "@/lib/prisma";
import ReportsClient from "./reports-client";
import ComprehensiveReports from "./comprehensive-reports";
import { Prisma } from "@prisma/client";

async function getReportData(): Promise<{
  workload: { instructorId: string; _count: { _all: number } }[];
  instructors: { id: string; name: string | null }[];
  roomUsage: { roomId: string; _count: { _all: number } }[];
  rooms: { id: string; code: string }[];
  conflicts: any[];
  roomByProgram: { programCode: string; programName: string; roomCount: number; scheduleCount: number }[];
  scheduleByTeacher: { instructorName: string; day: string; startTime: string; endTime: string; subjectCode: string; sectionName: string; roomCode: string }[];
  scheduleBySection: { sectionName: string; programCode: string; day: string; startTime: string; endTime: string; subjectCode: string; roomCode: string; instructorName: string }[];
  dbError?: boolean;
}> {
  try {
    const [workload, roomUsage, conflicts, allSchedules] = await Promise.all([
      prisma.schedule.groupBy({
        by: ["instructorId"],
        _count: { _all: true }
      }),
      prisma.schedule.groupBy({
        by: ["roomId"],
        _count: { _all: true }
      }),
      prisma.schedule.findMany({
        where: { status: "PENDING" },
        include: { subject: true, room: true, instructor: true, section: true }
      }),
      prisma.schedule.findMany({
        include: {
          subject: true,
          room: true,
          instructor: true,
          section: { include: { program: true } }
        },
        orderBy: [{ day: "asc" }, { startTime: "asc" }]
      })
    ]);

    const instructors = await prisma.user.findMany({
      where: { id: { in: workload.map((w) => w.instructorId) } },
      select: { id: true, name: true }
    });

    const rooms = await prisma.room.findMany({
      where: { id: { in: roomUsage.map((r) => r.roomId) } },
      select: { id: true, code: true }
    });

    // Room utilization by program: group schedules by section's program
    const programRoomMap = new Map<string, { roomIds: Set<string>; count: number }>();
    for (const s of allSchedules) {
      const programCode = s.section?.program?.code ?? "Unknown";
      const programName = s.section?.program?.name ?? "Unknown";
      const key = programCode;
      if (!programRoomMap.has(key)) {
        programRoomMap.set(key, { roomIds: new Set(), count: 0 });
      }
      const entry = programRoomMap.get(key)!;
      entry.roomIds.add(s.roomId);
      entry.count += 1;
    }
    const programs = await prisma.program.findMany({ select: { code: true, name: true } });
    const programNames = new Map(programs.map((p) => [p.code, p.name]));
    const roomByProgram = Array.from(programRoomMap.entries()).map(([code, v]) => ({
      programCode: code,
      programName: programNames.get(code) ?? code,
      roomCount: v.roomIds.size,
      scheduleCount: v.count
    }));

    const scheduleByTeacher = allSchedules.map((s) => ({
      instructorName: s.instructor?.name ?? "—",
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      subjectCode: s.subject?.code ?? "—",
      sectionName: s.section ? `${s.section.program?.code ?? ""} ${s.section.name}` : "—",
      roomCode: s.room?.code ?? "—"
    }));

    const scheduleBySection = allSchedules.map((s) => ({
      sectionName: s.section?.name ?? "—",
      programCode: s.section?.program?.code ?? "—",
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      subjectCode: s.subject?.code ?? "—",
      roomCode: s.room?.code ?? "—",
      instructorName: s.instructor?.name ?? "—"
    }));

    return {
      workload,
      instructors,
      roomUsage,
      rooms,
      conflicts,
      roomByProgram,
      scheduleByTeacher,
      scheduleBySection
    };
  } catch (err) {
    const isPrismaInit =
      err instanceof Prisma.PrismaClientInitializationError ||
      (err && typeof (err as Error).message === "string" && (err as Error).message.includes("DATABASE_URL"));
    if (isPrismaInit && typeof console !== "undefined" && console.warn) {
      console.warn("[reports] Database not configured. Set DATABASE_URL in .env.");
    }
    return {
      workload: [],
      instructors: [],
      roomUsage: [],
      rooms: [],
      conflicts: [],
      roomByProgram: [],
      scheduleByTeacher: [],
      scheduleBySection: [],
      dbError: true
    };
  }
}

export default async function ReportsPage() {
  // For now, use the comprehensive reports component
  // The legacy ReportsClient can be accessed via a toggle if needed
  return <ComprehensiveReports />;
}

