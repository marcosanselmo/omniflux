import React from 'react';
import { getTicketsAction } from '@/server/actions/ticket.actions';
import { getActiveSectorsAction } from '@/server/actions/sector.actions';
import { TicketList } from '@/components/modules/tickets/ticket-list';
import { TicketStatus, TicketPriority } from '@prisma/client';

interface TicketsPageProps {
  searchParams: {
    status?: TicketStatus;
    sectorId?: string;
    priority?: TicketPriority;
    search?: string;
    page?: string;
  };
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const [ticketsRes, sectorsRes] = await Promise.all([
    getTicketsAction({
      status: searchParams.status,
      sectorId: searchParams.sectorId,
      priority: searchParams.priority,
      search: searchParams.search,
      page: searchParams.page ? Number(searchParams.page) : 1,
      pageSize: 20,
    }),
    getActiveSectorsAction(),
  ]);

  const initialData = ticketsRes.success
    ? ticketsRes.data
    : { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };

  const sectors = sectorsRes.success ? sectorsRes.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Fila de Chamados
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestão integrada de solicitações, prazos e aprovações intersetoriais.
          </p>
        </div>
      </div>

      <TicketList initialData={initialData} sectors={sectors} />
    </div>
  );
}
