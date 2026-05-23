import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ message: "Email and OTP required." }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const otpDigits = String(otp).replace(/\D/g, "");
    if (otpDigits.length !== 6) {
      return NextResponse.json({ message: "OTP must be 6 digits." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.role !== "INSTRUCTOR") {
      return NextResponse.json({ message: "Account not found." }, { status: 404 });
    }

    if (!user.registrationOtp) {
      return NextResponse.json({ message: "Account already verified. You may sign in." });
    }

    if (
      user.registrationOtpExpires &&
      user.registrationOtpExpires < new Date()
    ) {
      return NextResponse.json({ message: "OTP expired. Contact your college admin." }, { status: 400 });
    }

    if (user.registrationOtp !== otpDigits) {
      return NextResponse.json({ message: "Invalid OTP." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        registrationOtp: null,
        registrationOtpExpires: null
      }
    });

    return NextResponse.json({
      ok: true,
      mustChangePassword: user.mustChangePassword,
      message: "OTP verified. Sign in and set your permanent password."
    });
  } catch {
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
