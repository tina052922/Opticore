import { io, Socket } from "socket.io-client";

type AuditPayload = {
  id: string;
  userId: string;
  entity: string;
  entityId: string;
  action: string;
  details?: string | null;
  createdAt: Date;
};

let socket: Socket | null = null;

function getSocket(): Socket | null {
  // Never try to open a websocket from server code.
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) return null;

  if (!socket) {
    try {
      socket = io(url, {
        transports: ["websocket"],
        timeout: 2000,
        reconnection: false
      });
      socket.on("connect_error", () => {
        try {
          socket?.disconnect();
        } catch {}
        socket = null;
      });
    } catch {
      socket = null;
    }
  }
  return socket;
}

export function emitAuditSocketEvent(payload: AuditPayload) {
  const s = getSocket();
  if (!s) return;
  s.emit("audit:event", payload);
}

