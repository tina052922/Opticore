import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ScheduleGridView } from "@/components/schedule-grid-view";
import { ConflictEvaluator } from "@/components/conflict-evaluator";
import Link from "next/link";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
const TIME_SLOTS = [
  "7:00-8:00",
  "8:00-9:00",
  "9:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-1:00",
  "1:00-2:00",
  "2:00-3:00",
  "3:00-4:00",
  "4:00-5:00"
];

function slotMatches(schedule: { startTime: string }, slot: string) {
  const [slotStart] = slot.split("-").map((s) => s.trim());
  const norm = (t: string) => t.replace(/^0/, "").replace(/:00$/, "") || "0";
  return norm(schedule.startTime) === norm(slotStart);
}

async function getData(
  userId: string | undefined,
  role: string | undefined,
  collegeId: string | undefined,
  programId: string | undefined,
  roomId: string | null,
  viewCollegeId: string | null
) {
  let where: Record<string, unknown> = {};

  if (roomId) {
    where.roomId = roomId;
  }

  if (role === "DOI") {
    if (viewCollegeId) {
      where.section = { program: { collegeId: viewCollegeId } };
    }
  } else if (role === "COLLEGE_ADMIN") {
    const effectiveCollegeId = viewCollegeId ?? collegeId;
    if (effectiveCollegeId) {
      where.section = { program: { collegeId: effectiveCollegeId } };
    }
  } else if (role === "CHAIRMAN_ADMIN" && programId) {
    where.section = { programId };
  } else if (role === "INSTRUCTOR" && userId) {
    where.instructorId = userId;
  } else {
    where.id = "__none__";
  }

  const schedules = await prisma.schedule.findMany({
    where,
    include: {
      subject: true,
      instructor: true,
      section: { include: { program: { include: { college: true } } } },
      room: true
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }]
  });

  const rooms = await prisma.room.findMany({
    orderBy: { code: "asc" }
  });

  const colleges = await prisma.college.findMany({
    orderBy: { code: "asc" }
  });

  return { schedules, rooms, colleges };
}

function buildGrid(
  schedules: Awaited<ReturnType<typeof getData>>["schedules"]
) {
  const grid: Record<string, Record<string, (typeof schedules)[0][]>> = {};
  for (const slot of TIME_SLOTS) {
    grid[slot] = {};
    for (const day of DAYS) {
      grid[slot][day] = schedules.filter(
        (s) => s.day === day && slotMatches(s, slot)
      );
    }
  }
  return grid;
}

export default async function SchedulesPage({
  searchParams
}: {
  searchParams: Promise<{ room?: string; college?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string | undefined;
  const allowed = ["DOI", "COLLEGE_ADMIN", "CHAIRMAN_ADMIN", "INSTRUCTOR"];
  if (!role || !allowed.includes(role)) redirect("/dashboard");
  const collegeId = (session.user as any).collegeId as string | undefined;
  const programId = (session.user as any).programId as string | undefined;
  const userId = (session.user as any).id as string | undefined;

  const params = await searchParams;
  const roomId = params.room && params.room !== "all" ? params.room : null;
  const viewCollegeId = params.college && params.college !== "all" ? params.college : null;

  const { schedules, rooms, colleges } = await getData(
    userId,
    role,
    collegeId,
    programId,
    roomId,
    viewCollegeId
  );

  const grid = buildGrid(schedules);
  const canViewOtherColleges = role === "DOI" || role === "COLLEGE_ADMIN";
  const canApplySolutions = role === "DOI" || role === "COLLEGE_ADMIN";
  const scopeLabel =
    role === "DOI" ? "campus-wide" : role === "CHAIRMAN_ADMIN" ? "program" : "college";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">
            Schedule View
          </h1>
        </div>
        <ScheduleGridView
          rooms={rooms}
          colleges={colleges}
          currentRoomId={roomId}
          currentCollegeId={viewCollegeId}
          canViewOtherColleges={!!canViewOtherColleges}
          userCollegeId={collegeId ?? null}
        />
      </div>

      {(role === "DOI" || role === "COLLEGE_ADMIN" || role === "CHAIRMAN_ADMIN") && (
        <ConflictEvaluator canApply={canApplySolutions} scopeLabel={scopeLabel} />
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
        <table className="w-full min-w-[720px] border-collapse text-left text-[11px]">
          <thead className="bg-slate-900/90">
            <tr>
              <th className="sticky left-0 z-10 min-w-[72px] border-r border-slate-700 bg-slate-900/95 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                TIME
              </th>
              {DAYS.map((d) => (
                <th
                  key={d}
                  className="min-w-[100px] border-r border-slate-700 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 last:border-r-0"
                >
                  {d.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot} className="border-b border-slate-800/80">
                <td className="sticky left-0 z-10 border-r border-slate-700/80 bg-slate-900/60 px-2 py-1.5 font-medium text-slate-300">
                  {slot}
                </td>
                {DAYS.map((day) => {
                  const entries = grid[slot][day] ?? [];
                  return (
                    <td
                      key={day}
                      className="min-h-[48px] border-r border-slate-800/60 bg-slate-950/40 px-2 py-1.5 align-top last:border-r-0"
                    >
                      {entries.length === 0 ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {entries.map((s) => (
                            <div
                              key={s.id}
                              className="rounded border border-slate-700/60 bg-slate-900/80 px-2 py-1"
                            >
                              <p className="font-semibold text-slate-100">
                                {s.subject.code}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {s.instructor.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {s.section.program.code} {s.section.name} · {s.room.code}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {schedules.length === 0 && (
        <p className="text-center text-slate-400">
          No schedules match the current filters.{" "}
          <Link href="/dashboard/timetabling" className="text-brand-teal hover:underline">
            Go to Timetabling
          </Link>
        </p>
      )}
    </div>
  );
}
