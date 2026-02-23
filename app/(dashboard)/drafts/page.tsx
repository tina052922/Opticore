import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { logAudit } from "@/lib/audit";

const commentSchema = z.object({
  draftId: z.string().cuid(),
  message: z.string().min(3).max(500)
});

export default async function DraftsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string | undefined;
  const collegeId = (session.user as any).collegeId as string | undefined;
  const isCollegeAdmin = role === "COLLEGE_ADMIN" && collegeId;
  const isDOI = role === "DOI";
  if (!isCollegeAdmin && !isDOI) {
    redirect("/dashboard");
  }

  const period = await prisma.academicPeriod.findFirst({
    where: { isCurrent: true }
  });

  if (!period) {
    return (
      <div className="mx-auto max-w-4xl text-xs text-slate-300">
        <h1 className="mb-2 text-xl font-semibold text-slate-50">
          Schedule Drafts
        </h1>
        <p className="text-slate-400">
          No active academic period is configured. Please ask the DOI or system
          administrator to set up an AcademicPeriod record.
        </p>
      </div>
    );
  }

  const myDrafts = isCollegeAdmin
    ? await prisma.scheduleDraft.findMany({
        where: {
          collegeId: collegeId!,
          academicPeriodId: period.id
        },
        include: {
          college: true,
          comments: {
            orderBy: { createdAt: "desc" },
            take: 3,
            include: { author: true }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    : [];

  const otherDrafts = await prisma.scheduleDraft.findMany({
    where: {
      academicPeriodId: period.id,
      ...(isCollegeAdmin && collegeId ? { collegeId: { not: collegeId } } : {})
    },
    include: {
      college: true,
      comments: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { author: true }
      }
    },
    orderBy: [{ college: { code: "asc" } }, { version: "desc" }]
  });

  const drafts = myDrafts;

  async function createDraft() {
    "use server";
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    const role = (session.user as any).role as string | undefined;
    const collegeId = (session.user as any).collegeId as string | undefined;
    if (role !== "COLLEGE_ADMIN" || !collegeId) throw new Error("Forbidden");

    const period = await prisma.academicPeriod.findFirst({
      where: { isCurrent: true }
    });
    if (!period) throw new Error("No current academic period");

    const latest = await prisma.scheduleDraft.findFirst({
      where: { collegeId, academicPeriodId: period.id },
      orderBy: { version: "desc" }
    });

    const version = latest ? latest.version + 1 : 1;

    const created = await prisma.scheduleDraft.create({
      data: {
        collegeId,
        academicPeriodId: period.id,
        version,
        status: "DRAFT"
      }
    });

    await logAudit(
      (session.user as any).id,
      "ScheduleDraft",
      created.id,
      "CREATE",
      `Created draft v${version} for college ${collegeId}`
    );

    redirect("/dashboard/drafts");
  }

  async function submitToDOI(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    const role = (session.user as any).role as string | undefined;
    if (role !== "COLLEGE_ADMIN") throw new Error("Forbidden");

    const parsed = commentSchema.parse({
      draftId: formData.get("draftId"),
      message: formData.get("message")
    });

    const draft = await prisma.scheduleDraft.update({
      where: { id: parsed.draftId },
      data: {
        status: "DOI_REVIEW",
        submittedById: (session.user as any).id,
        comments: {
          create: {
            authorId: (session.user as any).id,
            action: "TO_DOI",
            message: parsed.message
          }
        },
        auditLogs: {
          create: {
            userId: (session.user as any).id,
            entity: "ScheduleDraft",
            entityId: parsed.draftId,
            action: "TO_DOI",
            details: parsed.message
          }
        }
      }
    });

    await logAudit(
      (session.user as any).id,
      "ScheduleDraft",
      parsed.draftId,
      "TO_DOI",
      parsed.message
    );

    if (!draft) throw new Error("Draft not found");
    redirect("/dashboard/drafts");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 text-xs text-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">
            Schedule Drafts
          </h1>
          <p className="text-slate-400">
            {isDOI
              ? "View all college schedule drafts. Use Approval Queue to approve or return."
              : "Manage college-level drafts before forwarding to DOI for approval."}
          </p>
        </div>
        {isCollegeAdmin && (
          <form action={createDraft}>
            <Button type="submit" size="sm">
              New Draft Version
            </Button>
          </form>
        )}
      </div>

      {isCollegeAdmin && (
      <div className="glass-panel rounded-2xl p-4">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          My college drafts · {period.semester} {period.academicYear}
        </h2>
        <div className="max-h-[360px] overflow-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-3 py-2">Version</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Last Comments</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((d) => (
                <tr key={d.id} className="odd:bg-slate-900/40">
                  <td className="px-3 py-2">v{d.version}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold">
                      {d.status}
                    </span>
                  </td>
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
                    {d.status === "DRAFT" && (
                      <form action={submitToDOI} className="inline-flex flex-col gap-1">
                        <input type="hidden" name="draftId" value={d.id} />
                        <input
                          name="message"
                          placeholder="Summary before sending to DOI"
                          className="w-56 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                          required
                        />
                        <Button type="submit" size="sm" className="self-end text-[11px]">
                          Send to DOI
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {drafts.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-[11px] text-slate-400"
                  >
                    No drafts yet. Use &quot;New Draft Version&quot; to create a
                    baseline for this academic period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {(isDOI || (isCollegeAdmin && otherDrafts.length > 0)) && (
        <div className="glass-panel rounded-2xl p-4">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {isDOI ? "All college drafts" : "Other colleges' drafts"}
          </h2>
          <p className="mb-3 text-[11px] text-slate-400">
            {isDOI
              ? "Overview of all college schedule drafts. Use Approval Queue to approve or return."
              : "View other colleges' drafts to coordinate GEC subject insertion."}
          </p>
          <div className="max-h-[280px] overflow-auto">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2">College</th>
                  <th className="px-3 py-2">Version</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Last Comments</th>
                </tr>
              </thead>
              <tbody>
                {otherDrafts.map((d) => (
                  <tr key={d.id} className="odd:bg-slate-900/40">
                    <td className="px-3 py-2 font-medium text-slate-200">
                      {d.college.code}
                    </td>
                    <td className="px-3 py-2">v{d.version}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {d.comments.length === 0 && <span>—</span>}
                      {d.comments.map((c) => (
                        <div key={c.id}>
                          {c.author.name ?? c.author.email}: {c.message}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
                {otherDrafts.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-[11px] text-slate-400"
                    >
                      No other college drafts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

