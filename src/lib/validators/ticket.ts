import { z } from 'zod';
import {
  TicketStatus,
  TicketPriority,
  AttachmentStage,
} from '@prisma/client';

// ==============================================================================
// OMNIFLUX - SCHEMAS ZOD DE VALIDAÇÃO DE TICKETS E TRANSIÇÕES
// ==============================================================================

export const createTicketSchema = z.object({
  title: z
    .string({ required_error: 'O título do chamado é obrigatório.' })
    .min(5, 'O título deve conter pelo menos 5 caracteres.')
    .max(200, 'O título deve ter no máximo 200 caracteres.')
    .trim(),
  description: z
    .string({ required_error: 'A descrição da solicitação é obrigatória.' })
    .min(10, 'A descrição deve conter no mínimo 10 caracteres.')
    .trim(),
  sectorId: z
    .string({ required_error: 'O setor de destino é obrigatório.' })
    .uuid('Identificador do setor inválido.'),
  priority: z
    .nativeEnum(TicketPriority, {
      errorMap: () => ({ message: 'Prioridade inválida.' }),
    })
    .default(TicketPriority.MEDIA),
  amount: z
    .preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().positive('O valor monetário deve ser maior que zero.').optional()),
  dueDate: z
    .preprocess((val) => (val === '' || val === null || val === undefined ? undefined : new Date(val as string)), z.date().optional()),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const transitionTicketSchema = z
  .object({
    ticketId: z
      .string({ required_error: 'O identificador do ticket é obrigatório.' })
      .uuid('Identificador do chamado inválido.'),
    targetStatus: z.nativeEnum(TicketStatus, {
      errorMap: () => ({ message: 'Status de destino inválido.' }),
    }),
    reason: z
      .string()
      .trim()
      .optional(),
    comment: z
      .string()
      .trim()
      .max(1000, 'O comentário deve conter no máximo 1000 caracteres.')
      .optional(),
    proofAttachment: z
      .object({
        fileKey: z.string().min(1, 'Chave do arquivo obrigatória.'),
        fileName: z.string().min(1, 'Nome do arquivo obrigatório.'),
        mimeType: z.string().min(1, 'Tipo MIME obrigatório.'),
        fileSize: z.number().int().positive('Tamanho do arquivo inválido.'),
        stage: z.nativeEnum(AttachmentStage).default(AttachmentStage.EXECUCAO),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Se a transição for de recusa com retrabalho, o motivo é estritamente obrigatório
      if (data.targetStatus === TicketStatus.RECUSADO_REABERTO) {
        return !!data.reason && data.reason.trim().length >= 5;
      }
      return true;
    },
    {
      message:
        'A justificativa técnica de recusa é obrigatória e deve ter pelo menos 5 caracteres.',
      path: ['reason'],
    }
  );

export type TransitionTicketInputSchema = z.infer<typeof transitionTicketSchema>;

export const ticketFilterSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  sectorId: z.string().uuid().optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  onlyMyTickets: z.coerce.boolean().optional(),
  onlyAssignedToMe: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type TicketFilterInput = z.infer<typeof ticketFilterSchema>;
