import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function getCrossCollegeView(currentCollegeId: string | null) {
  const schedules = await prisma.schedule.findMany({
    where: currentCollegeId
      ? {
          section: {
            program: {
              collegeId: {
                not: currentCollegeId
              }
            }
          }
        }
      : {},
    include: {
      subject: true,
      room: true,
      instructor: true,
      section: {
        include: {
          program: {
            include: { college: true }
          }
        }
      }
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }]
  });

  const byCollege = new Map<
    string,
    {
      collegeName: string;
      items: typeof schedules;
    }
  >();

  for (const s of schedules) {
    const college = s.section?.program?.college;
    if (!college) continue;
    if (!byCollege.has(college.id)) {
      byCollege.set(college.id, { collegeName: college.name, items: [] });
    }
    byCollege.get(college.id)!.items.push(s);
  }

  return Array.from(byCollege.entries()).map(([id, v]) => ({
    collegeId: id,
    collegeName: v.collegeName,
    schedules: v.items
  }));
}

export default async function CrossCollegePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string | undefined;
  const collegeId = ((session.user as any).collegeId ?? null) as string | null;

  // College Admins: see all other colleges. DOI: see all colleges.
  if (role !== "COLLEGE_ADMIN" && role !== "DOI") {
    redirect("/dashboard");
  }

  const cross = await getCrossCollegeView(role === "COLLEGE_ADMIN" ? collegeId : null);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 text-xs text-slate-200">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Cross-College Coordination
        </h1>
        <p className="text-slate-400">
          Read-only overview of other colleges&apos; schedules to help you plan requests and
          GEC insertions without conflicts.
        </p>
      </div>

      {cross.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-4 text-slate-400">
          No published schedules from other colleges yet.
        </p>
      )}

      {cross.map((block) => (
        <section
          key={block.collegeId}
          className="glass-panel rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                {block.collegeName}
              </h2>
              <p className="text-[11px] text-slate-400">
                Read-only: use change requests if you need to propose adjustments.
              </p>
            </div>
          </div>
          <div className="max-h-[360px] overflow-auto rounded-lg border border-slate-800 bg-slate-950/60">
            <table className="min-w-full border-collapse text-left text-[11px]">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2">Program / Section</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Instructor</th>
                  <th className="px-3 py-2">Day</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Room</th>
                </tr>
              </thead>
              <tbody>
                {block.schedules.map((s) => (
                  <tr key={s.id} className="odd:bg-slate-900/40">
                    <td className="px-3 py-2">
                      {s.section?.program?.code} {s.section?.name}
                    </td>
                    <td className="px-3 py-2">
                      {s.subject?.code} · {s.subject?.title}
                    </td>
                    <td className="px-3 py-2">
                      {s.instructor?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2">{s.day}</td>
                    <td className="px-3 py-2">
                      {s.startTime}–{s.endTime}
                    </td>
                    <td className="px-3 py-2">{s.room?.code}</td>
                  </tr>
                ))}
                {block.schedules.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-slate-500"
                      colSpan={6}
                    >
                      No schedules yet for this college.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

