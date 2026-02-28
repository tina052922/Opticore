import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;
    const userRole = user.role;
    const userProgramId = user.programId;

    // Get teaching assignments for the user's program
    const teachingAssignments = await prisma.teachingAssignment.findMany({
      where: {
        instructor: {
          programId: userRole === Role.CHAIRMAN_ADMIN ? userProgramId : undefined
        }
      },
      include: {
        instructor: {
          include: {
            facultyProfile: true
          }
        },
        subject: true,
        section: {
          include: {
            program: true
          }
        }
      }
    });

    // Group by instructor and calculate loads
    const instructorLoads = new Map();

    teachingAssignments.forEach(assignment => {
      const instructorId = assignment.instructorId;
      const instructorName = assignment.instructor.name;
      const facultyProfile = assignment.instructor.facultyProfile;
      
      if (!instructorLoads.has(instructorId)) {
        instructorLoads.set(instructorId, {
          instructorId,
          instructorName,
          rank: facultyProfile?.rank || "INSTRUCTOR_I",
          currentUnits: 0,
          standardLoad: facultyProfile?.standardLoad || 24,
          isOverload: false,
          hourlyRate: facultyProfile?.hourlyRate || 200,
          assignments: []
        });
      }

      const load = instructorLoads.get(instructorId);
      load.currentUnits += assignment.assignedUnits;
      load.assignments.push({
        subjectCode: assignment.subject.code,
        subjectTitle: assignment.subject.title,
        units: assignment.assignedUnits,
        section: `${assignment.section.program.code} ${assignment.section.name}`,
        category: assignment.subject.category
      });
    });

    // Calculate overload status
    const loads = Array.from(instructorLoads.values()).map(load => ({
      ...load,
      excessUnits: Math.max(0, load.currentUnits - load.standardLoad),
      isOverload: load.currentUnits > load.standardLoad
    }));

    return NextResponse.json(loads);
  } catch (error) {
    console.error("Error fetching teaching load:", error);
    return NextResponse.json({ error: "Failed to fetch teaching load data" }, { status: 500 });
  }
}
