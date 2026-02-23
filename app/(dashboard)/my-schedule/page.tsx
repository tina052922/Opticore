import { redirect } from "next/navigation";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getData(userId: string) {
  const [schedules, requests] = await Promise.all([
    prisma.schedule.findMany({
      where: { instructorId: userId },
      include: {
        subject: true,
        room: true,
        section: { include: { program: true } }
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }]
    }),
    prisma.scheduleChangeRequest.findMany({
      where: { requesterId: userId },
      include: {
        schedule: {
          include: { subject: true, room: true, section: { include: { program: true } } }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);
  return { schedules, requests };
}

export default async function MySchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string | undefined;
  if (role !== "INSTRUCTOR") {
    redirect("/dashboard");
  }

  const userId = (session.user as any).id;
  if (!userId) redirect("/login");
  const { schedules, requests } = await getData(userId);

  async function createChangeRequest(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user) throw new Error("Unauthorized");
    const requesterId = (s.user as any).id ?? s.user.email;

    const scheduleId = formData.get("scheduleId")?.toString();
    const reason = formData.get("reason")?.toString() ?? "";
    const newStartTime = formData.get("newStartTime")?.toString() || null;

    if (!scheduleId || !reason) {
      throw new Error("Missing fields");
    }

    // Instructors may only request time changes, not room changes
    await prisma.scheduleChangeRequest.create({
      data: {
        requesterId,
        scheduleId,
        reason,
        newStartTime: newStartTime || undefined
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 text-xs">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          My Teaching Schedule
        </h1>
        <p className="text-xs text-slate-400">
          Review your current schedule and submit formal change/swap requests.
        </p>
      </div>

      <section className="glass-panel rounded-2xl px-4 py-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Assigned Classes
        </p>
        <div className="max-h-72 overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-[0.14em] text-slate-400">
              <tr>
                <th className="px-3 py-2">Day</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Section</th>
                <th className="px-3 py-2">Room</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="odd:bg-slate-900/40">
                  <td className="px-3 py-2">{s.day}</td>
                  <td className="px-3 py-2">
                    {s.startTime}–{s.endTime}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium text-slate-100">{s.subject.code}</span>{" "}
                    <span className="text-slate-400">· {s.subject.title}</span>
                  </td>
                  <td className="px-3 py-2">
                    {s.section.program.code} {s.section.name}
                  </td>
                  <td className="px-3 py-2">
                    <span>{s.room.code}</span>{" "}
                    <Link
                      href={`/room-locator?room=${encodeURIComponent(s.room.code)}`}
                      className="ml-1 text-[10px] text-brand-teal hover:underline"
                    >
                      Open in Locator
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={createChangeRequest} className="flex flex-col gap-1 text-[11px]">
                      <input type="hidden" name="scheduleId" value={s.id} />
                      <input
                        name="reason"
                        placeholder="Reason for time change"
                        className="h-8 w-full rounded-md border border-slate-800 bg-slate-900/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
                        required
                      />
                      <input
                        name="newStartTime"
                        placeholder="Requested new time (e.g. 9:00)"
                        className="h-7 w-36 rounded-md border border-slate-800 bg-slate-900/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="mt-1 h-7 px-2 text-[11px]"
                      >
                        Submit request
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-[11px] text-slate-400"
                  >
                    You do not have any assigned classes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel rounded-2xl px-4 py-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          My Change & Swap Requests
        </p>
        <div className="max-h-64 overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-[0.14em] text-slate-400">
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Original</th>
                <th className="px-3 py-2">Requested time</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="odd:bg-slate-900/40">
                  <td className="px-3 py-2">
                    {r.schedule?.subject.code} · {r.schedule?.subject.title}
                  </td>
                  <td className="px-3 py-2">
                    {r.schedule?.day} {r.schedule?.startTime}–{r.schedule?.endTime} ·{" "}
                    {r.schedule?.room.code}
                  </td>
                  <td className="px-3 py-2">
                    {r.newStartTime || "-"}
                  </td>
                  <td className="px-3 py-2 max-w-xs truncate" title={r.reason}>
                    {r.reason}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-300"
                          : r.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-[11px] text-slate-400"
                  >
                    You have not submitted any change or swap requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

