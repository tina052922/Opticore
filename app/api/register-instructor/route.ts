import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const CTU_DOMAIN = "@ctu.edu.ph";

function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

export async function POST(req: Request) {
  try {
    const { name, email, password, collegeId, programId } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing fields." }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail.endsWith(CTU_DOMAIN)) {
      return NextResponse.json(
        { message: "Only CTU campus emails (@ctu.edu.ph) are allowed." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(String(password), 10);

    await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        role: "INSTRUCTOR",
        passwordHash,
        mustChangePassword: true,
        registrationOtp: otp,
        registrationOtpExpires: new Date(Date.now() + 30 * 60 * 1000),
        collegeId: collegeId || undefined,
        programId: programId || undefined,
        facultyProfile: {
          create: {
            fullName: String(name).trim(),
            bsDegree: "Pending",
            status: "ACTIVE"
          }
        }
      }
    });

    return NextResponse.json(
      {
        ok: true,
        otp,
        message: "Registration successful. Enter the OTP shown below to activate your account."
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
