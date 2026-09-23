'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth/session';
import { ActionResponse } from '@/types/auth';
import { SectorSummary, SectorWithStats } from '@/types/sector';
import {
  createSectorSchema,
  updateSectorSchema,
  CreateSectorInput,
  UpdateSectorInput,
} from '@/lib/validators/sector';

// ==============================================================================
// OMNIFLUX - SERVER ACTIONS DE SETORES DINÂMICOS & GOVERNANÇA
// ==============================================================================

/**
 * Lista todos os setores ativos do sistema para seleção e abertura de chamados
 */
export async function getActiveSectorsAction(): Promise<
  ActionResponse<SectorSummary[]>
> {
  try {
    await requireAuth();

    const sectors = await prisma.sector.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: sectors,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Falha ao recuperar a lista de setores.',
    };
  }
}

/**
 * Lista todos os setores com contadores e estatísticas (Apenas ADMIN_GERAL)
 */
export async function getAdminSectorsAction(): Promise<
  ActionResponse<SectorWithStats[]>
> {
  try {
    await requireAdmin();

    const sectors = await prisma.sector.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            tickets: true,
            sectorRoles: true,
          },
        },
      },
    });

    return {
      success: true,
      data: sectors,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Acesso negado às configurações de setores.',
    };
  }
}

/**
 * Criação de um novo setor dinâmico com flags comportamentais (Apenas ADMIN_GERAL)
 */
export async function createSectorAction(
  rawInput: CreateSectorInput
): Promise<ActionResponse<SectorSummary>> {
  try {
    await requireAdmin();

    const parsed = createSectorSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Dados do setor inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { name, slug, description, isFinancial, requiresProofFile, allowedProofTypes, isRestricted } =
      parsed.data;

    // Verifica se já existe um setor com o mesmo slug
    const existing = await prisma.sector.findUnique({
      where: { slug },
    });

    if (existing) {
      return {
        success: false,
        error: `Já existe um setor cadastrado com o identificador '${slug}'.`,
      };
    }

    const newSector = await prisma.sector.create({
      data: {
        name,
        slug,
        description,
        isFinancial,
        requiresProofFile,
        allowedProofTypes,
        isRestricted,
        isActive: true,
      },
    });

    revalidatePath('/admin/sectors');
    revalidatePath('/tickets/new');

    return {
      success: true,
      data: newSector,
      message: `Setor '${newSector.name}' criado com sucesso.`,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Falha ao criar novo setor.',
    };
  }
}

/**
 * Atualização de parâmetros e flags do setor (Apenas ADMIN_GERAL)
 */
export async function updateSectorAction(
  sectorId: string,
  rawInput: UpdateSectorInput
): Promise<ActionResponse<SectorSummary>> {
  try {
    await requireAdmin();

    const parsed = updateSectorSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Parâmetros de atualização inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const updated = await prisma.sector.update({
      where: { id: sectorId },
      data: parsed.data,
    });

    revalidatePath('/admin/sectors');
    revalidatePath('/tickets/new');

    return {
      success: true,
      data: updated,
      message: `Parâmetros do setor '${updated.name}' atualizados com sucesso.`,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Falha ao atualizar parâmetros do setor.',
    };
  }
}
