import { GlobalRole, SectorRole } from '@prisma/client';

// ==============================================================================
// OMNIFLUX - CONTRATOS DE TIPAGEM DE AUTENTICAÇÃO E RBAC
// ==============================================================================

/**
 * Padrão estruturado de resposta para Server Actions e serviços (Result Pattern)
 * Conforme definido no AGENTS.md
 */
export type ActionResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Dados de vínculo setorial atribuídos ao usuário autenticado
 */
export interface UserSectorRoleData {
  sectorId: string;
  sectorSlug: string;
  sectorName: string;
  role: SectorRole;
}

/**
 * Representação do usuário na sessão ativa
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  globalRole: GlobalRole;
  sectorRoles: UserSectorRoleData[];
}
