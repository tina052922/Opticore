import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      include: { college: true },
      orderBy: { code: "asc" }
    });
    return NextResponse.json({
      programs: programs.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        college: p.college.code
      }))
    });
  } catch {
    return NextResponse.json({ programs: [] });
  }
}
