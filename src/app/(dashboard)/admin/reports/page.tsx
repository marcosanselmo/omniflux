import React from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { GlobalRole } from '@prisma/client';
import { getGlobalMetricsAction } from '@/server/actions/metrics.actions';
import { ReportsViewer } from '@/components/modules/admin/reports-viewer';

export const metadata = {
  title: 'Métricas & Relatórios de Conformidade | OmniFlux',
  description: 'Indicadores operacionais de SLA, taxa de retrabalho e volumetria financeira',
};

export default async function AdminReportsPage() {
  const session = await requireAuth();

  // Apenas Administrador Geral pode acessar
  if (session.user.globalRole !== GlobalRole.ADMIN_GERAL) {
    redirect('/dashboard');
  }

  const res = await getGlobalMetricsAction();
  if (!res.success) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-rose-200 text-rose-700 text-sm">
        Falha ao carregar as métricas operacionais: {res.error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Métricas de Governança & Conformidade
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Indicadores de tempo de atendimento (MTTR), taxa de retrabalho por setor e conformidade financeira.
        </p>
      </div>

      {/* Visualizador de Métricas */}
      <ReportsViewer initialData={res.data} />
    </div>
  );
}
