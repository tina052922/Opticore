import { prisma } from "@/lib/prisma";

export async function notifyUsers(
  userIds: string[],
  title: string,
  message: string
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({ userId, title, message }))
  });
}

export async function notifySectionStudents(
  sectionId: string,
  title: string,
  message: string
) {
  const students = await prisma.user.findMany({
    where: { sectionId, role: "STUDENT" },
    select: { id: true }
  });
  await notifyUsers(
    students.map((s) => s.id),
    title,
    message
  );
}

export async function notifyCollegeAdmins(
  collegeId: string,
  title: string,
  message: string
) {
  const admins = await prisma.user.findMany({
    where: { collegeId, role: "COLLEGE_ADMIN" },
    select: { id: true }
  });
  await notifyUsers(
    admins.map((a) => a.id),
    title,
    message
  );
}
