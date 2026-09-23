import { PrismaClient, GlobalRole, SectorRole, ProofType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// ==============================================================================
// OMNIFLUX - SCRIPT DE SEED IDEMPOTENTE
// Popula exclusivamente o Administrador Geral e os Setores Base do Sistema
// ==============================================================================

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🚀 Iniciando seed de configuração do OmniFlux...');

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL ?? 'admin@omniflux.local';
  const adminName = process.env.INITIAL_ADMIN_NAME ?? 'Administrador Geral';
  const rawAdminPassword =
    process.env.INITIAL_ADMIN_PASSWORD ?? 'AdminSecurePassword123!';

  // 1. Criação / Atualização do Administrador Geral
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawAdminPassword, salt);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      globalRole: GlobalRole.ADMIN_GERAL,
      isActive: true,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      globalRole: GlobalRole.ADMIN_GERAL,
      isActive: true,
    },
  });

  console.log(`✅ Administrador Geral configurado: ${adminUser.email} (${adminUser.id})`);

  // 2. Setores Base Parametrizáveis
  const baselineSectors = [
    {
      name: 'TI & Suporte Técnico',
      slug: 'ti-suporte',
      description:
        'Incidentes de tecnologia, acessos, redes e suporte a estações de trabalho.',
      isFinancial: false,
      requiresProofFile: false,
      allowedProofTypes: ProofType.ALL,
      isRestricted: false,
    },
    {
      name: 'Manutenção Predial & Infraestrutura',
      slug: 'manutencao-predial',
      description:
        'Reparos elétricos, hidráulicos, climatização, alvenaria e conservação física das instalações.',
      isFinancial: false,
      requiresProofFile: true,
      allowedProofTypes: ProofType.IMAGE,
      isRestricted: false,
    },
    {
      name: 'Financeiro & Contas a Pagar',
      slug: 'financeiro',
      description:
        'Solicitações de pagamento, adiantamentos, reembolsos e controle de notas fiscais com valor e vencimento.',
      isFinancial: true,
      requiresProofFile: true,
      allowedProofTypes: ProofType.DOCUMENT,
      isRestricted: true,
    },
    {
      name: 'Recursos Humanos & Departamento Pessoal',
      slug: 'recursos-humanos',
      description:
        'Demandas confidenciais de contratação, férias, desligamentos e benefícios.',
      isFinancial: false,
      requiresProofFile: false,
      allowedProofTypes: ProofType.ALL,
      isRestricted: true,
    },
  ];

  console.log('📦 Configurando setores base...');

  for (const sectorData of baselineSectors) {
    const sector = await prisma.sector.upsert({
      where: { slug: sectorData.slug },
      update: {
        name: sectorData.name,
        description: sectorData.description,
        isFinancial: sectorData.isFinancial,
        requiresProofFile: sectorData.requiresProofFile,
        allowedProofTypes: sectorData.allowedProofTypes,
        isRestricted: sectorData.isRestricted,
        isActive: true,
      },
      create: {
        name: sectorData.name,
        slug: sectorData.slug,
        description: sectorData.description,
        isFinancial: sectorData.isFinancial,
        requiresProofFile: sectorData.requiresProofFile,
        allowedProofTypes: sectorData.allowedProofTypes,
        isRestricted: sectorData.isRestricted,
        isActive: true,
      },
    });

    console.log(`   🔹 Setor verificado: [${sector.slug}] ${sector.name}`);

    // Vincula o administrador como HOMOLOGADOR e EXECUTOR nos setores para homologação inicial
    const rolesToAssign: SectorRole[] = [SectorRole.HOMOLOGADOR, SectorRole.EXECUTOR];

    for (const role of rolesToAssign) {
      await prisma.userSectorRole.upsert({
        where: {
          userId_sectorId_role: {
            userId: adminUser.id,
            sectorId: sector.id,
            role,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          sectorId: sector.id,
          role,
        },
      });
    }
  }

  console.log('✅ Matriz inicial de permissões RBAC configurada com sucesso.');
  console.log('✨ Seed finalizado sem inserção de dados fictícios de chamados.');
}

main()
  .catch((e: unknown) => {
    console.error('❌ Erro durante a execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
