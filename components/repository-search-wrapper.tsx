"use client";

import { useState, useMemo } from "react";

export function RepositorySearchWrapper({
  items,
  children,
  getSearchText,
  placeholder = "Filter…"
}: {
  items: { id: string }[];
  children: (filtered: typeof items) => React.ReactNode;
  getSearchText: (item: (typeof items)[0]) => string;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const lower = q.toLowerCase().trim();
    return items.filter((item) => getSearchText(item).toLowerCase().includes(lower));
  }, [items, q, getSearchText]);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="h-7 w-full max-w-[220px] rounded-md border border-slate-700 bg-slate-900 px-2 text-[11px] text-slate-200 placeholder:text-slate-500 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
      />
      {children(filtered)}
    </div>
  );
}
