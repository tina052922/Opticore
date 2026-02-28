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
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) return null;

  if (!socket) {
    socket = io(url, {
      transports: ["websocket"],
      autoConnect: true
    });
  }
  return socket;
}

export function emitAuditSocketEvent(payload: AuditPayload) {
  const s = getSocket();
  if (!s) return;
  s.emit("audit:event", payload);
}

