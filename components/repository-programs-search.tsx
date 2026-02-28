"use client";

import { RepositorySearchWrapper } from "@/components/repository-search-wrapper";

type Program = {
  id: string;
  code: string;
  name: string;
  college: { code: string };
};

export function RepositoryProgramsSearch({ items }: { items: Program[] }) {
  return (
    <RepositorySearchWrapper
      items={items}
      getSearchText={(p) => `${p.code} ${p.name} ${p.college.code}`}
      placeholder="Search programs…"
    >
      {(filtered) => (
        <div className="space-y-1">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md bg-slate-900/60 px-3 py-2"
            >
              <p className="font-medium text-slate-100">
                {p.code} · <span className="text-slate-300">{p.name}</span>{" "}
                <span className="text-slate-500">({p.college.code})</span>
              </p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-[11px] text-slate-400">No programs match.</p>
          )}
        </div>
      )}
    </RepositorySearchWrapper>
  );
}

