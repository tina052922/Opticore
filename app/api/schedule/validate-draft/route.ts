import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";
import { DayOfWeek } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entries } = await request.json();

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: "Invalid entries data" }, { status: 400 });
    }

    const conflicts = [];

    // Check each entry for conflicts
    for (const entry of entries) {
      const { instructorId, roomId, day, startTime, endTime } = entry;

      // Check instructor conflicts
      const instructorConflicts = await prisma.schedule.findMany({
        where: {
          instructorId,
          day: day as DayOfWeek,
          OR: [
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gt: startTime } }
              ]
            }
          ]
        },
        include: {
          subject: true,
          room: true
        }
      });

      // Check room conflicts
      const roomConflicts = await prisma.schedule.findMany({
        where: {
          roomId,
          day: day as DayOfWeek,
          OR: [
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gt: startTime } }
              ]
            }
          ]
        },
        include: {
          subject: true,
          instructor: true
        }
      });

      if (instructorConflicts.length > 0 || roomConflicts.length > 0) {
        conflicts.push({
          entry,
          instructorConflicts: instructorConflicts.map(c => ({
            subjectCode: c.subject.code,
            subjectTitle: c.subject.title,
            startTime: c.startTime,
            endTime: c.endTime,
            room: c.room.code
          })),
          roomConflicts: roomConflicts.map(c => ({
            subjectCode: c.subject.code,
            subjectTitle: c.subject.title,
            startTime: c.startTime,
            endTime: c.endTime,
            instructor: c.instructor.name
          }))
        });
      }
    }

    if (conflicts.length > 0) {
      return NextResponse.json({ 
        error: "Schedule conflicts detected", 
        conflicts 
      }, { status: 409 });
    }

    return NextResponse.json({ message: "No conflicts found" });
  } catch (error) {
    console.error("Error validating draft:", error);
    return NextResponse.json({ error: "Failed to validate draft" }, { status: 500 });
  }
}
