import { prisma } from "@/lib/prisma";
import type { RoomType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth.config";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { RepositoryProgramsSearch } from "@/components/repository-programs-search";
import { RepositorySectionsSearch } from "@/components/repository-sections-search";
import { RepositoryFacultySearch } from "@/components/repository-faculty-search";
import { RepositorySubjectsSearch } from "@/components/repository-subjects-search";
import { RepositoryRoomsSearch } from "@/components/repository-rooms-search";

async function getRepositoryData() {
  const [programs, sections, faculty, subjects, rooms] = await Promise.all([
    prisma.program.findMany({ include: { college: true } }),
    prisma.section.findMany({ include: { program: { include: { college: true } } } }),
    prisma.facultyProfile.findMany({
      include: { user: true, canTeach: { include: { subject: true } } }
    }),
    prisma.subject.findMany(),
    prisma.room.findMany()
  ]);
  return { programs, sections, faculty, subjects, rooms };
}

export default async function RepositoryPage() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const role = (session.user as any).role as string | undefined;
  const isAdmin =
    role === "DOI" ||
    role === "COLLEGE_ADMIN" ||
    role === "CHAIRMAN_ADMIN";
  const canViewRepository = isAdmin || role === "INSTRUCTOR" || role === "STUDENT";
  if (!canViewRepository) throw new Error("Unauthorized");
  // Only Chairman adds; College Admin and DOI view-only
  const canAddRepository = role === "CHAIRMAN_ADMIN";

  const { programs, sections, faculty, subjects, rooms } = await getRepositoryData();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 text-xs">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Central Schedule & Room Repository
        </h1>
        <p className="text-xs text-slate-400">
          Overview of programs, sections, faculty, subjects, and rooms. Server Actions
          can be extended here for full CRUD operations.
        </p>
      </div>
      <section className="glass-panel rounded-2xl px-4 py-4">
        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Programs</h2>
          {canAddRepository && (
            <form
              action={async (formData: FormData) => {
                "use server";
                const s = await auth();
                if (!s?.user) throw new Error("Unauthorized");
                const role = (s.user as any).role as string | undefined;
                const canAdd =
                  role === "CHAIRMAN_ADMIN" || role === "COLLEGE_ADMIN";
                if (!canAdd) throw new Error("Forbidden");
                const code = formData.get("code")?.toString() ?? "";
                const name = formData.get("name")?.toString() ?? "";
                const collegeCode = formData.get("collegeCode")?.toString() ?? "";
                if (!code || !name || !collegeCode) return;
                const college = await prisma.college.findUnique({
                  where: { code: collegeCode }
                });
                if (!college) return;
                const p = await prisma.program.create({
                  data: { code, name, collegeId: college.id }
                });
                await logAudit((s.user as any).id, "Program", p.id, "CREATE", `${code} – ${name}`);
                revalidatePath("/dashboard/repository");
              }}
              className="flex flex-wrap items-center gap-2 text-[11px]"
            >
              <input
                name="code"
                placeholder="Code (e.g. BSIT)"
                className="h-7 w-24 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <input
                name="name"
                placeholder="Program name"
                className="h-7 w-40 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <input
                name="collegeCode"
                placeholder="College (e.g. COTE)"
                className="h-7 w-24 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <Button size="sm" variant="outline" className="h-7 px-3 text-[11px]">
                Add Major
              </Button>
            </form>
          )}
        </div>
        <RepositoryProgramsSearch items={programs} />
      </section>

      <section className="glass-panel rounded-2xl px-4 py-4">
        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Sections</h2>
          {canAddRepository && programs.length > 0 && (
            <form
              action={async (formData: FormData) => {
                "use server";
                const s = await auth();
                if (!s?.user) throw new Error("Unauthorized");
                const role = (s.user as any).role as string | undefined;
                const canAdd =
                  role === "CHAIRMAN_ADMIN" || role === "COLLEGE_ADMIN";
                if (!canAdd) throw new Error("Forbidden");

                const programId = formData.get("programId")?.toString() ?? "";
                const name = formData.get("name")?.toString() ?? "";
                const yearLevelStr = formData.get("yearLevel")?.toString() ?? "1";
                const studentCountStr =
                  formData.get("studentCount")?.toString() ?? "40";

                const yearLevel = parseInt(yearLevelStr, 10) || 1;
                const studentCount = parseInt(studentCountStr, 10) || 40;

                if (!programId || !name) return;

                const sec = await prisma.section.create({
                  data: {
                    programId,
                    name,
                    yearLevel,
                    studentCount
                  }
                });
                await logAudit((s.user as any).id, "Section", sec.id, "CREATE", `${name} (Year ${yearLevel})`);
                revalidatePath("/dashboard/repository");
              }}
              className="flex flex-wrap items-center gap-2 text-[11px]"
            >
              <select
                name="programId"
                className="h-7 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
                defaultValue={programs[0].id}
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
              <input
                name="name"
                placeholder="Section (e.g. 3A)"
                className="h-7 w-20 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <input
                name="yearLevel"
                placeholder="Year"
                className="h-7 w-16 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <input
                name="studentCount"
                placeholder="Students"
                className="h-7 w-20 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <Button size="sm" variant="outline" className="h-7 px-3 text-[11px]">
                Add Section
              </Button>
            </form>
          )}
        </div>
        <RepositorySectionsSearch items={sections} />
      </section>

      <section className="glass-panel rounded-2xl px-4 py-4">
        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Faculty</h2>
          {canAddRepository && (
            <form
              action={async (formData: FormData) => {
                "use server";
                const s = await auth();
                if (!s?.user) throw new Error("Unauthorized");
                const role = (s.user as any).role as string | undefined;
                const canAdd =
                  role === "CHAIRMAN_ADMIN" || role === "COLLEGE_ADMIN";
                if (!canAdd) throw new Error("Forbidden");
                const name = formData.get("name")?.toString() ?? "";
                const email = formData.get("email")?.toString() ?? "";
                const bsDegree = formData.get("bsDegree")?.toString() ?? "";
                const status = formData.get("status")?.toString() || "FULLTIME";
                if (!name || !email || !bsDegree) return;
                const existingUser = await prisma.user.findUnique({
                  where: { email }
                });
                let userId: string;
                if (existingUser) {
                  userId = existingUser.id;
                } else {
                  const bcrypt = await import("bcryptjs");
                  const passwordHash = await bcrypt.hash("password", 10);
                  const user = await prisma.user.create({
                    data: {
                      name,
                      email,
                      role: "INSTRUCTOR",
                      passwordHash
                    }
                  });
                  userId = user.id;
                  await logAudit(
                    (s.user as any).id,
                    "User",
                    user.id,
                    "CREATE_FACULTY",
                    `${name} (${email})`
                  );
                }

                const existingProfile = await prisma.facultyProfile.findFirst({
                  where: { userId }
                });
                if (!existingProfile) {
                  await prisma.facultyProfile.create({
                    data: {
                      userId,
                      fullName: name,
                      bsDegree,
                      msDegree: null,
                      status,
                      designation: null,
                      rank: "INSTRUCTOR_I",
                      hourlyRate: 200
                    }
                  });
                }
                revalidatePath("/dashboard/repository");
              }}
              className="flex flex-wrap items-center gap-2 text-[11px]"
            >
              <input
                name="name"
                placeholder="Full name"
                className="h-7 w-32 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <input
                name="email"
                placeholder="Email"
                className="h-7 w-40 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <input
                name="bsDegree"
                placeholder="BS degree"
                className="h-7 w-36 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <select
                name="status"
                className="h-7 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
                defaultValue="FULLTIME"
              >
                <option value="FULLTIME">Full-time</option>
                <option value="PARTTIME">Part-time</option>
              </select>
              <Button size="sm" variant="outline" className="h-7 px-3 text-[11px]">
                Add Faculty
              </Button>
            </form>
          )}
        </div>
        <RepositoryFacultySearch items={faculty} />
      </section>

      <section className="glass-panel rounded-2xl px-4 py-4">
        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Subjects</h2>
          {canAddRepository && (
            <form
              action={async (formData: FormData) => {
                "use server";
                const s = await auth();
                if (!s?.user) throw new Error("Unauthorized");
                const role = (s.user as any).role as string | undefined;
                const canAdd =
                  role === "CHAIRMAN_ADMIN" || role === "COLLEGE_ADMIN";
                if (!canAdd) throw new Error("Forbidden");
                const code = formData.get("code")?.toString() ?? "";
                const title = formData.get("title")?.toString() ?? "";
                const typeVal = formData.get("type")?.toString() || "DEPARTMENTAL";
                const type = typeVal === "GEC" ? "GEC" : "DEPARTMENTAL";
                if (!code || !title) return;
                const subj = await prisma.subject.create({
                  data: {
                    code,
                    title,
                    units: 3,
                    lecHours: 3,
                    labHours: 0,
                    totalHours: 3,
                    type,
                    category: type === "GEC" ? "GEC" : "DEPARTMENTAL",
                    college: null,
                    prerequisite: null
                  }
                });
                await logAudit((s.user as any).id, "Subject", subj.id, "CREATE", `${code} – ${title}`);
                revalidatePath("/dashboard/repository");
              }}
              className="flex flex-wrap items-center gap-2 text-[11px]"
            >
              <input
                name="code"
                placeholder="Code (e.g. DTECH 122)"
                className="h-7 w-32 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <input
                name="title"
                placeholder="Title"
                className="h-7 w-40 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <select
                name="type"
                className="h-7 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
                defaultValue="DEPARTMENTAL"
              >
                <option value="DEPARTMENTAL">Departmental</option>
                <option value="GEC">GEC</option>
              </select>
              <Button size="sm" variant="outline" className="h-7 px-3 text-[11px]">
                Add Subject
              </Button>
            </form>
          )}
        </div>
        <RepositorySubjectsSearch items={subjects} />
      </section>

      <section className="glass-panel rounded-2xl px-4 py-4">
        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Rooms</h2>
          {canAddRepository && (
            <form
              action={async (formData: FormData) => {
                "use server";
                const s = await auth();
                if (!s?.user) throw new Error("Unauthorized");
                const role = (s.user as any).role as string | undefined;
                const canAdd =
                  role === "CHAIRMAN_ADMIN" || role === "COLLEGE_ADMIN";
                if (!canAdd) throw new Error("Forbidden");

                const code = formData.get("code")?.toString() ?? "";
                const building = formData.get("building")?.toString() ?? "";
                const floorStr = formData.get("floor")?.toString() ?? "1";
                const capacityStr = formData.get("capacity")?.toString() ?? "40";
                const typeVal = formData.get("type")?.toString() || "LECTURE";
                const roomType: RoomType = typeVal === "LAB" ? "LAB" : "LECTURE";

                const floor = parseInt(floorStr, 10) || 1;
                const capacity = parseInt(capacityStr, 10) || 40;

                if (!code || !building) return;

                const room = await prisma.room.create({
                  data: {
                    code,
                    building,
                    floor,
                    capacity,
                    type: roomType
                  }
                });
                await logAudit((s.user as any).id, "Room", room.id, "CREATE", `${code} – ${building}`);
                revalidatePath("/dashboard/repository");
              }}
              className="flex flex-wrap items-center gap-2 text-[11px]"
            >
              <input
                name="code"
                placeholder="Code (e.g. DT Lab1)"
                className="h-7 w-28 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <input
                name="building"
                placeholder="Building"
                className="h-7 w-24 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <input
                name="floor"
                placeholder="Floor"
                className="h-7 w-16 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <input
                name="capacity"
                placeholder="Capacity"
                className="h-7 w-20 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
              />
              <select
                name="type"
                className="h-7 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
                defaultValue="LECTURE"
              >
                <option value="LECTURE">Lecture</option>
                <option value="LAB">Lab</option>
              </select>
              <Button size="sm" variant="outline" className="h-7 px-3 text-[11px]">
                Add Room
              </Button>
            </form>
          )}
        </div>
        <RepositoryRoomsSearch items={rooms} />
      </section>
    </div>
  );
}

