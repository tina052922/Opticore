import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";
import { DayOfWeek } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

const ADMIN_ROLES = new Set(["DOI", "COLLEGE_ADMIN"]);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (!role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = (session.user as { id?: string }).id;
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
    if (day && Object.values(DayOfWeek).includes(day as DayOfWeek)) {
      data.day = day as DayOfWeek;
    }
    if (startTime) data.startTime = startTime;
    if (endTime) data.endTime = endTime;
    if (roomId) data.roomId = roomId;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No changes specified" }, { status: 400 });
    }

    if (isDraft) {
      await prisma.scheduleEntry.update({
        where: { id: realId },
        data
      });
    } else {
      await prisma.schedule.update({
        where: { id: realId },
        data
      });
    }

    if (userId) {
      await logAudit(
        userId,
        isDraft ? "ScheduleEntry" : "Schedule",
        realId,
        "CONFLICT_RESOLVED",
        JSON.stringify(data)
      );
    }

    revalidatePath("/dashboard/schedules");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/repository");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Apply solution:", error);
    return NextResponse.json({ error: "Failed to apply solution" }, { status: 500 });
  }
}
