"use client";

import { useEffect, useState } from "react";

type ActivityEvent = {
  id: string;
  userId: string;
  entity: string;
  entityId: string;
  action: string;
  details?: string | null;
  createdAt: string;
};

type ActivityFeedProps = {
  role: string;
  collegeId?: string | null;
  programId?: string | null;
  userId?: string | null;
};

export function ActivityFeed({ role, collegeId, programId, userId }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/audit/recent");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events ?? []);
        }
      } catch {
        setEvents([]);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [role, collegeId, programId, userId]);

  if (!events.length) {
    return <div className="text-[11px] text-slate-400">No recent activity.</div>;
  }

  return (
    <div className="space-y-1 text-[11px] text-slate-200">
      {events.map((e) => (
        <div
          key={e.id}
          className="flex items-start justify-between rounded-md bg-slate-900/50 px-2 py-1"
        >
          <div className="pr-2">
            <p className="font-semibold text-slate-100">
              {e.action} <span className="text-slate-400">· {e.entity}</span>
            </p>
            {e.details && (
              <p className="max-w-xs truncate text-[11px] text-slate-400" title={e.details}>
                {e.details}
              </p>
            )}
          </div>
          <span className="ml-2 text-[10px] text-slate-500">
            {new Date(e.createdAt).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}
