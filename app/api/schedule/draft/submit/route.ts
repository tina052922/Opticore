import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;
    
    if (userRole !== Role.CHAIRMAN_ADMIN) {
      return NextResponse.json({ error: "Only Chairman Admin can submit drafts" }, { status: 403 });
    }

    // Get all draft schedules for the user's program
    const draftSchedules = await prisma.schedule.findMany({
      where: {
        status: "DRAFT",
        section: {
          programId: user.programId
        }
      }
    });

    if (draftSchedules.length === 0) {
      return NextResponse.json({ error: "No draft schedules to submit" }, { status: 400 });
    }

    // Update all draft schedules to PENDING status (ready for College Admin review)
    await prisma.schedule.updateMany({
      where: {
        id: {
          in: draftSchedules.map(s => s.id)
        }
      },
      data: {
        status: "PENDING"
      }
    });

    // Create a workflow record (simplified - in real implementation you'd have proper workflow tables)
    console.log(`Submitted ${draftSchedules.length} schedule entries for review`);

    return NextResponse.json({ 
      message: "Schedule draft submitted successfully",
      submittedCount: draftSchedules.length
    });
  } catch (error) {
    console.error("Error submitting draft:", error);
    return NextResponse.json({ error: "Failed to submit draft" }, { status: 500 });
  }
}
