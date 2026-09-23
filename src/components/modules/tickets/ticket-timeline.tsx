import React from 'react';
import { TicketHistoryEntry } from '@/types/ticket';
import { StatusBadge } from '@/components/ui/status-badge';
import { TicketStatus } from '@prisma/client';

interface TicketTimelineProps {
  history: TicketHistoryEntry[];
}

export function TicketTimeline({ history }: TicketTimelineProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Linha do Tempo de Auditoria
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro imutável de todas as transições de estado deste chamado
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {history.length} {history.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {history.map((entry) => {
          const isRejection = entry.toStatus === TicketStatus.RECUSADO_REABERTO;
          const isClosure = entry.toStatus === TicketStatus.HOMOLOGADO_FECHADO;

          let dotColor = 'bg-blue-500';
          if (isRejection) dotColor = 'bg-rose-500';
          if (isClosure) dotColor = 'bg-emerald-500';

          return (
            <div key={entry.id} className="relative group">
              {/* Marcador na Linha */}
              <div
                className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ring-2 ring-slate-100 ${dotColor}`}
              />

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {entry.user.name}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(entry.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {entry.fromStatus && (
                      <>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">
                          {entry.fromStatus}
                        </span>
                        <span className="text-slate-300 text-xs">&rarr;</span>
                      </>
                    )}
                    <StatusBadge status={entry.toStatus} />
                  </div>
                </div>

                {/* Justificativa de Recusa em Destaque */}
                {entry.reason && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800 space-y-1">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-rose-600 block">
                      Motivo Formal de Retrabalho:
                    </span>
                    <p className="font-medium">{entry.reason}</p>
                  </div>
                )}

                {/* Comentário Geral */}
                {entry.comment && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    {entry.comment}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
