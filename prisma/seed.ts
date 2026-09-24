import { PrismaClient } from '@prisma/client';

// ==============================================================================
// OMNIFLUX - INICIALIZAÇÃO DE BASE
// A inicialização oficial do Administrador Master e dos setores padrão é realizada
// de forma interativa através do Setup Wizard na rota /setup da aplicação web.
// ==============================================================================

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log('ℹ️ O OmniFlux ainda não possui usuários cadastrados.');
    console.log('👉 Acesse http://localhost:3000/setup para cadastrar o Administrador Master e escolher os setores iniciais.');
  } else {
    console.log(`✅ O OmniFlux já está inicializado (${userCount} usuário(s) no sistema).`);
  }
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
