"use client";

import { RepositorySearchWrapper } from "@/components/repository-search-wrapper";

type Section = {
  id: string;
  name: string;
  yearLevel: number;
  studentCount: number;
  program: { code: string };
};

export function RepositorySectionsSearch({ items }: { items: Section[] }) {
  return (
    <RepositorySearchWrapper
      items={items}
      getSearchText={(s) => `${s.program.code} ${s.name} ${s.yearLevel}`}
      placeholder="Search sections…"
    >
      {(filtered) => (
        <div className="grid gap-2 md:grid-cols-2">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-md bg-slate-900/60 px-3 py-2">
              <p className="font-medium text-slate-100">
                {s.program.code} {s.name} · Year {s.yearLevel}
              </p>
              <p className="text-[11px] text-slate-400">
                Students: {s.studentCount}
              </p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-[11px] text-slate-400">No sections match.</p>
          )}
        </div>
      )}
    </RepositorySearchWrapper>
  );
}

