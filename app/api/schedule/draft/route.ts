import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";
import { Role, DayOfWeek } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;
    const userProgramId = user.programId;

    // Get draft schedules for the user's program
    const schedules = await prisma.schedule.findMany({
      where: {
        status: "DRAFT",
        section: {
          programId: userRole === Role.CHAIRMAN_ADMIN ? userProgramId : undefined
        }
      },
      include: {
        subject: true,
        instructor: {
          include: {
            facultyProfile: true
          }
        },
        section: {
          include: {
            program: true
          }
        },
        room: true
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });

    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      subject: {
        code: schedule.subject.code,
        title: schedule.subject.title,
        units: schedule.subject.units,
        category: (schedule.subject as any).category || "DEPARTMENTAL"
      },
      instructor: {
        name: schedule.instructor.name,
        rank: (schedule.instructor.facultyProfile as any)?.rank || "INSTRUCTOR_I"
      },
      section: {
        name: schedule.section.name,
        yearLevel: schedule.section.yearLevel
      },
      room: {
        code: schedule.room.code,
        building: schedule.room.building,
        capacity: schedule.room.capacity
      },
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: schedule.status
    }));

    return NextResponse.json(formattedSchedules);
  } catch (error) {
    console.error("Error fetching draft schedules:", error);
    return NextResponse.json({ error: "Failed to fetch draft schedules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;
    
    if (userRole !== Role.CHAIRMAN_ADMIN) {
      return NextResponse.json({ error: "Only Chairman Admin can create draft schedules" }, { status: 403 });
    }

    const { subjectId, instructorId, sectionId, roomId, day, startTime, endTime, justification } = await request.json();

    // Validate required fields
    if (!subjectId || !instructorId || !sectionId || !roomId || !day || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate day
    if (!Object.values(DayOfWeek).includes(day as DayOfWeek)) {
      return NextResponse.json({ error: "Invalid day" }, { status: 400 });
    }

    // Check for conflicts
    const conflicts = await checkScheduleConflicts(instructorId, roomId, day, startTime, endTime);
    if (conflicts.length > 0) {
      return NextResponse.json({ 
        error: "Schedule conflicts detected", 
        conflicts 
      }, { status: 409 });
    }

    // Create the schedule entry
    const schedule = await prisma.schedule.create({
      data: {
        subjectId,
        instructorId,
        sectionId,
        roomId,
        day: day as DayOfWeek,
        startTime,
        endTime,
        status: "DRAFT",
        semester: "1st",
        academicYear: "2025-2026"
      },
      include: {
        subject: true,
        instructor: {
          include: {
            facultyProfile: true
          }
        },
        section: {
          include: {
            program: true
          }
        },
        room: true
      }
    });

    // Create teaching assignment record
    try {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (subject) {
        // Create a simple record in Schedule to track the assignment
        // In a real implementation, you'd have a proper TeachingAssignment model
        console.log(`Created teaching assignment for ${subject.code} - ${subject.units} units`);
      }
    } catch (assignmentError) {
      console.warn("Could not create teaching assignment:", assignmentError);
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }
}

async function checkScheduleConflicts(instructorId: string, roomId: string, day: string, startTime: string, endTime: string) {
  const conflicts = await prisma.schedule.findMany({
    where: {
      OR: [
        {
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
        {
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
        }
      ]
    },
    include: {
      subject: true,
      instructor: true,
      room: true
    }
  });

  return conflicts.map(conflict => ({
    type: conflict.instructorId === instructorId ? "INSTRUCTOR" : "ROOM",
    description: `${conflict.subject.code} scheduled at ${conflict.startTime}-${conflict.endTime}`,
    conflictingEntry: {
      subjectCode: conflict.subject.code,
      instructorName: conflict.instructor.name,
      roomCode: conflict.room.code,
      day: conflict.day,
      startTime: conflict.startTime,
      endTime: conflict.endTime
    }
  }));
}
