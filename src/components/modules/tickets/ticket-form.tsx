'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SectorSummary } from '@/types/sector';
import { TicketPriority } from '@prisma/client';
import { createTicketAction } from '@/server/actions/ticket.actions';

interface TicketFormProps {
  sectors: SectorSummary[];
}

export function TicketForm({ sectors }: TicketFormProps) {
  const router = useRouter();

  const [sectorId, setSectorId] = useState(sectors[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIA);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Setor ativo selecionado
  const selectedSector = sectors.find((s) => s.id === sectorId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await createTicketAction({
        title,
        description,
        sectorId,
        priority,
        amount: selectedSector?.isFinancial && amount ? Number(amount) : undefined,
        dueDate: selectedSector?.isFinancial && dueDate ? new Date(dueDate) : undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error);
        return;
      }

      router.push(`/tickets/${res.data.id}`);
      router.refresh();
    } catch {
      setErrorMessage('Erro ao comunicar com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Seleção do Setor */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Setor de Destino *
        </label>
        <select
          value={sectorId}
          onChange={(e) => setSectorId(e.target.value)}
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none transition"
        >
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name} {sector.isRestricted ? '(Restrito)' : ''}
            </option>
          ))}
        </select>

        {selectedSector && (
          <p className="mt-1.5 text-xs text-slate-500">
            {selectedSector.description}
          </p>
        )}
      </div>

      {/* Alerta de Flags do Setor */}
      {selectedSector?.requiresProofFile && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 text-xs text-purple-800 flex items-center gap-2.5">
          <span className="font-bold uppercase tracking-wider text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
            Regra do Setor
          </span>
          <span>
            A conclusão deste chamado exigirá o anexo compulsório de comprovante do tipo{' '}
            <strong>{selectedSector.allowedProofTypes}</strong>.
          </span>
        </div>
      )}

      {/* 2. Título da Solicitação */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Título Resumido da Demanda *
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Troca de disjuntor do ar-condicionado na sala de reuniões"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none transition"
        />
      </div>

      {/* 3. Prioridade */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Nível de Prioridade *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: TicketPriority.BAIXA, label: 'Baixa', color: 'border-slate-200 text-slate-700' },
            { value: TicketPriority.MEDIA, label: 'Média', color: 'border-blue-200 text-blue-700' },
            { value: TicketPriority.ALTA, label: 'Alta', color: 'border-amber-200 text-amber-700' },
            { value: TicketPriority.URGENTE, label: 'Urgente', color: 'border-rose-200 text-rose-700' },
          ].map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                priority === p.value
                  ? 'bg-[#182234] text-white border-[#182234] shadow-md'
                  : 'bg-white hover:bg-slate-50 ' + p.color
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Campos Dinâmicos da Flag is_financial */}
      {selectedSector?.isFinancial && (
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded">
              Setor Financeiro
            </span>
            <span className="text-xs font-semibold text-slate-700">
              Campos monetários e data de vencimento obrigatórios
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#2563EB] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Data de Vencimento *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#2563EB] focus:outline-none transition"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Descrição Detalhada */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Detalhamento da Solicitação *
        </label>
        <textarea
          rows={5}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Forneça instruções claras, localização exata e detalhes operacionais para a equipe responsável..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 font-normal placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none transition"
        />
      </div>

      {/* Botões de Ação */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-xl bg-[#2563EB] text-xs font-bold text-white shadow-md hover:bg-blue-600 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? 'Registrando Chamado...' : 'Abrir Chamado'}
        </button>
      </div>
    </form>
  );
}
