import { Prisma, NotificationType, SectorRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

// ==============================================================================
// OMNIFLUX - SERVIÇO DE NOTIFICAÇÕES INTERNAS (SINGLE-TENANT)
// Governança e auditoria de alertas para transições de chamados
// ==============================================================================

export interface CreateNotificationParams {
  userId: string;
  ticketId?: string;
  type: NotificationType;
  title: string;
  message: string;
}

export interface NotifySectorRolesParams {
  sectorId: string;
  roles: SectorRole[];
  ticketId?: string;
  type: NotificationType;
  title: string;
  message: string;
  excludeUserId?: string;
}

/**
 * Cria uma notificação individual dentro ou fora de uma transação Prisma
 */
export async function createNotification(
  params: CreateNotificationParams,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const db = tx ?? prisma;
  await db.notification.create({
    data: {
      userId: params.userId,
      ticketId: params.ticketId ?? null,
      type: params.type,
      title: params.title,
      message: params.message,
    },
  });
}

/**
 * Dispara notificações para todos os usuários com determinados papéis em um setor
 */
export async function notifyUsersInSector(
  params: NotifySectorRolesParams,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const db = tx ?? prisma;

  // Busca os IDs dos usuários associados aos papéis no setor
  const userSectorRoles = await db.userSectorRole.findMany({
    where: {
      sectorId: params.sectorId,
      role: { in: params.roles },
      ...(params.excludeUserId ? { userId: { not: params.excludeUserId } } : {}),
      user: { isActive: true },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  if (userSectorRoles.length === 0) {
    return;
  }

  // Cria as notificações em lote
  await db.notification.createMany({
    data: userSectorRoles.map((usr) => ({
      userId: usr.userId,
      ticketId: params.ticketId ?? null,
      type: params.type,
      title: params.title,
      message: params.message,
    })),
  });
}
