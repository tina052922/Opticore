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
    const userRole = user.role;
    const userProgramId = user.programId;

    // Get instructors for the user's program
    const instructors = await prisma.user.findMany({
      where: {
        role: Role.INSTRUCTOR,
        ...(userRole === Role.CHAIRMAN_ADMIN && {
          programId: userProgramId
        })
      },
      include: {
        facultyProfile: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedInstructors = instructors.map(instructor => ({
      id: instructor.id,
      name: instructor.name,
      rank: (instructor.facultyProfile as any)?.rank || "INSTRUCTOR_I",
      status: (instructor.facultyProfile as any)?.status || "ACTIVE",
      hourlyRate: (instructor.facultyProfile as any)?.hourlyRate || 200,
      standardLoad: (instructor.facultyProfile as any)?.standardLoad || 24,
      experience: (instructor.facultyProfile as any)?.experience || 0,
      eligibility: (instructor.facultyProfile as any)?.eligibility || null
    }));

    return NextResponse.json(formattedInstructors);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return NextResponse.json({ error: "Failed to fetch instructors" }, { status: 500 });
  }
}
