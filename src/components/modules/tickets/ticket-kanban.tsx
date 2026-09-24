'use client';

import React from 'react';
import Link from 'next/link';
import { TicketListItem } from '@/types/ticket';
import { TicketStatus } from '@prisma/client';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { FormattedDate } from '@/components/ui/formatted-date';

interface TicketKanbanProps {
  tickets: TicketListItem[];
}

interface ColumnConfig {
  status: TicketStatus;
  title: string;
  subtitle: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  columnBg: string;
  icon: React.ReactNode;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: TicketStatus.ABERTO,
    title: 'Abertos',
    subtitle: 'Aguardando início',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    borderAccent: 'border-t-sky-500',
    columnBg: 'bg-sky-50/30',
    icon: (
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
      </span>
    ),
  },
  {
    status: TicketStatus.EM_ANDAMENTO,
    title: 'Em Execução',
    subtitle: 'Com o executor',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderAccent: 'border-t-amber-500',
    columnBg: 'bg-amber-50/20',
    icon: (
      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    status: TicketStatus.AGUARDANDO_HOMOLOGACAO,
    title: 'Aguardando Visto',
    subtitle: 'Pendente de homologação',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    borderAccent: 'border-t-purple-600',
    columnBg: 'bg-purple-50/30',
    icon: (
      <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    status: TicketStatus.RECUSADO_REABERTO,
    title: 'Retrabalho',
    subtitle: 'Recusados para correção',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    borderAccent: 'border-t-rose-500',
    columnBg: 'bg-rose-50/25',
    icon: (
      <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    status: TicketStatus.HOMOLOGADO_FECHADO,
    title: 'Homologados',
    subtitle: 'Concluídos com visto',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderAccent: 'border-t-emerald-500',
    columnBg: 'bg-emerald-50/20',
    icon: (
      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

export function TicketKanban({ tickets }: TicketKanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
      {COLUMNS.map((col) => {
        const columnTickets = tickets.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className={`rounded-2xl border border-slate-200/80 ${col.columnBg} flex flex-col min-h-[520px] shadow-sm overflow-hidden border-t-4 ${col.borderAccent}`}
          >
            {/* Cabeçalho da Coluna Kanban */}
            <div className="p-3.5 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {col.icon}
                <div>
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                    {col.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {col.subtitle}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-black ${col.badgeBg} ${col.badgeText}`}
              >
                {columnTickets.length}
              </span>
            </div>

            {/* Lista de Cards da Coluna */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[700px]">
              {columnTickets.length === 0 ? (
                <div className="h-44 border-2 border-dashed border-slate-200/90 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-xs font-semibold text-slate-400">
                    Vazio
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Nenhum chamado nesta etapa
                  </span>
                </div>
              ) : (
                columnTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#2563EB]/40 transition group flex flex-col justify-between space-y-3"
                  >
                    {/* Topo do Card: Código + Prioridade */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#2563EB] group-hover:underline">
                        #TK-{String(ticket.ticketNumber).padStart(4, '0')}
                      </span>
                      <PriorityBadge priority={ticket.priority} />
                    </div>

                    {/* Título e Setor */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#2563EB] transition line-clamp-2">
                        {ticket.title}
                      </h4>
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[180px]">
                          {ticket.sector.name}
                        </span>
                        {ticket.attachmentsCount > 0 && (
                          <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            📎 {ticket.attachmentsCount}
                          </span>
                        )}
                        {ticket.sector.isFinancial && ticket.amount && (
                          <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                            R$ {ticket.amount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rodapé do Card: Solicitante / Executor + Data e Ação */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="min-w-0 pr-2">
                        <div className="text-slate-700 font-medium truncate max-w-[110px]">
                          {ticket.requester.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          <FormattedDate date={ticket.createdAt} />
                        </div>
                      </div>

                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] font-bold hover:bg-blue-600 hover:text-white transition shrink-0"
                      >
                        Abrir &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
