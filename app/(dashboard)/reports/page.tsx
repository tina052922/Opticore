import { prisma } from "@/lib/prisma";
import ReportsClient from "./reports-client";

async function getReportData() {
  const [workload, roomUsage, conflicts] = await Promise.all([
    prisma.schedule.groupBy({
      by: ["instructorId"],
      _count: { _all: true }
    }),
    prisma.schedule.groupBy({
      by: ["roomId"],
      _count: { _all: true }
    }),
    prisma.schedule.findMany({
      where: { status: "PENDING" },
      include: { subject: true, room: true, instructor: true, section: true }
    })
  ]);

  const instructors = await prisma.user.findMany({
    where: { id: { in: workload.map((w) => w.instructorId) } }
  });

  const rooms = await prisma.room.findMany({
    where: { id: { in: roomUsage.map((r) => r.roomId) } }
  });

  return { workload, instructors, roomUsage, rooms, conflicts };
}

export default async function ReportsPage() {
  const data = await getReportData();
  return <ReportsClient data={data} />;
}

