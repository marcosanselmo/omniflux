'use client';

import React, { useState } from 'react';
import { GlobalMetricsPayload } from '@/server/actions/metrics.actions';

interface ReportsViewerProps {
  initialData: GlobalMetricsPayload;
}

export function ReportsViewer({ initialData }: ReportsViewerProps) {
  const [data] = useState<GlobalMetricsPayload>(initialData);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const handleExportCsv = () => {
    const headers = [
      'Setor',
      'Total de Chamados',
      'Concluídos',
      'Em Aberto',
      'Qtd Retrabalhos',
      'Taxa Retrabalho (%)',
      'SLA Médio (horas)',
      'Volume Financeiro (R$)',
    ];

    const rows = data.sectorMetrics.map((s) => [
      `"${s.sectorName}"`,
      s.totalTickets,
      s.closedTickets,
      s.openTickets,
      s.reworkCount,
      `"${s.reworkRate.toFixed(1)}%"`,
      s.avgResolutionHours.toFixed(1),
      `"${s.totalFinancialAmount.toFixed(2)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join(
      '\n'
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omniflux-relatorio-conformidade-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* 4 Cards de KPIs Executivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Chamados */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Chamados
            </span>
            <span className="h-8 w-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center text-sm font-bold">
              📊
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {data.totalTickets}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {data.totalTickets > 0
                ? `${Math.round((data.totalClosed / data.totalTickets) * 100)}% concluídos`
                : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {data.totalClosed} fechados, {data.totalInExecution} em execução
          </p>
        </div>

        {/* SLA Médio de Resolução (MTTR) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              SLA Médio (MTTR)
            </span>
            <span className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
              ⏱️
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {data.avgResolutionTimeHours < 24
                ? `${data.avgResolutionTimeHours}h`
                : `${(data.avgResolutionTimeHours / 24).toFixed(1)} dias`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tempo médio da abertura ao encerramento
          </p>
        </div>

        {/* Taxa de Retrabalho (Recusas) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Taxa de Retrabalho
            </span>
            <span className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm font-bold">
              🔄
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {data.globalReworkRate}%
            </span>
            <span
              className={`text-xs font-semibold ${
                data.globalReworkRate > 15 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {data.totalReworked} chamados
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Chamados com recusa de homologação
          </p>
        </div>

        {/* Volume Financeiro Auditado */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Volume Financeiro
            </span>
            <span className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
              💰
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(data.totalFinancialVolume)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Soma de valores tramitados em setores financeiros
          </p>
        </div>
      </div>

      {/* Tabela de Indicadores e Desempenho por Setor */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Desempenho Operacional por Setor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Análise comparativa de volumetria, retrabalhos, tempo de resolução e conformidade.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-sm self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exportar Relatório (CSV)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Setor</th>
                <th className="py-3.5 px-4 text-center">Total</th>
                <th className="py-3.5 px-4 text-center">Concluídos</th>
                <th className="py-3.5 px-4 text-center">Em Aberto</th>
                <th className="py-3.5 px-4 text-center">Retrabalhos</th>
                <th className="py-3.5 px-4 text-center">Taxa Retrabalho</th>
                <th className="py-3.5 px-4 text-center">SLA Médio</th>
                <th className="py-3.5 px-6 text-right">Volume Financeiro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.sectorMetrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhum setor cadastrado.
                  </td>
                </tr>
              ) : (
                data.sectorMetrics.map((sec) => (
                  <tr key={sec.sectorId} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {sec.sectorName}
                      {sec.isFinancial && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                          Financeiro
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                      {sec.totalTickets}
                    </td>
                    <td className="py-4 px-4 text-center text-emerald-600 font-semibold">
                      {sec.closedTickets}
                    </td>
                    <td className="py-4 px-4 text-center text-amber-600 font-semibold">
                      {sec.openTickets}
                    </td>
                    <td className="py-4 px-4 text-center text-rose-600 font-semibold">
                      {sec.reworkCount}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          sec.reworkRate > 20
                            ? 'bg-rose-100 text-rose-700'
                            : sec.reworkRate > 0
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {sec.reworkRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-[11px] text-slate-600">
                      {sec.avgResolutionHours > 0
                        ? `${sec.avgResolutionHours.toFixed(1)}h`
                        : '—'}
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-slate-800">
                      {sec.isFinancial
                        ? formatCurrency(sec.totalFinancialAmount)
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabela de Produtividade da Equipe */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Produtividade & Atuação da Equipe
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro das ações de execução e vistos de homologação concedidos ou recusados por colaborador.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Colaborador</th>
                <th className="py-3.5 px-6">E-mail</th>
                <th className="py-3.5 px-4 text-center">Chamados Executados</th>
                <th className="py-3.5 px-4 text-center">Homologações Aprovadas</th>
                <th className="py-3.5 px-4 text-center">Recusas Emitidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.userProductivity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Ainda não há registros de atividade de execução ou homologação.
                  </td>
                </tr>
              ) : (
                data.userProductivity.map((u) => (
                  <tr key={u.userId} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {u.userName}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">{u.userEmail}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#2563EB]">
                      {u.executedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                      {u.homologatedApprovedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-rose-600">
                      {u.homologatedRejectedCount}
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
