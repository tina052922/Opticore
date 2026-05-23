import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";
import { DayOfWeek } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { findScheduleConflicts, type ScheduleSlot } from "@/lib/scheduling/conflicts";

const ADMIN_ROLES = new Set(["DOI", "COLLEGE_ADMIN", "CHAIRMAN_ADMIN"]);

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (!role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { entryId, day, startTime, endTime, roomId } = await request.json();
    if (!entryId) {
      return NextResponse.json({ error: "entryId required" }, { status: 400 });
    }

    const isDraft = String(entryId).startsWith("draft-");
    const realId = isDraft ? String(entryId).replace(/^draft-/, "") : entryId;

    const data: {
      day?: DayOfWeek;
      startTime?: string;
      endTime?: string;
      roomId?: string;
    } = {};
    if (day) data.day = day as DayOfWeek;
    if (startTime) data.startTime = startTime;
    if (endTime) data.endTime = endTime;
    if (roomId) data.roomId = roomId;

    if (isDraft) {
      const updated = await prisma.scheduleEntry.update({
        where: { id: realId },
        data,
        include: {
          subject: true,
          instructor: true,
          section: true,
          room: true
        }
      });

      const all = await prisma.scheduleEntry.findMany({
        where: { draftId: updated.draftId },
        include: { subject: true, instructor: true, section: true, room: true }
      });

      const slots: ScheduleSlot[] = all.map((e) => ({
        id: `draft-${e.id}`,
        day: e.day,
        startTime: e.startTime,
        endTime: e.endTime,
        roomId: e.roomId,
        instructorId: e.instructorId,
        sectionId: e.sectionId,
        subjectCode: e.subject.code,
        roomCode: e.room.code
      }));

      const remaining = findScheduleConflicts(slots);
      return NextResponse.json({ ok: true, remainingConflicts: remaining.length });
    }

    const updated = await prisma.schedule.update({
      where: { id: realId },
      data,
      include: {
        subject: true,
        instructor: true,
        section: true,
        room: true
      }
    });

    const collegeId = (
      await prisma.section.findUnique({
        where: { id: updated.sectionId },
        include: { program: true }
      })
    )?.program.collegeId;

    const schedules = await prisma.schedule.findMany({
      where: collegeId ? { section: { program: { collegeId } } } : {},
      include: { subject: true, instructor: true, section: true, room: true }
    });

    const slots: ScheduleSlot[] = schedules.map((s) => ({
      id: s.id,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      roomId: s.roomId,
      instructorId: s.instructorId,
      sectionId: s.sectionId,
      subjectCode: s.subject.code,
      roomCode: s.room.code
    }));

    const remaining = findScheduleConflicts(slots);
    revalidatePath("/dashboard/schedules");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/repository");

    return NextResponse.json({ ok: true, remainingConflicts: remaining.length });
  } catch (error) {
    console.error("Manual edit:", error);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}
