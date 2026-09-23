'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { canCreateTicketInSector } from '@/lib/auth/rbac';
import { validateStateTransition } from '@/server/services/ticket-state-machine';
import { ActionResponse } from '@/types/auth';
import {
  TicketDetail,
  PaginatedTickets,
  TicketListItem,
} from '@/types/ticket';
import {
  createTicketSchema,
  transitionTicketSchema,
  ticketFilterSchema,
  CreateTicketInput,
  TransitionTicketInputSchema,
  TicketFilterInput,
} from '@/lib/validators/ticket';
import {
  TicketStatus,
  GlobalRole,
  SectorRole,
  Prisma,
} from '@prisma/client';

// ==============================================================================
// OMNIFLUX - SERVER ACTIONS DE TICKETS E WORKFLOWS
// Execução atômica (prisma.$transaction) e governança estrita de estados
// ==============================================================================

/**
 * Abertura de um novo chamado no sistema
 */
export async function createTicketAction(
  rawInput: CreateTicketInput
): Promise<ActionResponse<{ id: string; ticketNumber: number }>> {
  try {
    const session = await requireAuth();
    const user = session.user;

    const parsed = createTicketSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Dados do chamado inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { title, description, sectorId, priority, amount, dueDate } =
      parsed.data;

    // 1. Busca o setor de destino
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId },
    });

    if (!sector || !sector.isActive) {
      return {
        success: false,
        error: 'O setor selecionado está inativo ou não existe.',
      };
    }

    // 2. Valida autorização de abertura considerando restrições de setor
    const isAllowedToOpen = canCreateTicketInSector(user, sector);
    if (!isAllowedToOpen) {
      return {
        success: false,
        error: `Acesso negado: Este setor (${sector.name}) é restrito a colaboradores autorizados.`,
      };
    }

    // 3. Valida campos compulsórios da flag 'is_financial'
    if (sector.isFinancial) {
      if (amount === undefined || amount === null || amount <= 0) {
        return {
          success: false,
          error: `Setor financeiro exige a declaração de um valor monetário válido (R$).`,
          fieldErrors: { amount: ['Valor monetário obrigatório para este setor.'] },
        };
      }
      if (!dueDate) {
        return {
          success: false,
          error: `Setor financeiro exige uma data de vencimento válida.`,
          fieldErrors: { dueDate: ['Data de vencimento obrigatória para este setor.'] },
        };
      }
    }

    // 4. Executa criação do ticket e histórico inicial em transação indivisível
    const newTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          title,
          description,
          sectorId,
          requesterId: user.id,
          priority,
          status: TicketStatus.ABERTO,
          amount: amount ? new Prisma.Decimal(amount) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          userId: user.id,
          fromStatus: null,
          toStatus: TicketStatus.ABERTO,
          comment: 'Chamado aberto no sistema.',
        },
      });

      return ticket;
    });

    revalidatePath('/tickets');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: {
        id: newTicket.id,
        ticketNumber: newTicket.ticketNumber,
      },
      message: `Chamado #TK-${String(newTicket.ticketNumber).padStart(4, '0')} criado com sucesso.`,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Falha inesperada ao criar chamado.',
    };
  }
}

/**
 * Transição de estado de um chamado (Máquina de Estados Imutável)
 */
export async function transitionTicketAction(
  rawInput: TransitionTicketInputSchema
): Promise<ActionResponse<{ id: string; status: TicketStatus }>> {
  try {
    const session = await requireAuth();
    const user = session.user;

    const parsed = transitionTicketSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Parâmetros de transição de estado inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { ticketId, targetStatus, reason, comment, proofAttachment } =
      parsed.data;

    // 1. Busca o ticket atual e setor correspondente
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        sector: true,
      },
    });

    if (!ticket) {
      return {
        success: false,
        error: 'Chamado não encontrado.',
      };
    }

    // 2. Valida a transição através do motor de regras
    const validation = validateStateTransition({
      ticket,
      user,
      targetStatus,
      reason,
      hasAttachment: !!proofAttachment,
      attachmentMimeType: proofAttachment?.mimeType,
    });

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error ?? 'Transição de estado não autorizada.',
      };
    }

    // 3. Executa a transição atômica
    const updatedTicket = await prisma.$transaction(async (tx) => {
      // Se houver comprovante, registra o anexo
      if (proofAttachment) {
        await tx.ticketAttachment.create({
          data: {
            ticketId: ticket.id,
            uploaderId: user.id,
            fileKey: proofAttachment.fileKey,
            fileName: proofAttachment.fileName,
            mimeType: proofAttachment.mimeType,
            fileSize: proofAttachment.fileSize,
            stage: proofAttachment.stage,
          },
        });
      }

      // Prepara os dados de atualização do ticket
      const updateData: Prisma.TicketUpdateInput = {
        status: targetStatus,
      };

      // Se assumir o ticket e não houver executor atribuído, atribui ao usuário atual
      if (targetStatus === TicketStatus.EM_ANDAMENTO && !ticket.executorId) {
        updateData.executor = { connect: { id: user.id } };
      }

      // Se homologado e fechado, registra a data de encerramento
      if (targetStatus === TicketStatus.HOMOLOGADO_FECHADO) {
        updateData.closedAt = new Date();
      }

      // Se recusado e reaberto, limpa data de fechamento se existente
      if (targetStatus === TicketStatus.RECUSADO_REABERTO) {
        updateData.closedAt = null;
      }

      const updated = await tx.ticket.update({
        where: { id: ticket.id },
        data: updateData,
      });

      // Criação compulsória do registro de auditoria imutável
      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          userId: user.id,
          fromStatus: ticket.status,
          toStatus: targetStatus,
          reason: reason ?? null,
          comment: comment ?? null,
        },
      });

      return updated;
    });

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${ticket.id}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      data: {
        id: updatedTicket.id,
        status: updatedTicket.status,
      },
      message: `Status do chamado alterado com sucesso para '${updatedTicket.status}'.`,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Falha durante a transição de estado do chamado.',
    };
  }
}

/**
 * Consulta de tickets com filtros e paginação
 */
export async function getTicketsAction(
  rawFilters?: TicketFilterInput
): Promise<ActionResponse<PaginatedTickets>> {
  try {
    const session = await requireAuth();
    const user = session.user;

    const parsed = ticketFilterSchema.safeParse(rawFilters ?? {});
    if (!parsed.success) {
      return {
        success: false,
        error: 'Filtros de consulta inválidos.',
      };
    }

    const { status, sectorId, priority, onlyMyTickets, onlyAssignedToMe, search, page, pageSize } =
      parsed.data;

    // Constrói cláusula de visibilidade e filtros
    const where: Prisma.TicketWhereInput = {};

    // Escopo de visibilidade:
    // Se ADMIN_GERAL, tem visão ampla.
    if (user.globalRole !== GlobalRole.ADMIN_GERAL) {
      const staffRoles: readonly SectorRole[] = [
        SectorRole.EXECUTOR,
        SectorRole.HOMOLOGADOR,
      ];
      const activeSectorIds = user.sectorRoles
        .filter((sr) => staffRoles.includes(sr.role))
        .map((sr) => sr.sectorId);

      where.OR = [
        { requesterId: user.id },
        ...(activeSectorIds.length > 0 ? [{ sectorId: { in: activeSectorIds } }] : []),
      ];
    }

    if (onlyMyTickets) {
      where.requesterId = user.id;
    }

    if (onlyAssignedToMe) {
      where.executorId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (sectorId) {
      where.sectorId = sectorId;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        ...(where.OR ?? []),
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          sector: {
            select: {
              id: true,
              name: true,
              slug: true,
              isFinancial: true,
            },
          },
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          executor: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              attachments: true,
            },
          },
        },
      }),
    ]);

    const items: TicketListItem[] = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      status: t.status,
      priority: t.priority,
      amount: t.amount ? t.amount.toString() : null,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      closedAt: t.closedAt,
      sector: t.sector,
      requester: t.requester,
      executor: t.executor,
      attachmentsCount: t._count.attachments,
    }));

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Falha ao buscar chamados.',
    };
  }
}

/**
 * Consulta detalhada de um chamado com histórico imutável e comprovantes
 */
export async function getTicketDetailsAction(
  ticketId: string
): Promise<ActionResponse<TicketDetail>> {
  try {
    const session = await requireAuth();
    const user = session.user;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        sector: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        executor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        history: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        attachments: {
          orderBy: { createdAt: 'asc' },
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return {
        success: false,
        error: 'Chamado não encontrado.',
      };
    }

    // Validação de acesso à visualização
    if (user.globalRole !== GlobalRole.ADMIN_GERAL) {
      const isRequester = ticket.requesterId === user.id;
      const isExecutor = ticket.executorId === user.id;
      const hasSectorAccess = user.sectorRoles.some(
        (sr) => sr.sectorId === ticket.sectorId
      );

      if (!isRequester && !isExecutor && !hasSectorAccess) {
        return {
          success: false,
          error: 'Você não tem permissão para visualizar este chamado.',
        };
      }
    }

    return {
      success: true,
      data: ticket,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Falha ao carregar detalhes do chamado.',
    };
  }
}
