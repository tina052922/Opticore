import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const overloadRequests = await prisma.overloadJustification.findMany({
      include: {
        instructor: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedRequests = overloadRequests.map(request => ({
      id: request.id,
      instructorId: request.instructorId,
      instructorName: request.instructor.name,
      totalUnits: request.totalUnits,
      standardLoad: request.standardLoad,
      excessUnits: request.excessUnits,
      justification: request.justification,
      status: request.status,
      requestedAt: request.createdAt,
      respondedAt: request.approvedAt,
      respondedBy: request.approvedBy
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching overload requests:", error);
    return NextResponse.json({ error: "Failed to fetch overload requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { instructorId, justification } = await request.json();

    if (!instructorId || !justification) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get current teaching load for the instructor
    const teachingAssignments = await prisma.teachingAssignment.findMany({
      where: { instructorId },
      include: {
        instructor: {
          include: {
            facultyProfile: true
          }
        }
      }
    });

    const totalUnits = teachingAssignments.reduce((sum, assignment) => sum + assignment.assignedUnits, 0);
    const standardLoad = teachingAssignments[0]?.instructor.facultyProfile?.standardLoad || 24;
    const excessUnits = Math.max(0, totalUnits - standardLoad);

    if (excessUnits <= 0) {
      return NextResponse.json({ error: "No overload detected" }, { status: 400 });
    }

    const overloadRequest = await prisma.overloadJustification.create({
      data: {
        instructorId,
        semester: "1st", // Current semester
        academicYear: "2025-2026", // Current academic year
        totalUnits,
        standardLoad,
        excessUnits,
        justification,
        status: "PENDING",
        requestedBy: (session.user as any).id ?? session.user.email ?? "unknown"
      }
    });

    return NextResponse.json(overloadRequest);
  } catch (error) {
    console.error("Error creating overload request:", error);
    return NextResponse.json({ error: "Failed to create overload request" }, { status: 500 });
  }
}
