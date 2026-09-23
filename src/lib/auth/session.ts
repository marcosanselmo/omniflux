import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { GlobalRole } from '@prisma/client';

// ==============================================================================
// OMNIFLUX - UTILITÁRIOS DE SESSÃO DO SERVIDOR (RSC & SERVER ACTIONS)
// ==============================================================================

/**
 * Recupera a sessão autenticada com tipagem estrita no lado do servidor
 */
export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}

/**
 * Garante que a requisição provém de um usuário autenticado
 * Lança um erro controlado caso não haja sessão válida
 */
export async function requireAuth() {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    throw new Error('Não autorizado: Sessão inexistente ou expirada.');
  }
  return session;
}

/**
 * Garante que o usuário autenticado possui o papel global ADMIN_GERAL
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
    throw new Error('Acesso negado: Requer privilégios de Administrador Geral.');
  }
  return session;
}
