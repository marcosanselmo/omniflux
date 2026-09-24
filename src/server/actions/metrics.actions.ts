'use server';

import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ActionResponse } from '@/types/auth';
import { GlobalRole, TicketStatus } from '@prisma/client';

// ==============================================================================
// OMNIFLUX - MÉTRICAS GLOBAIS E RELATÓRIOS DE CONFORMIDADE (SINGLE-TENANT)
// ==============================================================================

export interface SectorMetric {
  sectorId: string;
  sectorName: string;
  isFinancial: boolean;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  reworkCount: number;
  reworkRate: number;
  totalFinancialAmount: number;
  avgResolutionHours: number;
}

export interface UserProductivityMetric {
  userId: string;
  userName: string;
  userEmail: string;
  executedCount: number;
  homologatedApprovedCount: number;
  homologatedRejectedCount: number;
}

export interface GlobalMetricsPayload {
  totalTickets: number;
  totalClosed: number;
  totalInExecution: number;
  totalAwaitingHomologation: number;
  totalReworked: number;
  globalReworkRate: number;
  avgResolutionTimeHours: number;
  totalFinancialVolume: number;
  sectorMetrics: SectorMetric[];
  userProductivity: UserProductivityMetric[];
}

/**
 * Coleta todas as métricas analíticas e de conformidade do sistema
 */
export async function getGlobalMetricsAction(): Promise<
  ActionResponse<GlobalMetricsPayload>
> {
  try {
    const session = await requireAuth();
    if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
      return {
        success: false,
        error: 'Acesso negado: Relatórios restritos ao Administrador Geral.',
      };
    }

    // 1. Busca tickets com dados necessários
    const [tickets, histories, sectors, users] = await Promise.all([
      prisma.ticket.findMany({
        select: {
          id: true,
          status: true,
          sectorId: true,
          executorId: true,
          amount: true,
          createdAt: true,
          closedAt: true,
        },
      }),
      prisma.ticketHistory.findMany({
        select: {
          ticketId: true,
          userId: true,
          fromStatus: true,
          toStatus: true,
          createdAt: true,
        },
      }),
      prisma.sector.findMany({
        select: {
          id: true,
          name: true,
          isFinancial: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
    ]);

    const totalTickets = tickets.length;
    const totalClosed = tickets.filter(
      (t) => t.status === TicketStatus.HOMOLOGADO_FECHADO
    ).length;
    const totalInExecution = tickets.filter(
      (t) => t.status === TicketStatus.EM_ANDAMENTO
    ).length;
    const totalAwaitingHomologation = tickets.filter(
      (t) => t.status === TicketStatus.AGUARDANDO_HOMOLOGACAO
    ).length;

    // Identifica tickets que tiveram retrabalho (RECUSADO_REABERTO)
    const reworkedTicketIds = new Set<string>();
    for (const h of histories) {
      if (h.toStatus === TicketStatus.RECUSADO_REABERTO) {
        reworkedTicketIds.add(h.ticketId);
      }
    }
    const totalReworked = reworkedTicketIds.size;
    const globalReworkRate =
      totalTickets > 0 ? (totalReworked / totalTickets) * 100 : 0;

    // Tempo médio de resolução (MTTR em horas) para tickets fechados
    let totalResolutionHours = 0;
    let closedCountWithDates = 0;
    for (const t of tickets) {
      if (t.status === TicketStatus.HOMOLOGADO_FECHADO && t.closedAt) {
        const diffMs =
          new Date(t.closedAt).getTime() - new Date(t.createdAt).getTime();
        totalResolutionHours += Math.max(0, diffMs / (1000 * 60 * 60));
        closedCountWithDates++;
      }
    }
    const avgResolutionTimeHours =
      closedCountWithDates > 0
        ? totalResolutionHours / closedCountWithDates
        : 0;

    // Volume financeiro tramitado
    let totalFinancialVolume = 0;
    for (const t of tickets) {
      if (t.amount) {
        totalFinancialVolume += Number(t.amount);
      }
    }

    // Métricas por Setor
    const sectorMetrics: SectorMetric[] = sectors.map((sec) => {
      const secTickets = tickets.filter((t) => t.sectorId === sec.id);
      const secTotal = secTickets.length;
      const secClosed = secTickets.filter(
        (t) => t.status === TicketStatus.HOMOLOGADO_FECHADO
      ).length;
      const secOpen = secTickets.filter(
        (t) => t.status !== TicketStatus.HOMOLOGADO_FECHADO
      ).length;

      let secReworkCount = 0;
      let secFinancialSum = 0;
      let secResolutionHours = 0;
      let secClosedWithDates = 0;

      for (const t of secTickets) {
        if (reworkedTicketIds.has(t.id)) {
          secReworkCount++;
        }
        if (t.amount) {
          secFinancialSum += Number(t.amount);
        }
        if (t.status === TicketStatus.HOMOLOGADO_FECHADO && t.closedAt) {
          const diffMs =
            new Date(t.closedAt).getTime() - new Date(t.createdAt).getTime();
          secResolutionHours += Math.max(0, diffMs / (1000 * 60 * 60));
          secClosedWithDates++;
        }
      }

      return {
        sectorId: sec.id,
        sectorName: sec.name,
        isFinancial: sec.isFinancial,
        totalTickets: secTotal,
        openTickets: secOpen,
        closedTickets: secClosed,
        reworkCount: secReworkCount,
        reworkRate: secTotal > 0 ? (secReworkCount / secTotal) * 100 : 0,
        totalFinancialAmount: secFinancialSum,
        avgResolutionHours:
          secClosedWithDates > 0
            ? secResolutionHours / secClosedWithDates
            : 0,
      };
    });

    // Produtividade por Usuário
    const userProductivityMap = new Map<
      string,
      {
        userId: string;
        userName: string;
        userEmail: string;
        executedCount: number;
        homologatedApprovedCount: number;
        homologatedRejectedCount: number;
      }
    >();

    for (const u of users) {
      userProductivityMap.set(u.id, {
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
        executedCount: 0,
        homologatedApprovedCount: 0,
        homologatedRejectedCount: 0,
      });
    }

    for (const t of tickets) {
      if (t.executorId && userProductivityMap.has(t.executorId)) {
        userProductivityMap.get(t.executorId)!.executedCount++;
      }
    }

    for (const h of histories) {
      if (h.toStatus === TicketStatus.HOMOLOGADO_FECHADO) {
        const u = userProductivityMap.get(h.userId);
        if (u) u.homologatedApprovedCount++;
      } else if (h.toStatus === TicketStatus.RECUSADO_REABERTO) {
        const u = userProductivityMap.get(h.userId);
        if (u) u.homologatedRejectedCount++;
      }
    }

    const userProductivity = Array.from(userProductivityMap.values())
      .filter(
        (u) =>
          u.executedCount > 0 ||
          u.homologatedApprovedCount > 0 ||
          u.homologatedRejectedCount > 0
      )
      .sort((a, b) => b.executedCount + b.homologatedApprovedCount - (a.executedCount + a.homologatedApprovedCount));

    return {
      success: true,
      data: {
        totalTickets,
        totalClosed,
        totalInExecution,
        totalAwaitingHomologation,
        totalReworked,
        globalReworkRate: parseFloat(globalReworkRate.toFixed(1)),
        avgResolutionTimeHours: parseFloat(avgResolutionTimeHours.toFixed(1)),
        totalFinancialVolume,
        sectorMetrics,
        userProductivity,
      },
    };
  } catch (error) {
    console.error('[getGlobalMetricsAction] Erro:', error);
    return {
      success: false,
      error: 'Falha ao processar métricas globais e relatórios.',
    };
  }
}
