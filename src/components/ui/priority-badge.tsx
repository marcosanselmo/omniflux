import React from 'react';
import { TicketPriority } from '@prisma/client';

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  switch (priority) {
    case TicketPriority.URGENTE:
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 ${className}`}
        >
          Urgente
        </span>
      );

    case TicketPriority.ALTA:
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 ${className}`}
        >
          Alta
        </span>
      );

    case TicketPriority.MEDIA:
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          Média
        </span>
      );

    case TicketPriority.BAIXA:
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
        >
          Baixa
        </span>
      );

    default:
      return <span>{priority}</span>;
  }
}
