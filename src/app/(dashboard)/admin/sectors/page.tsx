import React from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { GlobalRole } from '@prisma/client';
import { getAdminSectorsAction } from '@/server/actions/sector.actions';
import { SectorManager } from '@/components/modules/admin/sector-manager';

export const metadata = {
  title: 'Gestão de Setores & Parametrização | OmniFlux',
  description: 'Parametrização dinâmica de regras de negócio e flags de comportamento por setor',
};

export default async function AdminSectorsPage() {
  const session = await requireAuth();

  // Apenas Administrador Geral pode acessar
  if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
    redirect('/dashboard');
  }

  const res = await getAdminSectorsAction();
  const sectors = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Gestão de Setores & Parametrização
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Cadastre novos setores e configure dinamicamente suas regras operacionais (fluxo financeiro, obrigatoriedade de comprovante e restrição de acesso).
        </p>
      </div>

      {/* Gerenciador de Setores */}
      <SectorManager initialSectors={sectors} />
    </div>
  );
}
