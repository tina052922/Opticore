"use client";

import { RepositorySearchWrapper } from "@/components/repository-search-wrapper";

type Room = {
  id: string;
  code: string;
  building: string;
  floor: number;
  capacity: number;
  type: string;
};

export function RepositoryRoomsSearch({ items }: { items: Room[] }) {
  return (
    <RepositorySearchWrapper
      items={items}
      getSearchText={(r) => `${r.code} ${r.building} ${r.type}`}
      placeholder="Search rooms…"
    >
      {(filtered) => (
        <div className="grid gap-2 md:grid-cols-2">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-md bg-slate-900/60 px-3 py-2">
              <p className="font-medium text-slate-100">
                {r.code} · <span className="text-slate-300">{r.building}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Floor {r.floor} · Capacity {r.capacity} · {r.type}
              </p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-[11px] text-slate-400">No rooms match.</p>
          )}
        </div>
      )}
    </RepositorySearchWrapper>
  );
}

