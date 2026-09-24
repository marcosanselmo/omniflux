import React from 'react';
import { TicketStatus } from '@prisma/client';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case TicketStatus.ABERTO:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-300 shadow-sm ${sizeClasses} ${className}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
          </span>
          Aberto
        </span>
      );

    case TicketStatus.EM_ANDAMENTO:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-sm ${sizeClasses} ${className}`}
        >
          <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Em Execução
        </span>
      );

    case TicketStatus.AGUARDANDO_HOMOLOGACAO:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-purple-50 text-purple-800 border border-purple-300 shadow-sm ${sizeClasses} ${className}`}
        >
          <svg className="w-3.5 h-3.5 text-purple-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Aguardando Homologação
        </span>
      );

    case TicketStatus.RECUSADO_REABERTO:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-rose-50 text-rose-800 border border-rose-300 shadow-sm ${sizeClasses} ${className}`}
        >
          <svg className="w-3.5 h-3.5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Recusado (Retrabalho)
        </span>
      );

    case TicketStatus.HOMOLOGADO_FECHADO:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm ${sizeClasses} ${className}`}
        >
          <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          Homologado & Fechado
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses} ${className}`}
        >
          {status}
        </span>
      );
  }
}
