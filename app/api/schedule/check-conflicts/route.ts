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

    const { instructorId, roomId, day, startTime, endTime } = await request.json();

    if (!instructorId || !roomId || !day || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate day
    if (!Object.values(DayOfWeek).includes(day as DayOfWeek)) {
      return NextResponse.json({ error: "Invalid day" }, { status: 400 });
    }

    // Check for instructor conflicts
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

    // Check for room conflicts
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

    const conflicts = [
      ...instructorConflicts.map(conflict => ({
        type: "INSTRUCTOR",
        description: `Instructor conflict: ${conflict.subject.code} scheduled at ${conflict.startTime}-${conflict.endTime}`,
        details: {
          subjectCode: conflict.subject.code,
          subjectTitle: conflict.subject.title,
          day: conflict.day,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          room: conflict.room.code
        }
      })),
      ...roomConflicts.map(conflict => ({
        type: "ROOM",
        description: `Room conflict: ${conflict.subject.code} scheduled at ${conflict.startTime}-${conflict.endTime}`,
        details: {
          subjectCode: conflict.subject.code,
          subjectTitle: conflict.subject.title,
          day: conflict.day,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          instructor: conflict.instructor.name
        }
      }))
    ];

    return NextResponse.json(conflicts);
  } catch (error) {
    console.error("Error checking conflicts:", error);
    return NextResponse.json({ error: "Failed to check conflicts" }, { status: 500 });
  }
}
