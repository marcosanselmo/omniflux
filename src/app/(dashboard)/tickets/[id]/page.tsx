import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTicketDetailsAction } from '@/server/actions/ticket.actions';
import { requireAuth } from '@/lib/auth/session';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { TicketActionsBar } from '@/components/modules/tickets/ticket-actions-bar';
import { TicketTimeline } from '@/components/modules/tickets/ticket-timeline';

interface TicketDetailPageProps {
  params: {
    id: string;
  };
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const session = await requireAuth();
  const res = await getTicketDetailsAction(params.id);

  if (!res.success || !res.data) {
    notFound();
  }

  const ticket = res.data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/tickets"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition"
            title="Voltar para a fila"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#2563EB]">
                #TK-{String(ticket.ticketNumber).padStart(4, '0')}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Setor: {ticket.sector.name}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {ticket.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {/* Barra de Ações Contextuais de Workflow */}
      <TicketActionsBar ticket={ticket} user={session.user} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal: Informações e Comprovantes (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Detalhes da Solicitação */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-5">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
              Descrição da Demanda
            </h3>

            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
              {ticket.description}
            </p>

            {/* Seção Financeira (se setor for financeiro) */}
            {ticket.sector.isFinancial && (
              <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                    Valor Total Homologado
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {ticket.amount
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(ticket.amount))
                      : 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                    Data de Vencimento
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {ticket.dueDate
                      ? new Date(ticket.dueDate).toLocaleDateString('pt-BR')
                      : 'Não estipulada'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card de Comprovantes e Evidências Anexadas */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Comprovantes & Anexos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evidências arquivadas com segurança no storage corporativo
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {ticket.attachments.length} {ticket.attachments.length === 1 ? 'arquivo' : 'arquivos'}
              </span>
            </div>

            {ticket.attachments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Nenhum arquivo ou foto de comprovação anexado até o momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ticket.attachments.map((att) => {
                  const isCreation = att.stage === 'CRIACAO';
                  return (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between hover:bg-white hover:border-[#2563EB] transition group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isCreation
                              ? 'bg-blue-50 text-[#2563EB]'
                              : 'bg-purple-50 text-purple-600'
                          }`}
                        >
                          {att.mimeType.startsWith('image/') ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isCreation
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {isCreation ? 'Evidência (Abertura)' : 'Conclusão (Execução)'}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 truncate mt-0.5" title={att.fileName}>
                            {att.fileName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {(att.fileSize / 1024).toFixed(1)} KB • Por {att.uploader.name}
                          </div>
                        </div>
                      </div>

                      <a
                        href={`http://localhost:9000/omniflux-media/${att.fileKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-[#2563EB] transition"
                        title="Visualizar arquivo"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Lateral: Metadados e Linha do Tempo (1/3) */}
        <div className="space-y-6">
          {/* Card de Metadados de Governança */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Governança do Chamado
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Solicitante:</span>
                <span className="font-bold text-slate-800">{ticket.requester.name}</span>
                <span className="text-slate-400 text-[11px] block">{ticket.requester.email}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Executor Responsável:</span>
                {ticket.executor ? (
                  <>
                    <span className="font-bold text-slate-800">{ticket.executor.name}</span>
                    <span className="text-slate-400 text-[11px] block">{ticket.executor.email}</span>
                  </>
                ) : (
                  <span className="font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                    Aguardando executor assumir
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-0.5">Abertura:</span>
                <span className="font-medium text-slate-700">
                  {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>

              {ticket.closedAt && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Homologação Final:</span>
                  <span className="font-medium text-emerald-700">
                    {new Date(ticket.closedAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Linha do Tempo de Auditoria */}
          <TicketTimeline history={ticket.history} />
        </div>
      </div>
    </div>
  );
}
