'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { TicketListItem, PaginatedTickets } from '@/types/ticket';
import { SectorSummary } from '@/types/sector';
import { TicketStatus } from '@prisma/client';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';

interface TicketListProps {
  initialData: PaginatedTickets;
  sectors: SectorSummary[];
}

export function TicketList({ initialData, sectors }: TicketListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');

  function handleFilterChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  const currentStatus = searchParams.get('status') ?? '';
  const currentSector = searchParams.get('sectorId') ?? '';

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Input de Busca */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFilterChange('search', searchTerm);
              }
            }}
            placeholder="Buscar por título ou descrição..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Dropdowns de Filtro */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filtro de Status */}
          <select
            value={currentStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none transition"
          >
            <option value="">Todos os Status</option>
            <option value={TicketStatus.ABERTO}>Aberto</option>
            <option value={TicketStatus.EM_ANDAMENTO}>Em Execução</option>
            <option value={TicketStatus.AGUARDANDO_HOMOLOGACAO}>Aguardando Homologação</option>
            <option value={TicketStatus.HOMOLOGADO_FECHADO}>Homologado & Fechado</option>
            <option value={TicketStatus.RECUSADO_REABERTO}>Recusado (Retrabalho)</option>
          </select>

          {/* Filtro de Setor */}
          <select
            value={currentSector}
            onChange={(e) => handleFilterChange('sectorId', e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none transition"
          >
            <option value="">Todos os Setores</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <Link
            href="/tickets/new"
            className="px-4 py-2 rounded-xl bg-[#2563EB] text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition shrink-0"
          >
            + Novo Chamado
          </Link>
        </div>
      </div>

      {/* Tabela de Chamados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Código</th>
                <th className="py-3.5 px-6">Título da Demanda</th>
                <th className="py-3.5 px-6">Setor</th>
                <th className="py-3.5 px-6">Solicitante</th>
                <th className="py-3.5 px-6">Responsável</th>
                <th className="py-3.5 px-6">Prioridade</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialData.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    Nenhum chamado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                initialData.items.map((ticket: TicketListItem) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-mono font-bold text-[#2563EB]">
                      #TK-{String(ticket.ticketNumber).padStart(4, '0')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900 max-w-xs truncate">
                        {ticket.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {ticket.sector.name}
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      {ticket.requester.name}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {ticket.executor ? ticket.executor.name : (
                        <span className="text-slate-400 italic">Não assumido</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-xs text-[#2563EB] bg-blue-50 hover:bg-blue-100 transition"
                      >
                        Abrir &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {initialData.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Total: {initialData.total} chamados (Página {initialData.page} de{' '}
              {initialData.totalPages})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={initialData.page <= 1}
                onClick={() => handlePageChange(initialData.page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={initialData.page >= initialData.totalPages}
                onClick={() => handlePageChange(initialData.page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
