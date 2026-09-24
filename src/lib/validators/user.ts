import { z } from 'zod';
import { GlobalRole, SectorRole } from '@prisma/client';

// ==============================================================================
// OMNIFLUX - VALIDADORES DE GESTÃO DE USUÁRIOS E MATRIZ RBAC
// ==============================================================================

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'O nome deve conter ao menos 2 caracteres.')
    .max(120, 'O nome deve conter no máximo 120 caracteres.')
    .trim(),
  email: z
    .string()
    .email('E-mail corporativo inválido.')
    .max(255)
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'A senha provisória deve conter ao menos 6 caracteres.'),
  globalRole: z.nativeEnum(GlobalRole),
});

export const assignSectorRoleSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido.'),
  sectorId: z.string().uuid('ID de setor inválido.'),
  role: z.nativeEnum(SectorRole),
});

export const removeSectorRoleSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido.'),
  sectorId: z.string().uuid('ID de setor inválido.'),
  role: z.nativeEnum(SectorRole),
});

export const toggleUserStatusSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido.'),
  isActive: z.boolean(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type AssignSectorRoleInput = z.infer<typeof assignSectorRoleSchema>;
export type RemoveSectorRoleInput = z.infer<typeof removeSectorRoleSchema>;
export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;
