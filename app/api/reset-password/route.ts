import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and new password required." },
        { status: 400 }
      );
    }
    if (password.length < 4) {
      return NextResponse.json(
        { message: "Password must be at least 4 characters." },
        { status: 400 }
      );
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json(
        { message: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.delete({ where: { id: record.id } })
    ]);

    return NextResponse.json({ message: "Password updated. You can sign in." });
  } catch {
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
