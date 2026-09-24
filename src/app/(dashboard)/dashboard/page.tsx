import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { TicketStatus, GlobalRole, SectorRole } from '@prisma/client';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { FormattedDate } from '@/components/ui/formatted-date';
import { SectorPieChart } from '@/components/modules/dashboard/sector-pie-chart';

export default async function DashboardPage() {
  const session = await requireAuth();
  const user = session.user;

  // 1. Coleta de Métricas Operacionais com base no RBAC do usuário
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
    openCount,
    inProgressCount,
    pendingHomologationCount,
    reworkCount,
    closedCount,
    recentTickets,
    sectorsWithCounts,
  ] = await Promise.all([
    prisma.ticket.count({ where: scopeFilter }),
    prisma.ticket.count({
      where: { ...scopeFilter, status: TicketStatus.ABERTO },
    }),
    prisma.ticket.count({
      where: { ...scopeFilter, status: TicketStatus.EM_ANDAMENTO },
    }),
    prisma.ticket.count({
      where: { ...scopeFilter, status: TicketStatus.AGUARDANDO_HOMOLOGACAO },
    }),
    prisma.ticket.count({
      where: { ...scopeFilter, status: TicketStatus.RECUSADO_REABERTO },
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
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: {
        tickets: {
          _count: 'desc',
        },
      },
    }),
  ]);

  const sectorChartData = sectorsWithCounts.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    count: s._count.tickets,
  }));

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. SEÇÃO DE OVERVIEW: PIPELINE DE ETAPAS DA ESTEIRA OPERACIONAL       */}
      {/* ---------------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Visão Geral Operacional por Etapa
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fluxo integrado de solicitações e esteira de aprovação
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Atualizado em tempo real
          </span>
        </div>

        {/* Grade com as 5 Etapas do Workflow + Total */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card Total */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col justify-between transition hover:shadow-card-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-3">
              {totalTickets}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">demandas globais</span>
          </div>

          {/* Card 1: Aberto */}
          <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-card flex flex-col justify-between transition hover:shadow-card-hover border-l-4 border-l-sky-500">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                1. Abertos
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                </span>
              </div>
            </div>
            <div className="text-2xl font-black text-sky-950 tracking-tight mt-3">
              {openCount}
            </div>
            <span className="text-[10px] text-sky-600 font-medium mt-0.5">aguardando início</span>
          </div>

          {/* Card 2: Em Execução */}
          <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-card flex flex-col justify-between transition hover:shadow-card-hover border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                2. Em Execução
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-black text-amber-950 tracking-tight mt-3">
              {inProgressCount}
            </div>
            <span className="text-[10px] text-amber-600 font-medium mt-0.5">em andamento</span>
          </div>

          {/* Card 3: Aguardando Homologação (Destaque) */}
          <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-card flex flex-col justify-between transition hover:shadow-card-hover border-l-4 border-l-purple-600 ring-1 ring-purple-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                3. Aguardando Visto
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-black text-purple-950 tracking-tight mt-3">
              {pendingHomologationCount}
            </div>
            <span className="text-[10px] text-purple-600 font-bold mt-0.5">pendente aprovação</span>
          </div>

          {/* Card 4: Recusado (Retrabalho) */}
          <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-card flex flex-col justify-between transition hover:shadow-card-hover border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                4. Retrabalho
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-black text-rose-950 tracking-tight mt-3">
              {reworkCount}
            </div>
            <span className="text-[10px] text-rose-600 font-medium mt-0.5">devolvidos</span>
          </div>

          {/* Card 5: Homologados & Fechados */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-card flex flex-col justify-between transition hover:shadow-card-hover border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                5. Homologados
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-950 tracking-tight mt-3">
              {closedCount}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5">concluídos com visto</span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. CARDS CENTRAIS: GRÁFICO PIZZA SETORIAL E ATIVIDADE OPERACIONAL       */}
      {/* ---------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Demanda por Setor com Gráfico de Pizza (1/3) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-800">
                Demanda por Setor
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {sectorsWithCounts.length} setores ativos
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Comparativo percentual de chamados abertos por área
            </p>

            {/* Gráfico Donut / Pizza */}
            <SectorPieChart sectors={sectorChartData} totalTickets={totalTickets} />
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href="/tickets"
              className="text-slate-500 hover:text-slate-800 font-medium transition"
            >
              Ver na Esteira &rarr;
            </Link>
            <Link
              href="/tickets/new"
              className="font-bold text-[#2563EB] hover:underline"
            >
              + Abrir Solicitação
            </Link>
          </div>
        </div>

        {/* Card de Atividade Operacional / Gráfico Semanal (2/3) */}
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

          {/* Gráfico de Barras Semanal */}
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
      {/* 3. TABELA DE CHAMADOS RECENTES COM BADGES REFINADOS E DATA SEGURA     */}
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
              Ver Esteira Kanban &rarr;
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
                <th className="py-3.5 px-6">Status da Esteira</th>
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
                    <td className="py-4 px-6">
                      <div className="text-slate-800 font-semibold max-w-xs truncate">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <FormattedDate date={t.createdAt} />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
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
      </div>
    </div>
  );
}
