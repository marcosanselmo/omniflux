'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TicketStatus } from '@prisma/client';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getGlobalAuditLogsAction,
  exportAuditLogsAction,
  AuditLogItem,
} from '@/server/actions/audit.actions';

interface SectorOption {
  id: string;
  name: string;
}

interface AuditViewerProps {
  sectors: SectorOption[];
}

export function AuditViewer({ sectors }: AuditViewerProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [status, setStatus] = useState<string>('');
  const [onlyRejected, setOnlyRejected] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getGlobalAuditLogsAction({
        page,
        pageSize: 15,
        search: search.trim() || undefined,
        sectorId: sectorId || undefined,
        status: (status as TicketStatus) || undefined,
        onlyRejected,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.success && res.data) {
        setLogs(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      // Falha tratada
    } finally {
      setIsLoading(false);
    }
  }, [page, search, sectorId, status, onlyRejected, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleDownload = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      const res = await exportAuditLogsAction({
        sectorId: sectorId || undefined,
        status: (status as TicketStatus) || undefined,
        onlyRejected,
      });

      if (res.success && res.data) {
        const content = format === 'csv' ? res.data.csv : res.data.json;
        const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `omniflux-auditoria-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Ações de Exportação */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Busca textual */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Busca Textual
              </label>
              <input
                type="text"
                placeholder="Protocolo, parecer ou título..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            {/* Setor */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Setor
              </label>
              <select
                value={sectorId}
                onChange={(e) => {
                  setSectorId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              >
                <option value="">Todos os Setores</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Novo */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Status Alvo
              </label>
              <select
                value={status}
                disabled={onlyRejected}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] disabled:opacity-50"
              >
                <option value="">Todos os Status</option>
                <option value={TicketStatus.ABERTO}>ABERTO</option>
                <option value={TicketStatus.EM_ANDAMENTO}>EM_ANDAMENTO</option>
                <option value={TicketStatus.AGUARDANDO_HOMOLOGACAO}>
                  AGUARDANDO_HOMOLOGACAO
                </option>
                <option value={TicketStatus.HOMOLOGADO_FECHADO}>
                  HOMOLOGADO_FECHADO
                </option>
                <option value={TicketStatus.RECUSADO_REABERTO}>
                  RECUSADO_REABERTO
                </option>
              </select>
            </div>

            {/* Data Inicial */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                A partir de
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            {/* Data Final */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Até
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Botões de Exportação */}
          <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => handleDownload('csv')}
              disabled={isExporting}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              title="Exportar arquivo CSV compatível com Excel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload('json')}
              disabled={isExporting}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              title="Exportar JSON para compliance"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Exportar JSON</span>
            </button>
          </div>
        </div>

        {/* Toggle para filtrar apenas recusas */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyRejected}
              onChange={(e) => {
                setOnlyRejected(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-xs font-semibold text-rose-700">
              🚨 Filtrar exclusivamente recusas de homologação (Retrabalho)
            </span>
          </label>
          <span className="text-xs text-slate-500 font-medium">
            Total de eventos registrados: <strong className="text-slate-800">{total}</strong>
          </span>
        </div>
      </div>

      {/* Tabela Imutável de Auditoria */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4">Chamado</th>
                <th className="py-3.5 px-4">Setor</th>
                <th className="py-3.5 px-4">Responsável</th>
                <th className="py-3.5 px-4">Transição de Estado</th>
                <th className="py-3.5 px-4">Justificativa / Parecer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-[#2563EB] border-t-transparent rounded-full mb-2" />
                    <p className="font-medium">Carregando trilha de auditoria...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhum registro de auditoria encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isRejection = log.toStatus === TicketStatus.RECUSADO_REABERTO;
                  return (
                    <tr
                      key={log.id}
                      className={`transition ${
                        isRejection
                          ? 'bg-rose-50/40 hover:bg-rose-50/70'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/tickets/${log.ticketId}`}
                          className="font-bold text-[#2563EB] hover:underline"
                        >
                          #TK-{String(log.ticketNumber).padStart(4, '0')}
                        </Link>
                        <p className="text-[11px] text-slate-600 truncate max-w-xs font-medium">
                          {log.ticketTitle}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                        {log.sectorName}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {log.userName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {log.userEmail}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {log.fromStatus ? (
                            <>
                              <StatusBadge status={log.fromStatus} />
                              <span className="text-slate-400 font-bold">→</span>
                            </>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              INÍCIO
                            </span>
                          )}
                          <StatusBadge status={log.toStatus} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        {log.reason ? (
                          <div className="p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-900 text-[11px] font-medium leading-relaxed">
                            <span className="font-bold block text-[10px] uppercase tracking-wide text-rose-700 mb-0.5">
                              Motivo da Recusa:
                            </span>
                            {log.reason}
                          </div>
                        ) : log.comment ? (
                          <span className="text-slate-600 italic">
                            &quot;{log.comment}&quot;
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Página <strong className="text-slate-800">{page}</strong> de{' '}
              <strong className="text-slate-800">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
