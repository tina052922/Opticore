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

    // Get subjects for the user's program
    const subjects = await prisma.subject.findMany({
      orderBy: [
        { code: 'asc' }
      ]
    });

    const formattedSubjects = subjects.map(subject => ({
      id: subject.id,
      code: subject.code,
      title: subject.title,
      units: subject.units,
      lecHours: subject.lecHours,
      labHours: subject.labHours,
      totalHours: subject.lecHours + subject.labHours,
      type: subject.type,
      category: (subject as any).category || "DEPARTMENTAL",
      yearLevel: (subject as any).yearLevel || null,
      semester: (subject as any).semester || null,
      prerequisite: subject.prerequisite,
      curriculum: (subject as any).curriculum || null
    }));

    return NextResponse.json(formattedSubjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}
