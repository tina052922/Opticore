import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "Email required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return NextResponse.json(
        { message: "If an account exists with this email, a reset link will be sent." },
        { status: 200 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt }
    });

    // In production: send email with reset link. For demo: return URL for testing.
    const baseUrl = process.env.NEXTAUTH_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    return NextResponse.json({
      message: "If an account exists with this email, a reset link will be sent.",
      // Demo only: include link for testing when no email service configured
      resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined
    });
  } catch {
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
