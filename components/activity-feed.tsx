"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

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

let socket: Socket | null = null;

export function ActivityFeed({ role, collegeId, programId, userId }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!url) return;

    if (!socket) {
      socket = io(url, {
        transports: ["websocket"]
      });
    }

    const handler = (payload: any) => {
      // Simple client-side scoping: everyone sees campus-wide events for now.
      const evt: ActivityEvent = {
        id: payload.id,
        userId: payload.userId,
        entity: payload.entity,
        entityId: payload.entityId,
        action: payload.action,
        details: payload.details ?? null,
        createdAt: payload.createdAt
      };
      setEvents((prev) => [evt, ...prev].slice(0, 20));
    };

    socket.on("audit:event", handler);

    return () => {
      socket?.off("audit:event", handler);
    };
  }, [role, collegeId, programId, userId]);

  if (!events.length) {
    return (
      <div className="text-[11px] text-slate-400">
        Live activity will appear here as changes are made.
      </div>
    );
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
              <p className="text-[11px] text-slate-400 truncate max-w-xs" title={e.details}>
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

