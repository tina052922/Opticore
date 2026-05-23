import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { logAudit } from "@/lib/audit";
import { notifyUsers, notifySectionStudents } from "@/lib/notifications";
import { syncScheduleToDraftEntries } from "@/lib/schedule-sync";
import { DayOfWeek } from "@prisma/client";

type PendingRequestWithConflict = Awaited<
  ReturnType<typeof getPendingRequestsWithConflicts>
>[number];

async function getPendingRequestsWithConflicts(collegeId: string) {
  const pending = await prisma.scheduleChangeRequest.findMany({
    where: {
      status: "PENDING",
      schedule: {
        section: { program: { collegeId } }
      }
    },
    include: {
      requester: true,
      schedule: {
        include: {
          subject: true,
          room: true,
          section: { include: { program: true } }
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  const scheduleIds = pending
    .map((r) => r.schedule?.id)
    .filter((id): id is string => !!id);

  if (scheduleIds.length === 0) {
    return pending.map((r) => ({ ...r, conflictWarning: null as string | null }));
  }

  const referenceSchedules = await prisma.schedule.findMany({
    where: {
      section: { program: { collegeId } },
      id: { notIn: scheduleIds }
    },
    select: {
      id: true,
      day: true,
      startTime: true,
      endTime: true,
      roomId: true,
      instructorId: true,
      sectionId: true
    }
  });

  return pending.map((r) => {
    const base = r.schedule;
    if (!base || !r.newStartTime) {
      return { ...r, conflictWarning: null as string | null };
    }

    const [sh, sm] = base.startTime.split(":").map(Number);
    const [eh, em] = base.endTime.split(":").map(Number);
    const durationMins = eh * 60 + em - (sh * 60 + sm);

    const [nsh, nsm] = r.newStartTime.split(":").map(Number);
    const newStartMins = nsh * 60 + nsm;
    const newEndMins = newStartMins + durationMins;
    const newEndH = Math.floor(newEndMins / 60);
    const newEndM = newEndMins % 60;
    const newEndTime = `${String(newEndH).padStart(2, "0")}:${String(newEndM).padStart(
      2,
      "0"
    )}`;

    const conflict = referenceSchedules.find((o) => {
      if (o.day !== base.day) return false;
      if (o.roomId !== base.roomId && o.instructorId !== base.instructorId && o.sectionId !== base.sectionId) {
        return false;
      }

      const [osh, osm] = o.startTime.split(":").map(Number);
      const [oeh, oem] = o.endTime.split(":").map(Number);
      const oStart = osh * 60 + osm;
      const oEnd = oeh * 60 + oem;

      const overlaps = newStartMins < oEnd && newEndMins > oStart;
      if (!overlaps) return false;

      if (o.roomId === base.roomId) return true;
      if (o.instructorId === base.instructorId) return true;
      if (o.sectionId === base.sectionId) return true;
      return false;
    });

    if (!conflict) {
      return { ...r, conflictWarning: null as string | null };
    }

    let reason = "Conflict with other schedule";
    if (conflict.roomId === base.roomId) reason = "Room double-booked if approved";
    else if (conflict.instructorId === base.instructorId)
      reason = "Instructor overlap if approved";
    else if (conflict.sectionId === base.sectionId)
      reason = "Section overlap if approved";

    return { ...r, conflictWarning: reason as string | null };
  });
}

export default async function ScheduleChangeRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string | undefined;
  const collegeId = (session.user as any).collegeId as string | undefined;

  if (role !== "COLLEGE_ADMIN" || !collegeId) {
    redirect("/dashboard");
  }

  const pending = await getPendingRequestsWithConflicts(collegeId);

  async function approveRequest(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user) throw new Error("Unauthorized");
    const r = (s.user as any).role as string | undefined;
    const cid = (s.user as any).collegeId as string | undefined;
    if (r !== "COLLEGE_ADMIN" || !cid) throw new Error("Forbidden");

    const id = formData.get("requestId")?.toString();
    if (!id) return;

    const req = await prisma.scheduleChangeRequest.findUnique({
      where: { id },
      include: {
        requester: true,
        schedule: {
          include: {
            subject: true,
            section: { include: { program: true } }
          }
        }
      }
    });
    if (!req?.schedule || req.schedule.section.program.collegeId !== cid) {
      throw new Error("Forbidden");
    }

    const pendingCheck = await getPendingRequestsWithConflicts(cid);
    const hadConflict = !!pendingCheck.find((p) => p.id === id)?.conflictWarning;

    let newEndTime: string | undefined;
    let updateDay: DayOfWeek | undefined;

    if (req.newStartTime && req.schedule) {
      const s = req.schedule;
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      const durationMins = eh * 60 + em - (sh * 60 + sm);
      const [nsh, nsm] = req.newStartTime.split(":").map(Number);
      const newStartMins = nsh * 60 + nsm;
      const newEndMins = newStartMins + durationMins;
      const newEndH = Math.floor(newEndMins / 60);
      const newEndM = newEndMins % 60;
      newEndTime = `${String(newEndH).padStart(2, "0")}:${String(newEndM).padStart(2, "0")}`;
      updateDay = (req.newDay as DayOfWeek) ?? s.day;
    }

    await prisma.$transaction(async (tx) => {
      await tx.scheduleChangeRequest.update({
        where: { id },
        data: { status: "APPROVED", conflictsResolved: !hadConflict }
      });
      if (req.schedule && req.newStartTime && newEndTime) {
        await tx.schedule.update({
          where: { id: req.schedule.id },
          data: {
            startTime: req.newStartTime,
            endTime: newEndTime,
            day: updateDay,
            ...(req.newRoomId ? { roomId: req.newRoomId } : {})
          }
        });
      }
    });

    if (req.schedule && req.newStartTime && newEndTime) {
      await syncScheduleToDraftEntries(req.schedule.id, {
        startTime: req.newStartTime,
        endTime: newEndTime,
        day: updateDay,
        ...(req.newRoomId ? { roomId: req.newRoomId } : {})
      });
    }

    const adminId = (s.user as { id?: string }).id;
    if (adminId) {
      await logAudit(adminId, "ScheduleChangeRequest", id, "APPROVED", hadConflict ? "With conflict warning" : "No conflicts");
    }

    const subjectLabel = req.schedule?.subject.code ?? "class";
    await notifyUsers([req.requesterId], "Schedule change approved", `${subjectLabel}: time change approved.`);
    if (req.schedule?.sectionId) {
      await notifySectionStudents(req.schedule.sectionId, "Schedule updated", `${subjectLabel} schedule was updated.`);
    }
    const doiUsers = await prisma.user.findMany({ where: { role: "DOI" }, select: { id: true } });
    await notifyUsers(doiUsers.map((u) => u.id), "Schedule change published", `${subjectLabel} updated.`);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedules");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/my-schedule");

    redirect("/dashboard/schedule-change-requests");
  }

  async function rejectRequest(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user) throw new Error("Unauthorized");
    const r = (s.user as any).role as string | undefined;
    const cid = (s.user as any).collegeId as string | undefined;
    if (r !== "COLLEGE_ADMIN" || !cid) throw new Error("Forbidden");

    const id = formData.get("requestId")?.toString();
    if (!id) return;

    const req = await prisma.scheduleChangeRequest.findUnique({
      where: { id },
      include: { schedule: { include: { section: { include: { program: true } } } } }
    });
    if (!req?.schedule || req.schedule.section.program.collegeId !== cid) {
      throw new Error("Forbidden");
    }

    await prisma.scheduleChangeRequest.update({
      where: { id },
      data: { status: "REJECTED" }
    });

    redirect("/dashboard/schedule-change-requests");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 text-xs text-slate-200">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Schedule Change Requests
        </h1>
        <p className="text-slate-400">
          Approve or reject instructor time-change requests for your college.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Pending requests
        </h2>
        <div className="max-h-[400px] overflow-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-3 py-2">Requester</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Current</th>
                <th className="px-3 py-2">Requested time</th>
                <th className="px-3 py-2">Impact</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r: PendingRequestWithConflict) => (
                <tr key={r.id} className="odd:bg-slate-900/40">
                  <td className="px-3 py-2">
                    {r.requester.name ?? r.requester.email}
                  </td>
                  <td className="px-3 py-2">
                    {r.schedule?.subject.code} · {r.schedule?.section.program.code}{" "}
                    {r.schedule?.section.name}
                  </td>
                  <td className="px-3 py-2">
                    {r.schedule?.day} {r.schedule?.startTime}–{r.schedule?.endTime}{" "}
                    · {r.schedule?.room.code}
                  </td>
                  <td className="px-3 py-2">
                    {r.newStartTime || "-"}
                    {r.newStartTime && (
                      <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                        keeps same room
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r.conflictWarning ? (
                      <span
                        className="inline-flex rounded-full bg-red-900/60 px-2 py-0.5 text-[10px] font-semibold text-red-300"
                        title={r.conflictWarning}
                      >
                        Conflict if approved
                      </span>
                    ) : r.newStartTime ? (
                      <span className="inline-flex rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        No conflict
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        No time change
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-xs truncate" title={r.reason}>
                    {r.reason}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form
                      action={approveRequest}
                      className="mb-1 inline-block"
                    >
                      <input type="hidden" name="requestId" value={r.id} />
                      <Button size="sm" className="h-7 text-[10px]">
                        Approve
                      </Button>
                    </form>
                    <form
                      action={rejectRequest}
                      className="ml-2 inline-block"
                    >
                      <input type="hidden" name="requestId" value={r.id} />
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] text-amber-300">
                        Reject
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {pending.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-slate-400"
                  >
                    No pending schedule change requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
