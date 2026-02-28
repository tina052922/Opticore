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

    // Get rooms - for Chairman Admin, prioritize their program's rooms
    let rooms = await prisma.room.findMany({
      orderBy: [
        { building: 'asc' },
        { code: 'asc' }
      ]
    });

    // If Chairman Admin, prioritize their program's building rooms
    if (userRole === Role.CHAIRMAN_ADMIN && userProgramId) {
      const program = await prisma.program.findUnique({
        where: { id: userProgramId }
      });
      
      if (program) {
        // Simple prioritization: put BSIT rooms first for BSIT program, etc.
        rooms = rooms.sort((a, b) => {
          const aIsProgramRoom = a.building.includes(program.code.replace("-", ""));
          const bIsProgramRoom = b.building.includes(program.code.replace("-", ""));
          if (aIsProgramRoom && !bIsProgramRoom) return -1;
          if (!aIsProgramRoom && bIsProgramRoom) return 1;
          return 0;
        });
      }
    }

    const formattedRooms = rooms.map(room => ({
      id: room.id,
      code: room.code,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity,
      type: room.type
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}
