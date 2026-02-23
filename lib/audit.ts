import { prisma } from "@/lib/prisma";
import { emitAuditSocketEvent } from "@/lib/audit-socket";

export async function logAudit(
  userId: string,
  entity: string,
  entityId: string,
  action: string,
  details?: string
) {
  const log = await prisma.auditLog.create({
    data: {
      userId,
      entity,
      entityId,
      action,
      details
    }
  });

  // Best-effort socket broadcast (non-blocking)
  emitAuditSocketEvent({
    id: log.id,
    userId,
    entity,
    entityId,
    action,
    details,
    createdAt: log.createdAt
  });
}


