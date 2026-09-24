'use server';

import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { GlobalRole, ProofType, SectorRole } from '@prisma/client';
import { ActionResponse } from '@/types/auth';
import { z } from 'zod';

// ==============================================================================
// OMNIFLUX - ASSISTENTE DE INICIALIZAÇÃO / SETUP WIZARD (FIRST-RUN)
// Permite provisionar o Administrador Master e setores recomendados via interface
// ==============================================================================

export const PRESET_SECTORS = [
  {
    name: 'TI & Suporte Técnico',
    slug: 'ti-suporte',
    description: 'Incidentes de tecnologia, acessos, redes, computadores e periféricos.',
    isFinancial: false,
    requiresProofFile: false,
    allowedProofTypes: ProofType.ALL,
    isRestricted: false,
  },
  {
    name: 'Manutenção Predial & Infraestrutura',
    slug: 'manutencao-predial',
    description: 'Reparos elétricos, hidráulicos, ar-condicionado, alvenaria e conservação.',
    isFinancial: false,
    requiresProofFile: true,
    allowedProofTypes: ProofType.IMAGE,
    isRestricted: false,
  },
  {
    name: 'Financeiro & Contas a Pagar',
    slug: 'financeiro',
    description: 'Solicitações de pagamento, reembolsos de despesas, adiantamentos e notas fiscais.',
    isFinancial: true,
    requiresProofFile: true,
    allowedProofTypes: ProofType.ALL,
    isRestricted: false,
  },
  {
    name: 'Recursos Humanos & DP',
    slug: 'recursos-humanos',
    description: 'Dúvidas de folha de pagamento, férias, benefícios, admissões e atestados.',
    isFinancial: false,
    requiresProofFile: false,
    allowedProofTypes: ProofType.ALL,
    isRestricted: false,
  },
  {
    name: 'Compras & Almoxarifado',
    slug: 'compras-almoxarifado',
    description: 'Requisição de insumos de escritório, equipamentos e cotações com fornecedores.',
    isFinancial: true,
    requiresProofFile: false,
    allowedProofTypes: ProofType.ALL,
    isRestricted: false,
  },
  {
    name: 'Jurídico & Contratos',
    slug: 'juridico-contratos',
    description: 'Análise de minutas contratuais, pareceres legais, termos e compliance.',
    isFinancial: false,
    requiresProofFile: true,
    allowedProofTypes: ProofType.DOCUMENT,
    isRestricted: false,
  },
];

const setupSchema = z.object({
  adminName: z
    .string()
    .min(3, 'O nome deve conter ao menos 3 caracteres.')
    .max(120),
  adminEmail: z.string().email('E-mail corporativo inválido.').toLowerCase().trim(),
  adminPassword: z
    .string()
    .min(6, 'A senha deve conter ao menos 6 caracteres.'),
  selectedSectors: z
    .array(
      z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        isFinancial: z.boolean(),
        requiresProofFile: z.boolean(),
        allowedProofTypes: z.nativeEnum(ProofType),
        isRestricted: z.boolean(),
      })
    )
    .min(1, 'Selecione ao menos 1 setor inicial para a organização.'),
});

export type SetupInput = z.infer<typeof setupSchema>;

/**
 * Verifica se a aplicação já possui um Administrador configurado
 */
export async function checkSystemSetupAction(): Promise<boolean> {
  const userCount = await prisma.user.count();
  return userCount > 0;
}

/**
 * Executa a inicialização atômica do sistema com o primeiro usuário Master
 */
export async function initializeSystemAction(
  rawInput: unknown
): Promise<ActionResponse<{ email: string }>> {
  try {
    // 1. Garante que o setup só pode rodar quando não houver nenhum usuário
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return {
        success: false,
        error:
          'O sistema OmniFlux já foi inicializado. Por favor, realize o login com sua conta existente.',
      };
    }

    const parsed = setupSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Dados de inicialização inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { adminName, adminEmail, adminPassword, selectedSectors } = parsed.data;

    // 2. Hash da senha do Administrador Master
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // 3. Inicialização indivisível no banco
    await prisma.$transaction(async (tx) => {
      // Cria o Administrador Geral
      const admin = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          globalRole: GlobalRole.ADMIN_GERAL,
          isActive: true,
        },
      });

      // Cria os setores escolhidos
      for (const sectorData of selectedSectors) {
        const sector = await tx.sector.create({
          data: {
            name: sectorData.name,
            slug: sectorData.slug,
            description: sectorData.description ?? null,
            isFinancial: sectorData.isFinancial,
            requiresProofFile: sectorData.requiresProofFile,
            allowedProofTypes: sectorData.allowedProofTypes,
            isRestricted: sectorData.isRestricted,
            isActive: true,
          },
        });

        // Vincula o Administrador Master com papel de HOMOLOGADOR em cada setor inicial
        await tx.userSectorRole.create({
          data: {
            userId: admin.id,
            sectorId: sector.id,
            role: SectorRole.HOMOLOGADOR,
          },
        });
      }
    });

    return {
      success: true,
      data: { email: adminEmail },
      message: 'OmniFlux inicializado com sucesso!',
    };
  } catch (error) {
    console.error('[initializeSystemAction] Erro na inicialização:', error);
    return {
      success: false,
      error: 'Falha durante a inicialização do sistema.',
    };
  }
}
