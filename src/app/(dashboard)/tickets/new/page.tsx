import React from 'react';
import { getActiveSectorsAction } from '@/server/actions/sector.actions';
import { TicketForm } from '@/components/modules/tickets/ticket-form';

export default async function NewTicketPage() {
  const sectorsRes = await getActiveSectorsAction();
  const sectors = sectorsRes.success ? sectorsRes.data : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Abertura de Chamado Interno
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Selecione o setor de destino e preencha os detalhes operacionais para início do workflow.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-card">
        {sectors.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Nenhum setor disponível para abertura de chamados no momento.
          </div>
        ) : (
          <TicketForm sectors={sectors} />
        )}
      </div>
    </div>
  );
}
