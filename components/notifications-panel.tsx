"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function NotificationsPanel() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setItems(data.notifications ?? []);
        }
      } catch {
        setItems([]);
      }
    };
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  const unread = items.filter((n) => !n.read);
  if (unread.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-brand-teal/30 bg-brand-teal/5 px-4 py-3 text-xs">
      <p className="mb-2 font-semibold text-brand-teal">
        Notifications ({unread.length})
      </p>
      <ul className="max-h-32 space-y-1 overflow-auto text-slate-300">
        {unread.slice(0, 5).map((n) => (
          <li key={n.id}>
            <span className="font-medium text-slate-100">{n.title}</span> — {n.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
