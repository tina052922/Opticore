"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RoomQrButton } from "@/components/room-locator/room-qr";

const CampusMap = dynamic(() => import("@/components/room-locator/campus-map"), {
  ssr: false
});

export default function RoomLocatorPage() {
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get("room") ?? "";
  const [roomQuery, setRoomQuery] = useState(initialRoom);

  const locatorUrl = useMemo(
    () =>
      `${typeof window !== "undefined" ? window.location.origin : ""}/room-locator?room=${encodeURIComponent(
        roomQuery || "DT Lab1"
      )}`,
    [roomQuery]
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-4 px-4 py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Room Locator & Campus Navigation
            </h1>
            <p className="text-xs text-slate-300">
              Public, QR-ready page. Works offline with a static campus map.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              value={roomQuery}
              onChange={e => setRoomQuery(e.target.value)}
              placeholder="Search room e.g. DT Lab1"
              className="h-9 min-w-[180px] rounded-md border border-white/10 bg-slate-900/60 px-3 text-xs outline-none ring-0 placeholder:text-slate-500 focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (roomQuery) {
                  navigator.clipboard
                    .writeText(locatorUrl)
                    .catch(() => undefined);
                }
              }}
            >
              Copy QR URL
            </Button>
          </div>
        </div>
        <CampusMap roomQuery={roomQuery} />
        {roomQuery && (
          <div className="mt-4">
            <RoomQrButton roomCode={roomQuery} />
          </div>
        )}
      </div>
    </div>
  );
}
