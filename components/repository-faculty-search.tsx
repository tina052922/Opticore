"use client";

import { RepositorySearchWrapper } from "@/components/repository-search-wrapper";

type Faculty = {
  id: string;
  fullName: string;
  bsDegree: string;
  msDegree: string | null;
  status: string;
  canTeach: { subject: { code: string } }[];
};

export function RepositoryFacultySearch({ items }: { items: Faculty[] }) {
  return (
    <RepositorySearchWrapper
      items={items}
      getSearchText={(f) =>
        `${f.fullName} ${f.bsDegree} ${f.status} ${f.canTeach
          .map((x) => x.subject.code)
          .join(" ")}`
      }
      placeholder="Search faculty…"
    >
      {(filtered) => (
        <div className="grid gap-2 md:grid-cols-2">
          {filtered.map((f) => (
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
          {filtered.length === 0 && (
            <p className="text-[11px] text-slate-400">No faculty match.</p>
          )}
        </div>
      )}
    </RepositorySearchWrapper>
  );
}

