import { GlobalRole, SectorRole } from '@prisma/client';
import { AuthUser } from '@/types/auth';

// ==============================================================================
// OMNIFLUX - MOTOR DE GOVERNANÇA E MATRIZ DE AUTORIZAÇÃO RBAC
// Resolve permissões nas dimensões Global (ADMIN_GERAL) e Específica por Setor
// ==============================================================================

/**
 * Verifica se o usuário autenticado possui algum dos papéis solicitados para o setor especificado.
 * Administradores Gerais (ADMIN_GERAL) possuem visto universal automático.
 */
export function hasSectorRole(
  user: AuthUser,
  sectorId: string,
  allowedRoles: SectorRole[]
): boolean {
  // 1. ADMIN_GERAL possui autoridade plena em qualquer setor
  if (user.globalRole === GlobalRole.ADMIN_GERAL) {
    return true;
  }

  // 2. Verifica se o usuário possui vínculo com algum dos papéis permitidos
  return user.sectorRoles.some(
    (sr) => sr.sectorId === sectorId && allowedRoles.includes(sr.role)
  );
}

/**
 * Avalia se o usuário tem autorização para abrir chamado no setor indicado,
 * considerando a flag 'is_restricted' do setor.
 */
export function canCreateTicketInSector(
  user: AuthUser,
  sector: { id: string; isRestricted: boolean }
): boolean {
  // ADMIN_GERAL pode abrir chamados em qualquer setor
  if (user.globalRole === GlobalRole.ADMIN_GERAL) {
    return true;
  }

  // Setor aberto: qualquer colaborador autenticado pode solicitar
  if (!sector.isRestricted) {
    return true;
  }

  // Setor restrito: requer vínculo explícito como SOLICITANTE, EXECUTOR ou HOMOLOGADOR
  return user.sectorRoles.some((sr) => sr.sectorId === sector.id);
}

/**
 * Avalia se o usuário pode assumir e executar chamados na fila do setor
 */
export function canExecuteInSector(user: AuthUser, sectorId: string): boolean {
  return hasSectorRole(user, sectorId, [SectorRole.EXECUTOR]);
}

/**
 * Avalia se o usuário tem autoridade de aprovação/homologação no setor (Visto Final / Recusa)
 */
export function canHomologateInSector(user: AuthUser, sectorId: string): boolean {
  return hasSectorRole(user, sectorId, [SectorRole.HOMOLOGADOR]);
}
