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

    // Get sections for the user's program
    const sections = await prisma.section.findMany({
      where: {
        ...(userRole === Role.CHAIRMAN_ADMIN && {
          programId: userProgramId
        })
      },
      include: {
        program: true
      },
      orderBy: [
        { yearLevel: 'asc' },
        { name: 'asc' }
      ]
    });

    const formattedSections = sections.map(section => ({
      id: section.id,
      name: section.name,
      yearLevel: section.yearLevel,
      studentCount: section.studentCount,
      program: {
        id: section.program.id,
        code: section.program.code,
        name: section.program.name
      }
    }));

    return NextResponse.json(formattedSections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}
