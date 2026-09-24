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
  const [isExporting, setIsExporting] = useState(false);

  // Modal para exibir justificativa de recusa detalhada
  const [activeReasonModal, setActiveReasonModal] = useState<{
    ticketNumber: number;
    ticketTitle: string;
    userName: string;
    reason: string;
    date: Date;
  } | null>(null);

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
  }, [page, search, sectorId, status, onlyRejected]);

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

  // Formato compacto: 23 Set • 19:11
  const formatDateCompact = (date: Date) => {
    const d = new Date(date);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} • ${hours}:${minutes}`;
  };

  return (
    <div className="space-y-5">
      {/* Barra de Filtros Compacta e Integrada */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Busca e Filtros em linha */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Busca textual */}
            <div>
              <input
                type="text"
                placeholder="Buscar chamado ou protocolo..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            {/* Setor */}
            <div>
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

            {/* Status Alvo */}
            <div>
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
                <option value={TicketStatus.EM_ANDAMENTO}>EM ANDAMENTO</option>
                <option value={TicketStatus.AGUARDANDO_HOMOLOGACAO}>
                  AGUARDANDO HOMOLOGAÇÃO
                </option>
                <option value={TicketStatus.HOMOLOGADO_FECHADO}>
                  HOMOLOGADO & FECHADO
                </option>
                <option value={TicketStatus.RECUSADO_REABERTO}>
                  RECUSADO (RETRABALHO)
                </option>
              </select>
            </div>

            {/* Toggle de Recusas Integrado */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setOnlyRejected(!onlyRejected);
                  setPage(1);
                }}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                  onlyRejected
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{onlyRejected ? '🔴' : '⚪'}</span>
                <span>Apenas Recusas (Retrabalho)</span>
              </button>
            </div>
          </div>

          {/* Botões de Exportação Compactos */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
            <button
              type="button"
              onClick={() => handleDownload('csv')}
              disabled={isExporting}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              title="Exportar CSV"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload('json')}
              disabled={isExporting}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              title="Exportar JSON"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Barra secundária: contagem de registros */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Exibindo página <strong>{page}</strong> de <strong>{totalPages || 1}</strong>
          </span>
          <span>
            Total auditado: <strong>{total}</strong> eventos
          </span>
        </div>
      </div>

      {/* Tabela de Auditoria Redesenhada (Visual Clean & Respirável) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-5">Data / Hora</th>
                <th className="py-3 px-4">Chamado</th>
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Transição</th>
                <th className="py-3 px-5 text-right">Parecer / Detalhe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin h-5 w-5 border-2 border-[#2563EB] border-t-transparent rounded-full mb-2" />
                    <p className="font-medium text-xs">Carregando trilha de auditoria...</p>
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
                  const userInitial = log.userName.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={log.id}
                      className={`transition ${
                        isRejection
                          ? 'bg-rose-50/30 hover:bg-rose-50/60'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* 1. Data Compacta */}
                      <td className="py-3.5 px-5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {formatDateCompact(log.createdAt)}
                      </td>

                      {/* 2. Chamado (Protocolo + Título na mesma linha) */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2 truncate">
                          <Link
                            href={`/tickets/${log.ticketId}`}
                            className="font-mono font-bold text-[#2563EB] hover:underline shrink-0"
                          >
                            #TK-{String(log.ticketNumber).padStart(4, '0')}
                          </Link>
                          <span
                            className="font-medium text-slate-800 truncate text-xs"
                            title={log.ticketTitle}
                          >
                            {log.ticketTitle}
                          </span>
                        </div>
                      </td>

                      {/* 3. Setor como Tag Clean */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                          {log.sectorName}
                        </span>
                      </td>

                      {/* 4. Responsável (Avatar Mini + Nome, e-mail no hover) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className="flex items-center gap-2"
                          title={`${log.userName} (${log.userEmail})`}
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {userInitial}
                          </div>
                          <span className="font-semibold text-slate-800 text-xs truncate max-w-[140px]">
                            {log.userName}
                          </span>
                        </div>
                      </td>

                      {/* 5. Transição com Badge Consolidada */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {log.fromStatus && (
                            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                              {log.fromStatus.replace('_', ' ')} →
                            </span>
                          )}
                          <StatusBadge status={log.toStatus} />
                        </div>
                      </td>

                      {/* 6. Parecer / Justificativa (Tag elegante se for recusa) */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {log.reason ? (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReasonModal({
                                ticketNumber: log.ticketNumber,
                                ticketTitle: log.ticketTitle,
                                userName: log.userName,
                                reason: log.reason!,
                                date: log.createdAt,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span>Ver Motivo da Recusa</span>
                          </button>
                        ) : log.comment ? (
                          <span
                            className="text-slate-500 italic text-[11px] truncate max-w-[160px] inline-block"
                            title={log.comment}
                          >
                            &quot;{log.comment}&quot;
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
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
          <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
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

      {/* Modal Limpo para Exibição do Motivo da Recusa */}
      {activeReasonModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                  ⚠️
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Justificativa de Recusa
                  </h3>
                  <span className="text-[11px] text-[#2563EB] font-bold font-mono">
                    #TK-{String(activeReasonModal.ticketNumber).padStart(4, '0')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReasonModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950 text-xs leading-relaxed font-medium mb-4">
              {activeReasonModal.reason}
            </div>

            <div className="text-[11px] text-slate-500 space-y-1 mb-5">
              <div>
                <strong>Homologador:</strong> {activeReasonModal.userName}
              </div>
              <div>
                <strong>Data do Apontamento:</strong>{' '}
                {new Date(activeReasonModal.date).toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveReasonModal(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
