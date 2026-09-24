'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ActionResponse } from '@/types/auth';

// ==============================================================================
// OMNIFLUX - SERVER ACTIONS DE NOTIFICAÇÕES (SINGLE-TENANT)
// ==============================================================================

export interface NotificationItem {
  id: string;
  ticketId: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationsPayload {
  notifications: NotificationItem[];
  unreadCount: number;
}

/**
 * Busca as notificações recentes do usuário autenticado e o total não lido
 */
export async function getNotificationsAction(
  limit = 20
): Promise<ActionResponse<NotificationsPayload>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          ticketId: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    };
  } catch (error) {
    console.error('[getNotificationsAction] Erro ao buscar notificações:', error);
    return {
      success: false,
      error: 'Não foi possível carregar as notificações.',
    };
  }
}

/**
 * Marca uma notificação individual como lida
 */
export async function markNotificationAsReadAction(
  notificationId: string
): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[markNotificationAsReadAction] Erro:', error);
    return {
      success: false,
      error: 'Não foi possível atualizar a notificação.',
    };
  }
}

/**
 * Marca todas as notificações pendentes do usuário como lidas
 */
export async function markAllNotificationsAsReadAction(): Promise<
  ActionResponse<void>
> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[markAllNotificationsAsReadAction] Erro:', error);
    return {
      success: false,
      error: 'Não foi possível atualizar as notificações.',
    };
  }
}
