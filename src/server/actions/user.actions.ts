'use server';

import { revalidatePath } from 'next/cache';
import * as bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ActionResponse } from '@/types/auth';
import { GlobalRole, SectorRole } from '@prisma/client';
import {
  createUserSchema,
  assignSectorRoleSchema,
  removeSectorRoleSchema,
  toggleUserStatusSchema,
} from '@/lib/validators/user';

// ==============================================================================
// OMNIFLUX - GESTÃO DE USUÁRIOS E RBAC (SINGLE-TENANT)
// ==============================================================================

export interface AdminUserSectorRole {
  id: string;
  sectorId: string;
  sectorName: string;
  role: SectorRole;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  globalRole: GlobalRole;
  isActive: boolean;
  createdAt: Date;
  sectorRoles: AdminUserSectorRole[];
}

/**
 * Lista todos os usuários cadastrados e seus papéis setoriais (Apenas ADMIN_GERAL)
 */
export async function listUsersAction(): Promise<
  ActionResponse<AdminUserItem[]>
> {
  try {
    const session = await requireAuth();
    if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
      return {
        success: false,
        error: 'Acesso negado: Gestão de usuários restrita ao Administrador Geral.',
      };
    }

    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      include: {
        sectorRoles: {
          include: {
            sector: { select: { id: true, name: true } },
          },
        },
      },
    });

    const items: AdminUserItem[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      globalRole: u.globalRole,
      isActive: u.isActive,
      createdAt: u.createdAt,
      sectorRoles: u.sectorRoles.map((sr) => ({
        id: sr.id,
        sectorId: sr.sectorId,
        sectorName: sr.sector.name,
        role: sr.role,
      })),
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error('[listUsersAction] Erro:', error);
    return {
      success: false,
      error: 'Falha ao carregar a lista de usuários.',
    };
  }
}

/**
 * Cria um novo colaborador na organização
 */
export async function createUserAction(
  rawInput: unknown
): Promise<ActionResponse<{ id: string; email: string }>> {
  try {
    const session = await requireAuth();
    if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
      return {
        success: false,
        error: 'Acesso negado: Criação de usuários restrita ao Administrador Geral.',
      };
    }

    const parsed = createUserSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Dados de criação inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { name, email, password, globalRole } = parsed.data;

    // Verifica unicidade de e-mail
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return {
        success: false,
        error: 'Já existe um colaborador cadastrado com este e-mail.',
        fieldErrors: { email: ['E-mail já está em uso na organização.'] },
      };
    }

    // Hash seguro da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        globalRole,
        isActive: true,
      },
    });

    revalidatePath('/admin/users');

    return {
      success: true,
      data: { id: newUser.id, email: newUser.email },
      message: `Usuário "${newUser.name}" cadastrado com sucesso.`,
    };
  } catch (error) {
    console.error('[createUserAction] Erro:', error);
    return {
      success: false,
      error: 'Falha inesperada ao criar usuário.',
    };
  }
}

/**
 * Ativa ou inativa um colaborador
 */
export async function toggleUserStatusAction(
  rawInput: unknown
): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth();
    if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
      return {
        success: false,
        error: 'Acesso negado: Alteração de status restrita ao Administrador Geral.',
      };
    }

    const parsed = toggleUserStatusSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Parâmetros inválidos.',
      };
    }

    const { userId, isActive } = parsed.data;

    // Impede auto-desativação do administrador logado
    if (userId === session.user.id && !isActive) {
      return {
        success: false,
        error: 'Você não pode desativar sua própria conta de Administrador Geral.',
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    revalidatePath('/admin/users');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[toggleUserStatusAction] Erro:', error);
    return {
      success: false,
      error: 'Falha ao alterar o status do usuário.',
    };
  }
}

/**
 * Atribui papel de setor ao usuário
 */
export async function assignSectorRoleAction(
  rawInput: unknown
): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth();
    if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
      return {
        success: false,
        error: 'Acesso negado.',
      };
    }

    const parsed = assignSectorRoleSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Parâmetros de permissão inválidos.',
      };
    }

    const { userId, sectorId, role } = parsed.data;

    await prisma.userSectorRole.upsert({
      where: {
        userId_sectorId_role: {
          userId,
          sectorId,
          role,
        },
      },
      update: {},
      create: {
        userId,
        sectorId,
        role,
      },
    });

    revalidatePath('/admin/users');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[assignSectorRoleAction] Erro:', error);
    return {
      success: false,
      error: 'Falha ao atribuir permissão no setor.',
    };
  }
}

/**
 * Remove papel de setor do usuário
 */
export async function removeSectorRoleAction(
  rawInput: unknown
): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth();
    if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
      return {
        success: false,
        error: 'Acesso negado.',
      };
    }

    const parsed = removeSectorRoleSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Parâmetros inválidos.',
      };
    }

    const { userId, sectorId, role } = parsed.data;

    await prisma.userSectorRole.deleteMany({
      where: {
        userId,
        sectorId,
        role,
      },
    });

    revalidatePath('/admin/users');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[removeSectorRoleAction] Erro:', error);
    return {
      success: false,
      error: 'Falha ao revogar permissão do setor.',
    };
  }
}
