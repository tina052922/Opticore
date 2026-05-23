import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!newPassword || String(newPassword).length < 4) {
      return NextResponse.json(
        { message: "New password must be at least 4 characters." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (user.mustChangePassword) {
      if (!currentPassword) {
        return NextResponse.json({ message: "Current password required." }, { status: 400 });
      }
      const valid = await bcrypt.compare(String(currentPassword), user.passwordHash);
      if (!valid) {
        return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
      }
    } else if (currentPassword) {
      const valid = await bcrypt.compare(String(currentPassword), user.passwordHash);
      if (!valid) {
        return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false }
    });

    return NextResponse.json({ ok: true, message: "Password updated successfully." });
  } catch {
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
