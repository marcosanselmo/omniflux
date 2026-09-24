'use server';

import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ActionResponse } from '@/types/auth';
import { GlobalRole, TicketStatus, Prisma } from '@prisma/client';

// ==============================================================================
// OMNIFLUX - AUDITORIA GLOBAL E GOVERNANÇA (SINGLE-TENANT)
// ==============================================================================

export interface AuditLogFilter {
  page?: number;
  pageSize?: number;
  sectorId?: string;
  userId?: string;
  status?: TicketStatus;
  onlyRejected?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogItem {
  id: string;
  ticketId: string;
  ticketNumber: number;
  ticketTitle: string;
  sectorId: string;
  sectorName: string;
  userId: string;
  userName: string;
  userEmail: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus;
  reason: string | null;
  comment: string | null;
  createdAt: Date;
}

export interface PaginatedAuditLogs {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Consulta a trilha imutável de auditoria global (Restrito a ADMIN_GERAL)
 */
export async function getGlobalAuditLogsAction(
  filter: AuditLogFilter = {}
): Promise<ActionResponse<PaginatedAuditLogs>> {
  try {
    const session = await requireAuth();
    if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
      return {
        success: false,
        error: 'Acesso negado: Auditoria restrita ao Administrador Geral.',
      };
    }

    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(5, filter.pageSize ?? 15));
    const skip = (page - 1) * pageSize;

    const where: Prisma.TicketHistoryWhereInput = {};

    if (filter.onlyRejected) {
      where.toStatus = TicketStatus.RECUSADO_REABERTO;
    } else if (filter.status) {
      where.toStatus = filter.status;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.sectorId) {
      where.ticket = { sectorId: filter.sectorId };
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        // Ajusta para o final do dia
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (filter.search && filter.search.trim()) {
      const term = filter.search.trim();
      const numTerm = parseInt(term.replace('#TK-', '').replace('#', ''), 10);

      where.OR = [
        { comment: { contains: term, mode: 'insensitive' } },
        { reason: { contains: term, mode: 'insensitive' } },
        { ticket: { title: { contains: term, mode: 'insensitive' } } },
        ...(!isNaN(numTerm) ? [{ ticket: { ticketNumber: numTerm } }] : []),
      ];
    }

    const [total, histories] = await Promise.all([
      prisma.ticketHistory.count({ where }),
      prisma.ticketHistory.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              title: true,
              sector: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    const items: AuditLogItem[] = histories.map((h) => ({
      id: h.id,
      ticketId: h.ticket.id,
      ticketNumber: h.ticket.ticketNumber,
      ticketTitle: h.ticket.title,
      sectorId: h.ticket.sector.id,
      sectorName: h.ticket.sector.name,
      userId: h.user.id,
      userName: h.user.name,
      userEmail: h.user.email,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      reason: h.reason,
      comment: h.comment,
      createdAt: h.createdAt,
    }));

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error('[getGlobalAuditLogsAction] Erro:', error);
    return {
      success: false,
      error: 'Falha ao recuperar logs de auditoria global.',
    };
  }
}

/**
 * Exporta registros de auditoria para fins de compliance regulatório
 */
export async function exportAuditLogsAction(
  filter: AuditLogFilter = {}
): Promise<ActionResponse<{ csv: string; json: string }>> {
  try {
    const session = await requireAuth();
    if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
      return {
        success: false,
        error: 'Acesso negado: Exportação restrita ao Administrador Geral.',
      };
    }

    const where: Prisma.TicketHistoryWhereInput = {};
    if (filter.onlyRejected) {
      where.toStatus = TicketStatus.RECUSADO_REABERTO;
    } else if (filter.status) {
      where.toStatus = filter.status;
    }

    if (filter.sectorId) {
      where.ticket = { sectorId: filter.sectorId };
    }

    const logs = await prisma.ticketHistory.findMany({
      where,
      take: 2000,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        ticket: {
          select: {
            ticketNumber: true,
            title: true,
            sector: { select: { name: true } },
          },
        },
      },
    });

    // Gera CSV
    const headers = [
      'Data/Hora',
      'Protocolo',
      'Título do Chamado',
      'Setor',
      'Usuário Responsável',
      'E-mail',
      'Status Anterior',
      'Novo Status',
      'Justificativa de Recusa',
      'Parecer/Comentário',
    ];

    const escapeCsv = (val: string | null | undefined) => {
      if (!val) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const csvRows = logs.map((l) => [
      l.createdAt.toISOString(),
      `#TK-${String(l.ticket.ticketNumber).padStart(4, '0')}`,
      escapeCsv(l.ticket.title),
      escapeCsv(l.ticket.sector.name),
      escapeCsv(l.user.name),
      escapeCsv(l.user.email),
      l.fromStatus ?? 'CRIACAO',
      l.toStatus,
      escapeCsv(l.reason),
      escapeCsv(l.comment),
    ]);

    const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const json = JSON.stringify(logs, null, 2);

    return {
      success: true,
      data: { csv, json },
    };
  } catch (error) {
    console.error('[exportAuditLogsAction] Erro:', error);
    return {
      success: false,
      error: 'Falha ao exportar logs de auditoria.',
    };
  }
}
