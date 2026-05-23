import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";
import {
  findScheduleConflicts,
  suggestAlternatives,
  type ScheduleSlot
} from "@/lib/scheduling/conflicts";

const ADMIN_ROLES = new Set(["DOI", "COLLEGE_ADMIN", "CHAIRMAN_ADMIN"]);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (!role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const collegeId = (session.user as { collegeId?: string }).collegeId;
    const programId = (session.user as { programId?: string }).programId;
    const scope = request.nextUrl.searchParams.get("scope") ?? "campus";

    let scheduleWhere: Record<string, unknown> = {};
    let entryWhere: Record<string, unknown> = {};

    if (role === "DOI" && scope === "campus") {
      // all schedules
    } else if (role === "COLLEGE_ADMIN" && collegeId) {
      scheduleWhere = { section: { program: { collegeId } } };
      entryWhere = { draft: { collegeId } };
    } else if (role === "CHAIRMAN_ADMIN" && programId) {
      scheduleWhere = { section: { programId } };
      entryWhere = { section: { programId } };
    } else if (collegeId) {
      scheduleWhere = { section: { program: { collegeId } } };
      entryWhere = { draft: { collegeId } };
    }

    const [schedules, draftEntries] = await Promise.all([
      prisma.schedule.findMany({
        where: scheduleWhere,
        include: {
          subject: true,
          instructor: true,
          section: { include: { program: true } },
          room: true
        }
      }),
      prisma.scheduleEntry.findMany({
        where: entryWhere,
        include: {
          subject: true,
          instructor: true,
          section: { include: { program: true } },
          room: true
        }
      })
    ]);

    const publishedSlots: ScheduleSlot[] = schedules.map((s) => ({
      id: s.id,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      roomId: s.roomId,
      instructorId: s.instructorId,
      sectionId: s.sectionId,
      subjectCode: s.subject.code,
      roomCode: s.room.code,
      instructorName: s.instructor.name,
      sectionName: s.section.name
    }));

    const draftSlots: ScheduleSlot[] = draftEntries.map((e) => ({
      id: `draft-${e.id}`,
      day: e.day,
      startTime: e.startTime,
      endTime: e.endTime,
      roomId: e.roomId,
      instructorId: e.instructorId,
      sectionId: e.sectionId,
      subjectCode: e.subject.code,
      roomCode: e.room.code,
      instructorName: e.instructor.name,
      sectionName: e.section.name
    }));

    const allSlots = [...publishedSlots, ...draftSlots];
    const conflicts = findScheduleConflicts(allSlots);
    const rooms = await prisma.room.findMany({ orderBy: { code: "asc" } });

    const conflictsWithSolutions = conflicts.map((c) => {
      const entry = allSlots.find((s) => s.id === c.entryAId);
      return {
        ...c,
        solutions: entry ? suggestAlternatives(entry, allSlots, rooms) : []
      };
    });

    return NextResponse.json({
      conflictCount: conflicts.length,
      conflicts: conflictsWithSolutions,
      scope: role === "DOI" ? "campus" : role === "CHAIRMAN_ADMIN" ? "program" : "college"
    });
  } catch (error) {
    console.error("Campus conflict check:", error);
    return NextResponse.json({ error: "Failed to check conflicts" }, { status: 500 });
  }
}
