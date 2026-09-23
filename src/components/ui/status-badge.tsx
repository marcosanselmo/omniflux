import React from 'react';
import { TicketStatus } from '@prisma/client';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  switch (status) {
    case TicketStatus.ABERTO:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse" />
          Aberto
        </span>
      );

    case TicketStatus.EM_ANDAMENTO:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5" />
          Em Execução
        </span>
      );

    case TicketStatus.AGUARDANDO_HOMOLOGACAO:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mr-1.5" />
          Aguardando Homologação
        </span>
      );

    case TicketStatus.HOMOLOGADO_FECHADO:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Homologado & Fechado
        </span>
      );

    case TicketStatus.RECUSADO_REABERTO:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mr-1.5" />
          Recusado (Retrabalho)
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          {status}
        </span>
      );
  }
}
