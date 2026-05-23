"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ConflictItem = {
  type: string;
  entryAId: string;
  entryBId: string;
  day: string;
  description: string;
  solutions?: { day?: string; startTime?: string; endTime?: string; roomId?: string; label: string }[];
};

export function ConflictEvaluator({
  canApply,
  scopeLabel = "campus"
}: {
  canApply: boolean;
  scopeLabel?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [checked, setChecked] = useState(false);
  const [editId, setEditId] = useState("");
  const [editDay, setEditDay] = useState("MONDAY");
  const [editStart, setEditStart] = useState("08:00");
  const [editEnd, setEditEnd] = useState("09:00");

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/schedule/campus-conflicts?scope=campus");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Conflict check failed");
        return;
      }
      setConflicts(data.conflicts ?? []);
      setChecked(true);
      if ((data.conflicts ?? []).length === 0) {
        toast.success(`No conflicts detected (${data.scope ?? scopeLabel}).`);
      } else {
        toast.warning(`${data.conflictCount} conflict(s) found.`);
      }
    } catch {
      toast.error("Failed to run conflict check");
    } finally {
      setLoading(false);
    }
  };

  const applySolution = async (
    entryId: string,
    solution: NonNullable<ConflictItem["solutions"]>[0]
  ) => {
    if (!canApply) {
      toast.error("Only College Admin or DOI can apply solutions.");
      return;
    }
    try {
      const res = await fetch("/api/schedule/apply-solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          day: solution.day,
          startTime: solution.startTime,
          endTime: solution.endTime,
          roomId: solution.roomId
        })
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Could not apply solution");
        return;
      }
      toast.success("Solution applied");
      runCheck();
    } catch {
      toast.error("Failed to apply solution");
    }
  };

  const manualSave = async () => {
    if (!editId.trim()) {
      toast.error("Enter schedule entry ID");
      return;
    }
    try {
      const res = await fetch("/api/schedule/manual-edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: editId.trim(),
          day: editDay,
          startTime: editStart,
          endTime: editEnd
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Manual edit failed");
        return;
      }
      toast.success(
        data.remainingConflicts === 0
          ? "Updated — no conflicts remain in scope"
          : `Updated — ${data.remainingConflicts} conflict(s) still in scope`
      );
      runCheck();
    } catch {
      toast.error("Manual edit failed");
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 text-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Conflict Evaluator ({scopeLabel})
        </h2>
        <Button size="sm" onClick={runCheck} disabled={loading}>
          {loading ? "Checking…" : "Run Conflict Check"}
        </Button>
      </div>

      {checked && conflicts.length === 0 && (
        <p className="text-emerald-300">No conflicts detected.</p>
      )}

      {conflicts.length > 0 && (
        <ul className="max-h-64 space-y-2 overflow-auto">
          {conflicts.map((c, i) => (
            <li key={i} className="rounded-lg border border-red-900/50 bg-red-950/30 p-2">
              <p className="font-medium text-red-200">{c.description}</p>
              <p className="text-[10px] text-slate-400">
                {c.day} · entries {c.entryAId} / {c.entryBId}
              </p>
              {c.solutions && c.solutions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.solutions.map((s, j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => applySolution(c.entryAId, s)}
                      className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-brand-teal hover:bg-slate-700"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-slate-800 pt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">
          Manual edit (time / day / room)
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={editId}
            onChange={(e) => setEditId(e.target.value)}
            placeholder="Entry ID (or draft-...)"
            className="h-8 min-w-[140px] flex-1 rounded border border-slate-700 bg-slate-900 px-2 text-[11px]"
          />
          <select
            value={editDay}
            onChange={(e) => setEditDay(e.target.value)}
            className="h-8 rounded border border-slate-700 bg-slate-900 px-2 text-[11px]"
          >
            {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].map(
              (d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              )
            )}
          </select>
          <input
            value={editStart}
            onChange={(e) => setEditStart(e.target.value)}
            placeholder="08:00"
            className="h-8 w-20 rounded border border-slate-700 bg-slate-900 px-2 text-[11px]"
          />
          <input
            value={editEnd}
            onChange={(e) => setEditEnd(e.target.value)}
            placeholder="09:00"
            className="h-8 w-20 rounded border border-slate-700 bg-slate-900 px-2 text-[11px]"
          />
          <Button size="sm" variant="outline" onClick={manualSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
