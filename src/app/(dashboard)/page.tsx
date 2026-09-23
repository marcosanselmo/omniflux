import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { TicketStatus, GlobalRole, SectorRole } from '@prisma/client';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';

export default async function DashboardPage() {
  const session = await requireAuth();
  const user = session.user;

  // 1. Coleta de Métricas Operacionais
  const isGlobalAdmin = user.globalRole === GlobalRole.ADMIN_GERAL;

  const staffRoles: readonly SectorRole[] = [
    SectorRole.EXECUTOR,
    SectorRole.HOMOLOGADOR,
  ];
  const activeSectorIds = user.sectorRoles
    .filter((sr) => staffRoles.includes(sr.role))
    .map((sr) => sr.sectorId);

  const scopeFilter = isGlobalAdmin
    ? {}
    : {
        OR: [
          { requesterId: user.id },
          ...(activeSectorIds.length > 0 ? [{ sectorId: { in: activeSectorIds } }] : []),
        ],
      };

  const [
    totalTickets,
    inProgressCount,
    pendingHomologationCount,
    closedCount,
    recentTickets,
    sectorsWithCounts,
  ] = await Promise.all([
    prisma.ticket.count({ where: scopeFilter }),
    prisma.ticket.count({
      where: { ...scopeFilter, status: TicketStatus.EM_ANDAMENTO },
    }),
    prisma.ticket.count({
      where: { ...scopeFilter, status: TicketStatus.AGUARDANDO_HOMOLOGACAO },
    }),
    prisma.ticket.count({
      where: { ...scopeFilter, status: TicketStatus.HOMOLOGADO_FECHADO },
    }),
    prisma.ticket.findMany({
      where: scopeFilter,
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        sector: {
          select: { name: true, slug: true },
        },
        requester: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.sector.findMany({
      where: { isActive: true },
      take: 4,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { tickets: true },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. SEÇÃO DE OVERVIEW: 4 CARDS MÉTRICOS (ESTILO REFERÊNCIA)             */}
      {/* ---------------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            Visão Geral Operacional
          </h2>
          <span className="text-xs font-medium text-slate-400">
            Atualizado em tempo real
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex items-center gap-4 transition hover:shadow-card-hover">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Chamados
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {totalTickets}
              </div>
            </div>
          </div>

          {/* Card 2: Em Andamento */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex items-center gap-4 transition hover:shadow-card-hover">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Em Execução
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {inProgressCount}
              </div>
            </div>
          </div>

          {/* Card 3: Aguardando Homologação / Pendente */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex items-center gap-4 transition hover:shadow-card-hover">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Aguardando Visto
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {pendingHomologationCount}
              </div>
            </div>
          </div>

          {/* Card 4: Concluídos */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex items-center gap-4 transition hover:shadow-card-hover">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Homologados
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {closedCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. CARDS CENTRAIS: ANÁLISE SETORIAL E ATIVIDADE (ESTILO REFERÊNCIA)     */}
      {/* ---------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Análise Setorial (1/3) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Demanda por Setor
              </h3>
              <span className="text-xs font-medium text-slate-400">Ativos</span>
            </div>

            <div className="space-y-4 my-6">
              {sectorsWithCounts.map((s, idx) => {
                const colors = ['bg-[#2563EB]', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500'];
                const color = colors[idx % colors.length];
                const percentage =
                  totalTickets > 0 ? Math.round((s._count.tickets / totalTickets) * 100) : 0;

                return (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                        {s.name}
                      </span>
                      <span className="font-bold text-slate-900">
                        {s._count.tickets} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total de Setores: {sectorsWithCounts.length}</span>
            <Link href="/tickets/new" className="font-semibold text-[#2563EB] hover:underline">
              + Abrir Solicitação
            </Link>
          </div>
        </div>

        {/* Card de Atividade Operacional / Gráfico de Barras Estilizado (2/3) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Atividade Operacional
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Volume de chamados processados na esteira de aprovação
              </p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <span className="px-3 py-1 bg-white rounded-lg shadow-sm text-slate-900">Semana</span>
              <span className="px-3 py-1 hover:text-slate-900 transition cursor-pointer">Mês</span>
            </div>
          </div>

          {/* Gráfico de Barras Semanal Inspirado no Modelo */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-4">
            {[
              { day: 'Seg', height: '65%', count: 12 },
              { day: 'Ter', height: '40%', count: 8 },
              { day: 'Qua', height: '85%', count: 18 },
              { day: 'Qui', height: '55%', count: 11 },
              { day: 'Sex', height: '100%', count: 22 },
              { day: 'Sáb', height: '30%', count: 5 },
              { day: 'Dom', height: '15%', count: 2 },
            ].map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div
                  className="w-full max-w-[42px] bg-[#182234] rounded-t-xl group-hover:bg-[#2563EB] transition-all duration-200 relative cursor-pointer"
                  style={{ height: bar.height }}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded font-mono transition">
                    {bar.count}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-800 transition">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Média diária de resolução: 14 chamados</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Taxa de Homologação: 94.2%
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. TABELA DE CHAMADOS RECENTES (ESTILO 'RECENT ORDER LIST')              */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Chamados Recentes
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Últimas demandas movimentadas na esteira
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tickets"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Ver Todos os Chamados &rarr;
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Código</th>
                <th className="py-3.5 px-6">Solicitante</th>
                <th className="py-3.5 px-6">Título da Demanda</th>
                <th className="py-3.5 px-6">Setor</th>
                <th className="py-3.5 px-6">Prioridade</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum chamado aberto recentemente no sistema.
                  </td>
                </tr>
              ) : (
                recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-mono font-bold text-[#2563EB]">
                      #TK-{String(t.ticketNumber).padStart(4, '0')}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-800">
                      {t.requester.name}
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium max-w-xs truncate">
                      {t.title}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {t.sector.name}
                    </td>
                    <td className="py-4 px-6">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-xs text-[#2563EB] bg-blue-50 hover:bg-blue-100 transition"
                      >
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
