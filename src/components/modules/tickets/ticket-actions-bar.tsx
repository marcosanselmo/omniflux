'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TicketDetail } from '@/types/ticket';
import { AuthUser } from '@/types/auth';
import { TicketStatus, AttachmentStage } from '@prisma/client';
import { transitionTicketAction } from '@/server/actions/ticket.actions';
import { canExecuteInSector, canHomologateInSector } from '@/lib/auth/rbac';
import { FileUploader } from '@/components/common/file-uploader';
import { UploadActionResult } from '@/server/actions/upload.actions';
import { FormattedDate } from '@/components/ui/formatted-date';

interface TicketActionsBarProps {
  ticket: TicketDetail;
  user: AuthUser;
}

export function TicketActionsBar({ ticket, user }: TicketActionsBarProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados de Modais
  const [isConcludeModalOpen, setIsConcludeModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [comment, setComment] = useState('');
  const [proofFile, setProofFile] = useState<UploadActionResult | null>(null);

  const canExecute = canExecuteInSector(user, ticket.sectorId);
  const canHomologate = canHomologateInSector(user, ticket.sectorId);

  async function handleTransition(
    targetStatus: TicketStatus,
    reasonText?: string,
    proofData?: UploadActionResult | null
  ) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await transitionTicketAction({
        ticketId: ticket.id,
        targetStatus,
        reason: reasonText,
        comment: comment || undefined,
        proofAttachment: proofData
          ? {
              fileKey: proofData.fileKey,
              fileName: proofData.fileName,
              mimeType: proofData.mimeType,
              fileSize: proofData.fileSize,
              stage: AttachmentStage.EXECUCAO,
            }
          : undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error);
        return;
      }

      setIsConcludeModalOpen(false);
      setIsRejectModalOpen(false);
      setComment('');
      setRejectReason('');
      setProofFile(null);
      router.refresh();
    } catch {
      setErrorMessage('Erro de conexão ao processar transição de estado.');
    } finally {
      setIsLoading(false);
    }
  }

  // Se o ticket já estiver homologado e fechado, nenhuma ação de workflow é permitida
  if (ticket.status === TicketStatus.HOMOLOGADO_FECHADO) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-800 font-semibold">
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Este chamado foi homologado com visto final e está encerrado de forma imutável.
        </span>
        {ticket.closedAt && (
          <span className="text-slate-500 font-normal flex items-center gap-1">
            Encerrado em: <FormattedDate date={ticket.closedAt} includeTime />
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
            &times;
          </button>
        </div>
      )}

      {/* Barra de Ações Rápidas */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Ações de Workflow
          </span>
          <span className="text-xs text-slate-600">
            Disponíveis de acordo com seu papel atribuído neste setor
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Ação 1: Assumir Chamado (ABERTO -> EM_ANDAMENTO) */}
          {ticket.status === TicketStatus.ABERTO && canExecute && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleTransition(TicketStatus.EM_ANDAMENTO)}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition disabled:opacity-50 cursor-pointer"
            >
              Assumir Chamado
            </button>
          )}

          {/* Ação 2: Concluir Execução (EM_ANDAMENTO -> AGUARDANDO_HOMOLOGACAO) */}
          {ticket.status === TicketStatus.EM_ANDAMENTO && canExecute && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setIsConcludeModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition disabled:opacity-50 cursor-pointer"
            >
              Concluir & Enviar p/ Homologação
            </button>
          )}

          {/* Ação 3: Reassumir Retrabalho (RECUSADO_REABERTO -> EM_ANDAMENTO) */}
          {ticket.status === TicketStatus.RECUSADO_REABERTO && canExecute && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleTransition(TicketStatus.EM_ANDAMENTO)}
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition disabled:opacity-50 cursor-pointer"
            >
              Reassumir Retrabalho
            </button>
          )}

          {/* Ação 4 & 5: Homologação (Visto Final ou Recusa) */}
          {ticket.status === TicketStatus.AGUARDANDO_HOMOLOGACAO && canHomologate && (
            <>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setIsRejectModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition disabled:opacity-50 cursor-pointer"
              >
                Recusar (Retrabalho)
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleTransition(TicketStatus.HOMOLOGADO_FECHADO)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
              >
                Aprovar com Visto Final
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal de Conclusão com Anexo de Comprovante */}
      {isConcludeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Concluir Execução do Chamado
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {ticket.sector.requiresProofFile
                  ? `Este setor exige comprovante obrigatório do tipo ${ticket.sector.allowedProofTypes}.`
                  : 'O anexo de comprovante é opcional para este setor.'}
              </p>
            </div>

            {/* Uploader de Arquivo */}
            <FileUploader
              ticketId={ticket.id}
              stage={AttachmentStage.EXECUCAO}
              onUploaded={(file) => setProofFile(file)}
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Parecer / Observações do Executor
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Descreva o procedimento realizado, substituição de peças ou instruções finais..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setIsConcludeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLoading || (ticket.sector.requiresProofFile && !proofFile)}
                onClick={() =>
                  handleTransition(
                    TicketStatus.AGUARDANDO_HOMOLOGACAO,
                    undefined,
                    proofFile
                  )
                }
                className="px-5 py-2 rounded-xl bg-purple-600 text-xs font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-40 cursor-pointer"
              >
                {isLoading ? 'Enviando...' : 'Submeter para Homologação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recusa com Justificativa Obrigatória */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-rose-700">
                Recusar Chamado & Solicitar Retrabalho
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                O chamado retornará para a fila do executor com a justificativa técnica preenchida.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Justificativa Técnica de Recusa * (Mínimo 5 caracteres)
              </label>
              <textarea
                rows={4}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explique com clareza o motivo do indeferimento ou o que precisa ser ajustado no retrabalho..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-rose-500 focus:outline-none transition"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLoading || rejectReason.trim().length < 5}
                onClick={() =>
                  handleTransition(TicketStatus.RECUSADO_REABERTO, rejectReason)
                }
                className="px-5 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-40 cursor-pointer"
              >
                {isLoading ? 'Registrando...' : 'Confirmar Recusa e Retrabalho'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
