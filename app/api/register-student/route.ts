import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const CTU_DOMAIN = "@ctu.edu.ph";

export async function POST(req: Request) {
  try {
    const { name, email, password, studentId, programId } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing fields." }, { status: 400 });
    }

    if (!email.toLowerCase().endsWith(CTU_DOMAIN)) {
      return NextResponse.json(
        { message: "Only CTU campus emails (@ctu.edu.ph) are allowed for student registration." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        role: "STUDENT",
        passwordHash,
        programId: programId || undefined
      }
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

