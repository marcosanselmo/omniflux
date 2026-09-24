import React from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { GlobalRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { AuditViewer } from '@/components/modules/admin/audit-viewer';

export const metadata = {
  title: 'Trilha Global de Auditoria | OmniFlux',
  description: 'Auditoria imutável e governança operacional de tickets',
};

export default async function AdminAuditPage() {
  const session = await requireAuth();

  // Apenas Administrador Geral pode acessar
  if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
    redirect('/dashboard');
  }

  // Setores ativos para filtro
  const sectors = await prisma.sector.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Trilha Global de Auditoria
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro imutável de todas as transições de estado, decisões técnicas e histórico de chamados.
          </p>
        </div>
      </div>

      {/* Visualizador de Auditoria com Filtros e Exportação */}
      <AuditViewer sectors={sectors} />
    </div>
  );
}
