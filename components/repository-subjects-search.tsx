"use client";

import { RepositorySearchWrapper } from "@/components/repository-search-wrapper";

type Subject = {
  id: string;
  code: string;
  title: string;
  units: number;
  lecHours: number;
  labHours: number;
  type: string;
  college: string | null;
};

export function RepositorySubjectsSearch({ items }: { items: Subject[] }) {
  return (
    <RepositorySearchWrapper
      items={items}
      getSearchText={(s) => `${s.code} ${s.title} ${s.type} ${s.college ?? ""}`}
      placeholder="Search subjects…"
    >
      {(filtered) => (
        <div className="grid gap-2 md:grid-cols-2">
          {filtered.map((subj) => (
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
          {filtered.length === 0 && (
            <p className="text-[11px] text-slate-400">No subjects match.</p>
          )}
        </div>
      )}
    </RepositorySearchWrapper>
  );
}

