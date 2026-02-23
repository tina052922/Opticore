import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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

export default async function StudentSchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string | undefined;
  if (role !== "STUDENT") {
    redirect("/dashboard");
  }

  const sectionId = (session.user as any).sectionId as string | undefined;
  if (!sectionId) {
    return (
      <div className="mx-auto max-w-4xl text-xs text-slate-300">
        <h1 className="mb-2 text-xl font-semibold text-slate-50">My Schedule</h1>
        <p className="text-slate-400">
          Your account is not yet linked to a section. Please contact the registrar or system
          administrator to assign you to your official section.
        </p>
      </div>
    );
  }

  const schedules = await prisma.schedule.findMany({
    where: { sectionId },
    include: {
      subject: true,
      instructor: true,
      room: true,
      section: { include: { program: true } }
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }]
  });

  const section = schedules[0]?.section;

  const grid: Record<string, Record<string, (typeof schedules)[0][]>> = {};
  for (const slot of TIME_SLOTS) {
    grid[slot] = {};
    for (const day of DAYS) {
      grid[slot][day] = schedules.filter(
        (s) => s.day === day && slotMatches(s, slot)
      );
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">
            My Schedule
          </h1>
          <p className="text-slate-400">
            Weekly timetable for your section
            {section && (
              <>
                {" "}
                ({section.program.code} {section.name})
              </>
            )}
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/schedules"
            className="text-[11px] text-brand-teal hover:underline"
          >
            View campus-wide schedules
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
        <table className="w-full min-w-[720px] border-collapse text-left text-[11px]">
          <thead className="bg-slate-900/90 print:bg-white print:text-black">
            <tr>
              <th className="sticky left-0 z-10 min-w-[72px] border-r border-slate-700 bg-slate-900/95 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 print:bg-white print:text-black">
                TIME
              </th>
              {DAYS.map((d) => (
                <th
                  key={d}
                  className="min-w-[100px] border-r border-slate-700 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 last:border-r-0 print:bg-white print:text-black"
                >
                  {d.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot} className="border-b border-slate-800/80 print:border-gray-300">
                <td className="sticky left-0 z-10 border-r border-slate-700/80 bg-slate-900/60 px-2 py-1.5 font-medium text-slate-300 print:bg-gray-100 print:text-black">
                  {slot}
                </td>
                {DAYS.map((day) => {
                  const entries = grid[slot][day] ?? [];
                  return (
                    <td
                      key={day}
                      className="min-h-[48px] border-r border-slate-800/60 bg-slate-950/40 px-2 py-1.5 align-top last:border-r-0 print:border-gray-300 print:bg-white"
                    >
                      {entries.length === 0 ? (
                        <span className="text-slate-600 print:text-gray-400">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {entries.map((s) => {
                            const locatorHref = `/room-locator?room=${encodeURIComponent(
                              s.room.code
                            )}`;
                            return (
                              <div
                                key={s.id}
                                className="rounded border border-slate-700/60 bg-slate-900/80 px-2 py-1 print:border-gray-300 print:bg-white"
                              >
                                <p className="font-semibold text-slate-100 print:text-black">
                                  {s.subject.code}
                                </p>
                                <p className="text-[10px] text-slate-400 print:text-gray-700">
                                  {s.subject.title}
                                </p>
                                <p className="text-[10px] text-slate-500 print:text-gray-600">
                                  {s.instructor.name} · Room {s.room.code}
                                </p>
                                <Link
                                  href={locatorHref}
                                  className="mt-0.5 inline-flex text-[10px] text-brand-teal hover:underline print:hidden"
                                >
                                  Open in Room Locator
                                </Link>
                              </div>
                            );
                          })}
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
    </div>
  );
}

