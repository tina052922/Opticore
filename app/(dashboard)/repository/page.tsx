import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth.config";
import { revalidatePath } from "next/cache";

async function getRepositoryData() {
  const [majors, sections, faculty, subjects, rooms] = await Promise.all([
    prisma.major.findMany(),
    prisma.section.findMany({ include: { major: true } }),
    prisma.facultyProfile.findMany({
      include: { user: true, canTeach: { include: { subject: true } } }
    }),
    prisma.subject.findMany(),
    prisma.room.findMany()
  ]);
  return { majors, sections, faculty, subjects, rooms };
}

export default async function RepositoryPage() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const role = (session.user as any).role as string | undefined;
  const isAdmin =
    role === "SUPERSUPERADMIN" ||
    role === "SUPERADMIN" ||
    role === "DEPTADMIN" ||
    role === "CASADMIN";

  const { majors, sections, faculty, subjects, rooms } = await getRepositoryData();

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
          <h2 className="text-sm font-semibold text-slate-100">Majors / Programs</h2>
          {isAdmin && (
            <form
              action={async (formData: FormData) => {
                "use server";
                const s = await auth();
                if (!s?.user) throw new Error("Unauthorized");
                const role = (s.user as any).role as string | undefined;
                const isAdminAction =
                  role === "SUPERSUPERADMIN" ||
                  role === "SUPERADMIN" ||
                  role === "DEPTADMIN" ||
                  role === "CASADMIN";
                if (!isAdminAction) throw new Error("Forbidden");
                const code = formData.get("code")?.toString() ?? "";
                const name = formData.get("name")?.toString() ?? "";
                if (!code || !name) return;
                await prisma.major.create({ data: { code, name } });
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
              <Button size="sm" variant="outline" className="h-7 px-3 text-[11px]">
                Add Major
              </Button>
            </form>
          )}
        </div>
        <div className="space-y-1">
          {majors.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-md bg-slate-900/60 px-3 py-2">
              <p className="font-medium text-slate-100">
                {m.code} · <span className="text-slate-300">{m.name}</span>
              </p>
            </div>
          ))}
          {majors.length === 0 && (
            <p className="text-[11px] text-slate-400">No majors yet (seed script will populate BSIT/BIT).</p>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-2xl px-4 py-4">
        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Sections</h2>
          {isAdmin && majors.length > 0 && (
            <form
              action={async (formData: FormData) => {
                "use server";
                const s = await auth();
                if (!s?.user) throw new Error("Unauthorized");
                const role = (s.user as any).role as string | undefined;
                const isAdminAction =
                  role === "SUPERSUPERADMIN" ||
                  role === "SUPERADMIN" ||
                  role === "DEPTADMIN" ||
                  role === "CASADMIN";
                if (!isAdminAction) throw new Error("Forbidden");

                const majorId = formData.get("majorId")?.toString() ?? "";
                const name = formData.get("name")?.toString() ?? "";
                const yearLevelStr = formData.get("yearLevel")?.toString() ?? "1";
                const studentCountStr =
                  formData.get("studentCount")?.toString() ?? "40";

                const yearLevel = parseInt(yearLevelStr, 10) || 1;
                const studentCount = parseInt(studentCountStr, 10) || 40;

                if (!majorId || !name) return;

                await prisma.section.create({
                  data: {
                    majorId,
                    name,
                    yearLevel,
                    studentCount
                  }
                });
                revalidatePath("/dashboard/repository");
              }}
              className="flex flex-wrap items-center gap-2 text-[11px]"
            >
              <select
                name="majorId"
                className="h-7 rounded-md border border-slate-800 bg-slate-950/70 px-2 text-[11px] outline-none focus-visible:border-brand-teal focus-visible:ring-1 focus-visible:ring-brand-teal"
                defaultValue={majors[0].id}
              >
                {majors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code}
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
        <div className="grid gap-2 md:grid-cols-2">
          {sections.map((s) => (
            <div key={s.id} className="rounded-md bg-slate-900/60 px-3 py-2">
              <p className="font-medium text-slate-100">
                {s.major.code} {s.name} · Year {s.yearLevel}
              </p>
              <p className="text-[11px] text-slate-400">
                Students: {s.studentCount}
              </p>
            </div>
          ))}
          {sections.length === 0 && (
            <p className="text-[11px] text-slate-400">No sections yet.</p>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-2xl px-4 py-4">
        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Faculty</h2>
          {isAdmin && (
            <form
              action={async (formData: FormData) => {
                "use server";
                const s = await auth();
                if (!s?.user) throw new Error("Unauthorized");
                const role = (s.user as any).role as string | undefined;
                const isAdminAction =
                  role === "SUPERSUPERADMIN" ||
                  role === "SUPERADMIN" ||
                  role === "DEPTADMIN" ||
                  role === "CASADMIN";
                if (!isAdminAction) throw new Error("Forbidden");
                const name = formData.get("name")?.toString() ?? "";
                const email = formData.get("email")?.toString() ?? "";
                const bsDegree = formData.get("bsDegree")?.toString() ?? "";
                const status = formData.get("status")?.toString() || "FULLTIME";
                if (!name || !email || !bsDegree) return;
                const bcrypt = await import("bcryptjs");
                const passwordHash = await bcrypt.hash("password", 10);
                const user = await prisma.user.create({
                  data: {
                    name,
                    email,
                    role: "FACULTY",
                    passwordHash
                  }
                });
                await prisma.facultyProfile.create({
                  data: {
                    userId: user.id,
                    fullName: name,
                    bsDegree,
                    msDegree: null,
                    status,
                    designation: null
                  }
                });
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
        <div className="grid gap-2 md:grid-cols-2">
          {faculty.map((f) => (
            <div key={f.id} className="rounded-md bg-slate-900/60 px-3 py-2">
              <p className="font-medium text-slate-100">{f.fullName}</p>
              <p className="text-[11px] text-slate-400">
                {f.bsDegree}
                {f.msDegree ? ` · ${f.msDegree}` : ""} · {f.status}
              </p>
              {f.canTeach.length > 0 && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Subjects: {f.canTeach.map((x) => x.subject.code).join(", ")}
                </p>
              )}
            </div>
          ))}
          {faculty.length === 0 && (
            <p className="text-[11px] text-slate-400">No faculty records yet.</p>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-2xl px-4 py-4">
        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Subjects</h2>
          {isAdmin && (
            <form
              action={async (formData: FormData) => {
                "use server";
                const s = await auth();
                if (!s?.user) throw new Error("Unauthorized");
                const role = (s.user as any).role as string | undefined;
                const isAdminAction =
                  role === "SUPERSUPERADMIN" ||
                  role === "SUPERADMIN" ||
                  role === "DEPTADMIN" ||
                  role === "CASADMIN";
                if (!isAdminAction) throw new Error("Forbidden");
                const code = formData.get("code")?.toString() ?? "";
                const title = formData.get("title")?.toString() ?? "";
                const type = formData.get("type")?.toString() || "DEPARTMENTAL";
                if (!code || !title) return;
                await prisma.subject.create({
                  data: {
                    code,
                    title,
                    units: 3,
                    lecHours: 3,
                    labHours: 0,
                    type,
                    college: null,
                    prerequisite: null
                  }
                });
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
        <div className="grid gap-2 md:grid-cols-2">
          {subjects.map((subj) => (
            <div key={subj.id} className="rounded-md bg-slate-900/60 px-3 py-2">
              <p className="font-medium text-slate-100">
                {subj.code} · <span className="text-slate-300">{subj.title}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                {subj.units} units · Lec {subj.lecHours}h / Lab {subj.labHours}h ·{" "}
                {subj.type} {subj.college ? `· ${subj.college}` : ""}
              </p>
            </div>
          ))}
          {subjects.length === 0 && (
            <p className="text-[11px] text-slate-400">No subjects yet.</p>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-2xl px-4 py-4">
        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Rooms</h2>
          {isAdmin && (
            <form
              action={async (formData: FormData) => {
                "use server";
                const s = await auth();
                if (!s?.user) throw new Error("Unauthorized");
                const role = (s.user as any).role as string | undefined;
                const isAdminAction =
                  role === "SUPERSUPERADMIN" ||
                  role === "SUPERADMIN" ||
                  role === "DEPTADMIN" ||
                  role === "CASADMIN";
                if (!isAdminAction) throw new Error("Forbidden");

                const code = formData.get("code")?.toString() ?? "";
                const building = formData.get("building")?.toString() ?? "";
                const floorStr = formData.get("floor")?.toString() ?? "1";
                const capacityStr = formData.get("capacity")?.toString() ?? "40";
                const type = formData.get("type")?.toString() || "LECTURE";

                const floor = parseInt(floorStr, 10) || 1;
                const capacity = parseInt(capacityStr, 10) || 40;

                if (!code || !building) return;

                await prisma.room.create({
                  data: {
                    code,
                    building,
                    floor,
                    capacity,
                    type
                  }
                });
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
        <div className="grid gap-2 md:grid-cols-2">
          {rooms.map((r) => (
            <div key={r.id} className="rounded-md bg-slate-900/60 px-3 py-2">
              <p className="font-medium text-slate-100">
                {r.code} · <span className="text-slate-300">{r.building}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Floor {r.floor} · Capacity {r.capacity} · {r.type}
              </p>
            </div>
          ))}
          {rooms.length === 0 && (
            <p className="text-[11px] text-slate-400">No rooms yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

