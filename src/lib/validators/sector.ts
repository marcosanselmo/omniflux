import { z } from 'zod';
import { ProofType } from '@prisma/client';

// ==============================================================================
// OMNIFLUX - SCHEMAS ZOD PARA CONFIGURAÇÃO DE SETORES DINÂMICOS
// ==============================================================================

export const createSectorSchema = z.object({
  name: z
    .string({ required_error: 'O nome do setor é obrigatório.' })
    .min(3, 'O nome deve ter no mínimo 3 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.')
    .trim(),
  slug: z
    .string({ required_error: 'O identificador amigável (slug) é obrigatório.' })
    .min(2, 'O slug deve ter no mínimo 2 caracteres.')
    .max(100, 'O slug deve ter no máximo 100 caracteres.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'O slug deve conter apenas letras minúsculas, números e hífens (ex: ti-suporte).'
    )
    .trim(),
  description: z.string().trim().max(500).optional(),
  isFinancial: z.boolean().default(false),
  requiresProofFile: z.boolean().default(false),
  allowedProofTypes: z
    .nativeEnum(ProofType, {
      errorMap: () => ({ message: 'Tipo de comprovante inválido.' }),
    })
    .default(ProofType.ALL),
  isRestricted: z.boolean().default(false),
});

export type CreateSectorInput = z.infer<typeof createSectorSchema>;

export const updateSectorSchema = createSectorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateSectorInput = z.infer<typeof updateSectorSchema>;
