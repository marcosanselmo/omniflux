'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { TicketListItem, PaginatedTickets } from '@/types/ticket';
import { SectorSummary } from '@/types/sector';
import { TicketStatus } from '@prisma/client';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { FormattedDate } from '@/components/ui/formatted-date';
import { TicketKanban } from './ticket-kanban';

interface TicketListProps {
  initialData: PaginatedTickets;
  sectors?: SectorSummary[];
}

export function TicketList({ initialData }: TicketListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filtro de busca instantânea no cliente (ou aciona atualização de rota)
  const filteredTickets = useMemo(() => {
    if (!searchTerm.trim()) return initialData.items;
    const term = searchTerm.toLowerCase();
    return initialData.items.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        String(t.ticketNumber).includes(term) ||
        t.requester.name.toLowerCase().includes(term) ||
        t.sector.name.toLowerCase().includes(term)
    );
  }, [initialData.items, searchTerm]);

  function handleServerSearch() {
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  // Contadores rápidos para o topo
  const pendingCount = initialData.items.filter(
    (t) =>
      t.status === TicketStatus.ABERTO ||
      t.status === TicketStatus.EM_ANDAMENTO ||
      t.status === TicketStatus.AGUARDANDO_HOMOLOGACAO ||
      t.status === TicketStatus.RECUSADO_REABERTO
  ).length;

  const finishedCount = initialData.items.filter(
    (t) => t.status === TicketStatus.HOMOLOGADO_FECHADO
  ).length;

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. BARRA SUPERIOR LIMPA: BUSCA, STATUS RESUMIDO, TOGGLE E NOVO CHAMADO */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Campo de Busca Rápida */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleServerSearch();
              }
            }}
            placeholder="Buscar por código, título ou solicitante..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Contadores e Alternador de Visão */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Indicadores Rápidos */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 mr-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {pendingCount} Pendentes
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {finishedCount} Concluídos
            </span>
          </div>

          {/* Alternador de Modo (Kanban / Tabela) */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'kanban'
                  ? 'bg-white shadow-sm text-[#2563EB] font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Pipeline Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-white shadow-sm text-[#2563EB] font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Lista Detalhada
            </button>
          </div>

          {/* Botão Novo Chamado */}
          <Link
            href="/tickets/new"
            className="px-4 py-2 rounded-xl bg-[#2563EB] text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition shrink-0"
          >
            + Novo Chamado
          </Link>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. ÁREA DE EXIBIÇÃO: KANBAN OU TABELA                                  */}
      {/* ---------------------------------------------------------------------- */}
      {viewMode === 'kanban' ? (
        <TicketKanban tickets={filteredTickets} />
      ) : (
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
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      Nenhum chamado encontrado para a busca informada.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket: TicketListItem) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6 font-mono font-bold text-[#2563EB]">
                        #TK-{String(ticket.ticketNumber).padStart(4, '0')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 max-w-xs truncate">
                          {ticket.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          <FormattedDate date={ticket.createdAt} />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {ticket.sector.name}
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        {ticket.requester.name}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {ticket.executor ? (
                          ticket.executor.name
                        ) : (
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
      )}
    </div>
  );
}
