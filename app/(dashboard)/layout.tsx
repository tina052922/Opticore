import { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/auth.config";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserBar } from "@/components/layout/user-bar";

const ROLE_LABELS: Record<string, string> = {
  DOI: "Dean of Instructions",
  COLLEGE_ADMIN: "College Admin",
  CHAIRMAN_ADMIN: "Chairman Admin",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
  VISITOR: "Visitor"
};

const ADMIN_ROLES = new Set(["DOI", "COLLEGE_ADMIN", "CHAIRMAN_ADMIN"]);

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as keyof typeof ROLE_LABELS | undefined;
  const roleLabel = role ? ROLE_LABELS[role] : undefined;
  const isAdmin = role ? ADMIN_ROLES.has(role) : false;
  const isFaculty = role === "INSTRUCTOR";
  const isStudent = role === "STUDENT";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950">
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950/80 px-4 py-5 text-sm text-slate-200 lg:flex">
        <p className="mb-4 text-[11px] font-semibold tracking-[0.2em] text-slate-500">
          NAVIGATION
        </p>
        <nav className="flex flex-1 flex-col gap-1">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
          >
            Campus Intelligence
          </Link>
          {isStudent && (
            <Link
              href="/dashboard/student-schedule"
              className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
            >
              My Schedule
            </Link>
          )}
          {(isAdmin || isFaculty) && (
            <>
              <Link
                href="/dashboard/schedules"
                className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
              >
                Schedule View
              </Link>
              <Link
                href="/dashboard/timetabling"
                className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
              >
                Timetabling & Optimization
              </Link>
              <Link
                href="/dashboard/timetabling/ai-scheduler"
                className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
              >
                AI Schedule Generator
              </Link>
            </>
          )}
          {role === "CHAIRMAN_ADMIN" && (
            <>
              <Link
                href="/dashboard/offerings"
                className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
              >
                Subject Offerings
              </Link>
              <Link
                href="/dashboard/scheduling"
                className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
              >
                Schedule Drafting
              </Link>
              <Link
                href="/dashboard/teaching-load"
                className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
              >
                Teaching Load
              </Link>
            </>
          )}
          {role === "COLLEGE_ADMIN" && (
            <>
              <Link
                href="/dashboard/drafts"
                className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
              >
                Schedule Drafts
              </Link>
              <Link
                href="/dashboard/cross-college"
                className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
              >
                Cross-College Coordination
              </Link>
              <Link
                href="/dashboard/change-requests"
                className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
              >
                Change Requests
              </Link>
            </>
          )}
          {role === "DOI" && (
            <Link
              href="/dashboard/approvals"
              className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
            >
              Approval Queue
            </Link>
          )}
          {isFaculty && (
            <Link
              href="/dashboard/my-schedule"
              className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
            >
              My Schedule & Requests
            </Link>
          )}
          {(isAdmin || isFaculty || isStudent) && (
            <Link
              href="/dashboard/repository"
              className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
            >
              Central Repository
            </Link>
          )}
          {(isAdmin || isFaculty || isStudent) && (
            <Link
              href="/dashboard/reports"
              className="rounded-md px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
            >
              Reports & Exports
            </Link>
          )}
        </nav>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-[11px]">
          <p className="font-semibold">Signed in as</p>
          <p className="truncate text-slate-300">{session.user.email}</p>
          {roleLabel && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {roleLabel}
            </p>
          )}
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-xs text-slate-200">
          <p className="font-medium">
            OptiCore – Smart Campus Intelligence
            {roleLabel && (
              <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand-teal">
                {roleLabel} view
              </span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/room-locator">Public Room Locator</Link>
            </Button>
            <UserBar email={session.user.email ?? ""} roleLabel={roleLabel} />
          </div>
        </header>
        <main className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-3 py-4 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

