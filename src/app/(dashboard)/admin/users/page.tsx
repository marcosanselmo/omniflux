import React from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { GlobalRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { listUsersAction } from '@/server/actions/user.actions';
import { UserManager } from '@/components/modules/admin/user-manager';

export const metadata = {
  title: 'Gestão de Usuários & Matriz RBAC | OmniFlux',
  description: 'Gerenciamento de acessos, papéis globais e permissões por setor',
};

export default async function AdminUsersPage() {
  const session = await requireAuth();

  // Apenas Administrador Geral pode acessar
  if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
    redirect('/dashboard');
  }

  const [usersRes, sectors] = await Promise.all([
    listUsersAction(),
    prisma.sector.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const users = usersRes.success && usersRes.data ? usersRes.data : [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Gestão de Usuários & Matriz RBAC
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Controle centralizado de colaboradores e alocação de papéis por setor (Solicitante, Executor e Homologador).
        </p>
      </div>

      {/* Gerenciador Interativo */}
      <UserManager
        initialUsers={users}
        sectors={sectors}
        currentUserId={session.user.id}
      />
    </div>
  );
}
