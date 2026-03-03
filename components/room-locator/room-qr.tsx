"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Props = {
  roomCode: string;
};

export function RoomQrButton({ roomCode }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const url = `${origin}/room-locator?room=${encodeURIComponent(roomCode)}`;
    const svg = await QRCode.toDataURL(url, { margin: 1, width: 220 });
    setDataUrl(svg);
  };

  return (
    <div className="flex flex-col items-start gap-2 text-xs">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleGenerate}
      >
        Generate QR for {roomCode}
      </Button>
      {dataUrl && (
        <div className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 p-3">
          <Image
            src={dataUrl}
            alt={`QR for ${roomCode}`}
            width={160}
            height={160}
            unoptimized
            className="h-40 w-40"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Scan to open Room Locator with this room pre-filled.
          </p>
        </div>
      )}
    </div>
  );
}

