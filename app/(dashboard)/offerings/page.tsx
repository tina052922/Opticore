import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const createOfferingSchema = z.object({
  subjectId: z.string().cuid(),
  estimatedSections: z.coerce.number().int().min(1).max(20).default(1),
  estimatedStudentsPerSection: z.coerce.number().int().min(10).max(80).default(40),
  preferredDays: z.string().optional(),
  preferredTimeOfDay: z.string().optional(),
  preferredRoomType: z.string().optional()
});

export default async function OfferingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string | undefined;
  const programId = (session.user as any).programId as string | undefined;

  if (role !== "CHAIRMAN_ADMIN" || !programId) {
    redirect("/dashboard");
  }

  const period = await prisma.academicPeriod.findFirst({
    where: { isCurrent: true }
  });

  if (!period) {
    return (
      <div className="mx-auto max-w-4xl text-xs text-slate-300">
        <h1 className="mb-2 text-xl font-semibold text-slate-50">
          Subject Offerings
        </h1>
        <p className="text-slate-400">
          No active academic period is configured. Please ask the DOI or system
          administrator to set up an AcademicPeriod record.
        </p>
      </div>
    );
  }

  const [program, subjects, offerings] = await Promise.all([
    prisma.program.findUnique({ where: { id: programId } }),
    prisma.subject.findMany({
      orderBy: { code: "asc" }
    }),
    prisma.subjectOffering.findMany({
      where: {
        programId,
        academicPeriodId: period.id
      },
      include: {
        subject: true
      },
      orderBy: { id: "asc" }
    })
  ]);

  async function createOffering(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const role = (session.user as any).role as string | undefined;
    const programId = (session.user as any).programId as string | undefined;
    if (role !== "CHAIRMAN_ADMIN" || !programId) {
      throw new Error("Forbidden");
    }

    const period = await prisma.academicPeriod.findFirst({
      where: { isCurrent: true }
    });
    if (!period) throw new Error("No current academic period");

    const parsed = createOfferingSchema.parse({
      subjectId: formData.get("subjectId"),
      estimatedSections: formData.get("estimatedSections"),
      estimatedStudentsPerSection: formData.get("estimatedStudentsPerSection"),
      preferredDays: formData.get("preferredDays") || undefined,
      preferredTimeOfDay: formData.get("preferredTimeOfDay") || undefined,
      preferredRoomType: formData.get("preferredRoomType") || undefined
    });

    const created = await prisma.subjectOffering.create({
      data: {
        programId,
        academicPeriodId: period.id,
        subjectId: parsed.subjectId,
        createdById: (session.user as any).id,
        estimatedSections: parsed.estimatedSections,
        estimatedStudentsPerSection: parsed.estimatedStudentsPerSection,
        preferredDays: parsed.preferredDays,
        preferredTimeOfDay: parsed.preferredTimeOfDay,
        preferredRoomType: parsed.preferredRoomType as any
      }
    });

    await logAudit(
      (session.user as any).id,
      "SubjectOffering",
      created.id,
      "CREATE",
      `Created offering for subject ${parsed.subjectId} in period ${period.id}`
    );

    redirect("/dashboard/offerings");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 text-xs text-slate-200">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Subject Offerings – {program?.code}
        </h1>
        <p className="text-slate-400">
          Configure subjects, sections, and preferences for{" "}
          <span className="font-semibold">
            {period.semester} {period.academicYear}
          </span>
          .
        </p>
      </div>

      <div className="glass-panel flex flex-col gap-4 rounded-2xl p-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          New Offering
        </h2>
        <form action={createOffering} className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] text-slate-400">
              Subject
            </label>
            <select
              name="subjectId"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
              required
            >
              <option value="">Select subject…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} – {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              # Sections
            </label>
            <input
              type="number"
              name="estimatedSections"
              min={1}
              max={20}
              defaultValue={1}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              Est. Students / Section
            </label>
            <input
              type="number"
              name="estimatedStudentsPerSection"
              min={10}
              max={80}
              defaultValue={40}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              Preferred Days (comma-separated)
            </label>
            <input
              type="text"
              name="preferredDays"
              placeholder="MONDAY,WEDNESDAY"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              Preferred Time of Day
            </label>
            <select
              name="preferredTimeOfDay"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            >
              <option value="">No preference</option>
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
              <option value="EVENING">Evening</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              Preferred Room Type
            </label>
            <select
              name="preferredRoomType"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            >
              <option value="">No preference</option>
              <option value="LECTURE">Lecture</option>
              <option value="LAB">Lab</option>
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button type="submit" size="sm">
              Add Offering
            </Button>
          </div>
        </form>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Current Offerings
        </h2>
        <div className="max-h-[360px] overflow-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Sections</th>
                <th className="px-3 py-2">Est. Students</th>
                <th className="px-3 py-2">Prefs</th>
              </tr>
            </thead>
            <tbody>
              {offerings.map((o) => (
                <tr key={o.id} className="odd:bg-slate-900/40">
                  <td className="px-3 py-2">
                    <span className="font-semibold text-slate-100">
                      {o.subject.code}
                    </span>{" "}
                    <span className="text-slate-400">· {o.subject.title}</span>
                  </td>
                  <td className="px-3 py-2">{o.estimatedSections}</td>
                  <td className="px-3 py-2">
                    {o.estimatedStudentsPerSection}
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {o.preferredDays && (
                      <span className="mr-2">
                        Days: <span className="text-slate-200">{o.preferredDays}</span>
                      </span>
                    )}
                    {o.preferredTimeOfDay && (
                      <span className="mr-2">
                        Time:{" "}
                        <span className="text-slate-200">
                          {o.preferredTimeOfDay}
                        </span>
                      </span>
                    )}
                    {o.preferredRoomType && (
                      <span>
                        Room:{" "}
                        <span className="text-slate-200">
                          {o.preferredRoomType}
                        </span>
                      </span>
                    )}
                    {!o.preferredDays &&
                      !o.preferredTimeOfDay &&
                      !o.preferredRoomType && <span>None</span>}
                  </td>
                </tr>
              ))}
              {offerings.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-[11px] text-slate-400"
                  >
                    No offerings yet for this period. Use the form above to
                    start encoding your subjects and constraints.
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

