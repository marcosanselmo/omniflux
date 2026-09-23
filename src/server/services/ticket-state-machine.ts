import {
  TicketStatus,
  ProofType,
  SectorRole,
} from '@prisma/client';
import { AuthUser } from '@/types/auth';
import { hasSectorRole } from '@/lib/auth/rbac';

// ==============================================================================
// OMNIFLUX - MOTOR DA MÁQUINA DE ESTADOS IMUTÁVEL DO TICKET
// Garante conformidade estrita com o grafo de aprovações (AGENTS.md seção 2.4)
// ==============================================================================

export interface StateMachineContext {
  ticket: {
    id: string;
    status: TicketStatus;
    sectorId: string;
    requesterId: string;
    executorId: string | null;
    sector: {
      id: string;
      name: string;
      requiresProofFile: boolean;
      allowedProofTypes: ProofType;
    };
  };
  user: AuthUser;
  targetStatus: TicketStatus;
  reason?: string;
  hasAttachment?: boolean;
  attachmentMimeType?: string;
}

export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida se o formato do comprovante satisfaz a restrição do setor
 */
function isMimeTypeAllowed(mimeType: string, allowedProofTypes: ProofType): boolean {
  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  switch (allowedProofTypes) {
    case ProofType.IMAGE:
      return isImage;
    case ProofType.DOCUMENT:
      return isPdf;
    case ProofType.ALL:
      return isImage || isPdf;
    default:
      return false;
  }
}

/**
 * Avalia estritamente se uma transição de estado solicitada é permitida pelas regras de negócio
 */
export function validateStateTransition(
  context: StateMachineContext
): TransitionValidationResult {
  const { ticket, user, targetStatus, reason, hasAttachment, attachmentMimeType } =
    context;
  const currentStatus = ticket.status;

  // 1. Não permite transição para o mesmo status
  if (currentStatus === targetStatus) {
    return {
      valid: false,
      error: `O chamado já se encontra no status ${currentStatus}.`,
    };
  }

  // 2. Não permite transições a partir de um ticket já homologado e fechado (imutabilidade)
  if (currentStatus === TicketStatus.HOMOLOGADO_FECHADO) {
    return {
      valid: false,
      error: 'Chamados homologados e fechados não podem sofrer novas alterações de estado.',
    };
  }

  // 3. Resolução da Máquina de Estados
  switch (currentStatus) {
    case TicketStatus.ABERTO:
      // ABERTO -> EM_ANDAMENTO (Executor assume o chamado)
      if (targetStatus === TicketStatus.EM_ANDAMENTO) {
        const canExecute = hasSectorRole(user, ticket.sectorId, [
          SectorRole.EXECUTOR,
        ]);
        if (!canExecute) {
          return {
            valid: false,
            error:
              'Apenas executores alocados neste setor ou Administradores Gerais podem assumir o chamado.',
          };
        }
        return { valid: true };
      }
      return {
        valid: false,
        error: `Transição inválida: Chamados em status 'ABERTO' só podem transitar para 'EM_ANDAMENTO'.`,
      };

    case TicketStatus.EM_ANDAMENTO:
      // EM_ANDAMENTO -> AGUARDANDO_HOMOLOGACAO (Executor conclui e submete)
      if (targetStatus === TicketStatus.AGUARDANDO_HOMOLOGACAO) {
        const canExecute = hasSectorRole(user, ticket.sectorId, [
          SectorRole.EXECUTOR,
        ]);
        if (!canExecute) {
          return {
            valid: false,
            error:
              'Apenas executores do setor ou Administradores Gerais podem concluir chamados em andamento.',
          };
        }

        // Validação da flag requires_proof_file do setor
        if (ticket.sector.requiresProofFile) {
          if (!hasAttachment) {
            return {
              valid: false,
              error: `Este setor (${ticket.sector.name}) exige obrigatoriamente o anexo de um comprovante para conclusão do chamado.`,
            };
          }

          if (
            attachmentMimeType &&
            !isMimeTypeAllowed(attachmentMimeType, ticket.sector.allowedProofTypes)
          ) {
            return {
              valid: false,
              error: `O tipo de comprovante anexado (${attachmentMimeType}) não é permitido neste setor. Tipos aceitos: ${ticket.sector.allowedProofTypes}.`,
            };
          }
        }

        return { valid: true };
      }
      return {
        valid: false,
        error: `Transição inválida: Chamados em 'EM_ANDAMENTO' só podem transitar para 'AGUARDANDO_HOMOLOGACAO'.`,
      };

    case TicketStatus.AGUARDANDO_HOMOLOGACAO:
      // AGUARDANDO_HOMOLOGACAO -> HOMOLOGADO_FECHADO (Visto Final / Sucesso)
      if (targetStatus === TicketStatus.HOMOLOGADO_FECHADO) {
        const canHomologate = hasSectorRole(user, ticket.sectorId, [
          SectorRole.HOMOLOGADOR,
        ]);
        if (!canHomologate) {
          return {
            valid: false,
            error:
              'Apenas homologadores/gestores autorizados para este setor podem aprovar e fechar chamados.',
          };
        }
        return { valid: true };
      }

      // AGUARDANDO_HOMOLOGACAO -> RECUSADO_REABERTO (Recusa com Justificativa de Retrabalho)
      if (targetStatus === TicketStatus.RECUSADO_REABERTO) {
        const canHomologate = hasSectorRole(user, ticket.sectorId, [
          SectorRole.HOMOLOGADOR,
        ]);
        if (!canHomologate) {
          return {
            valid: false,
            error:
              'Apenas homologadores/gestores autorizados para este setor podem recusar chamados.',
          };
        }

        if (!reason || reason.trim().length < 5) {
          return {
            valid: false,
            error:
              'Para recusar um chamado e solicitar retrabalho, é obrigatório fornecer uma justificativa técnica formal (mínimo 5 caracteres).',
          };
        }

        return { valid: true };
      }

      return {
        valid: false,
        error: `Transição inválida: Chamados em 'AGUARDANDO_HOMOLOGACAO' só podem ser 'HOMOLOGADO_FECHADO' ou 'RECUSADO_REABERTO'.`,
      };

    case TicketStatus.RECUSADO_REABERTO:
      // RECUSADO_REABERTO -> EM_ANDAMENTO (Executor reassume para retrabalho)
      if (targetStatus === TicketStatus.EM_ANDAMENTO) {
        const canExecute = hasSectorRole(user, ticket.sectorId, [
          SectorRole.EXECUTOR,
        ]);
        if (!canExecute) {
          return {
            valid: false,
            error:
              'Apenas executores do setor ou Administradores Gerais podem reassumir o retrabalho.',
          };
        }
        return { valid: true };
      }
      return {
        valid: false,
        error: `Transição inválida: Chamados em 'RECUSADO_REABERTO' só podem retornar para 'EM_ANDAMENTO'.`,
      };

    default:
      return {
        valid: false,
        error: 'Estado de chamado não reconhecido pelo motor de fluxos.',
      };
  }
}
