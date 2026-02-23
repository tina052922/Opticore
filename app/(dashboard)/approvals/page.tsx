import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { logAudit } from "@/lib/audit";

const decisionSchema = z.object({
  draftId: z.string().cuid(),
  message: z.string().min(3).max(500)
});

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string | undefined;
  if (role !== "DOI") {
    redirect("/dashboard");
  }

  const period = await prisma.academicPeriod.findFirst({
    where: { isCurrent: true }
  });

  if (!period) {
    return (
      <div className="mx-auto max-w-4xl text-xs text-slate-300">
        <h1 className="mb-2 text-xl font-semibold text-slate-50">
          Approval Queue
        </h1>
        <p className="text-slate-400">
          No active academic period is configured.
        </p>
      </div>
    );
  }

  const drafts = await prisma.scheduleDraft.findMany({
    where: {
      academicPeriodId: period.id,
      status: "DOI_REVIEW"
    },
    include: {
      college: true,
      comments: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { author: true }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  async function approveDraft(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    const role = (session.user as any).role as string | undefined;
    if (role !== "DOI") throw new Error("Forbidden");

    const parsed = decisionSchema.parse({
      draftId: formData.get("draftId"),
      message: formData.get("message")
    });

    await prisma.scheduleDraft.update({
      where: { id: parsed.draftId },
      data: {
        status: "APPROVED",
        approvedById: (session.user as any).id,
        comments: {
          create: {
            authorId: (session.user as any).id,
            action: "APPROVE",
            message: parsed.message
          }
        },
        auditLogs: {
          create: {
            userId: (session.user as any).id,
            entity: "ScheduleDraft",
            entityId: parsed.draftId,
            action: "APPROVE",
            details: parsed.message
          }
        }
      }
    });

    await logAudit(
      (session.user as any).id,
      "ScheduleDraft",
      parsed.draftId,
      "APPROVE",
      parsed.message
    );

    redirect("/dashboard/approvals");
  }

  async function returnDraft(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    const role = (session.user as any).role as string | undefined;
    if (role !== "DOI") throw new Error("Forbidden");

    const parsed = decisionSchema.parse({
      draftId: formData.get("draftId"),
      message: formData.get("message")
    });

    await prisma.scheduleDraft.update({
      where: { id: parsed.draftId },
      data: {
        status: "RETURNED",
        comments: {
          create: {
            authorId: (session.user as any).id,
            action: "RETURN_TO_COLLEGE",
            message: parsed.message
          }
        },
        auditLogs: {
          create: {
            userId: (session.user as any).id,
            entity: "ScheduleDraft",
            entityId: parsed.draftId,
            action: "RETURN_TO_COLLEGE",
            details: parsed.message
          }
        }
      }
    });

    await logAudit(
      (session.user as any).id,
      "ScheduleDraft",
      parsed.draftId,
      "RETURN_TO_COLLEGE",
      parsed.message
    );

    redirect("/dashboard/approvals");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 text-xs text-slate-200">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Approval Queue
        </h1>
        <p className="text-slate-400">
          Review college drafts campus-wide, approve or return with mandatory
          comments.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Pending in DOI Review – {period.semester} {period.academicYear}
        </h2>
        <div className="max-h-[360px] overflow-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-3 py-2">College</th>
                <th className="px-3 py-2">Version</th>
                <th className="px-3 py-2">Recent Comments</th>
                <th className="px-3 py-2 text-right">Decision</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((d) => (
                <tr key={d.id} className="odd:bg-slate-900/40">
                  <td className="px-3 py-2">{d.college.code}</td>
                  <td className="px-3 py-2">v{d.version}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {d.comments.length === 0 && <span>No comments yet.</span>}
                    {d.comments.map((c) => (
                      <div key={c.id}>
                        <span className="text-slate-300">
                          {c.author.name ?? c.author.email}
                        </span>
                        {": "}
                        {c.message}
                      </div>
                    ))}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form
                      action={approveDraft}
                      className="mb-2 flex flex-col items-end gap-1"
                    >
                      <input type="hidden" name="draftId" value={d.id} />
                      <input
                        name="message"
                        placeholder="Approval note"
                        className="w-56 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                        required
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-emerald-600 text-[11px] hover:bg-emerald-500"
                      >
                        Approve
                      </Button>
                    </form>
                    <form
                      action={returnDraft}
                      className="flex flex-col items-end gap-1"
                    >
                      <input type="hidden" name="draftId" value={d.id} />
                      <input
                        name="message"
                        placeholder="Return reason"
                        className="w-56 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                        required
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="text-[11px] text-amber-300"
                      >
                        Return to College
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {drafts.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-[11px] text-slate-400"
                  >
                    No drafts are currently awaiting DOI review.
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

