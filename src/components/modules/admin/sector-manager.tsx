'use client';

import React, { useState } from 'react';
import { ProofType } from '@prisma/client';
import { SectorWithStats } from '@/types/sector';
import {
  createSectorAction,
  updateSectorAction,
} from '@/server/actions/sector.actions';

interface SectorManagerProps {
  initialSectors: SectorWithStats[];
}

export function SectorManager({ initialSectors }: SectorManagerProps) {
  const [sectors, setSectors] = useState<SectorWithStats[]>(initialSectors);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<SectorWithStats | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isFinancial, setIsFinancial] = useState(false);
  const [requiresProofFile, setRequiresProofFile] = useState(false);
  const [allowedProofTypes, setAllowedProofTypes] = useState<ProofType>(ProofType.ALL);
  const [isRestricted, setIsRestricted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingSector(null);
    setName('');
    setSlug('');
    setDescription('');
    setIsFinancial(false);
    setRequiresProofFile(false);
    setAllowedProofTypes(ProofType.ALL);
    setIsRestricted(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sector: SectorWithStats) => {
    setEditingSector(sector);
    setName(sector.name);
    setSlug(sector.slug);
    setDescription(sector.description ?? '');
    setIsFinancial(sector.isFinancial);
    setRequiresProofFile(sector.requiresProofFile);
    setAllowedProofTypes(sector.allowedProofTypes);
    setIsRestricted(sector.isRestricted);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingSector) {
      setSlug(
        val
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingSector) {
        const res = await updateSectorAction(editingSector.id, {
          name,
          description: description || undefined,
          isFinancial,
          requiresProofFile,
          allowedProofTypes,
          isRestricted,
        });

        if (res.success) {
          const updatedData = res.data;
          setSectors((prev) =>
            prev.map((s) =>
              s.id === editingSector.id
                ? {
                    ...s,
                    ...updatedData,
                  }
                : s
            )
          );
          setIsModalOpen(false);
        } else {
          setFormError(res.error);
        }
      } else {
        const res = await createSectorAction({
          name,
          slug,
          description: description || undefined,
          isFinancial,
          requiresProofFile,
          allowedProofTypes,
          isRestricted,
        });

        if (res.success) {
          setIsModalOpen(false);
          window.location.reload();
        } else {
          setFormError(res.error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (sector: SectorWithStats) => {
    const nextActive = !sector.isActive;
    const res = await updateSectorAction(sector.id, { isActive: nextActive });
    if (res.success) {
      setSectors((prev) =>
        prev.map((s) => (s.id === sector.id ? { ...s, isActive: nextActive } : s))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium">
            Total de setores operacionais: <strong className="text-slate-800">{sectors.length}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Novo Setor</span>
        </button>
      </div>

      {/* Grid de Cards dos Setores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectors.map((sec) => (
          <div
            key={sec.id}
            className={`bg-white rounded-2xl p-6 shadow-sm border transition flex flex-col justify-between ${
              sec.isActive
                ? 'border-slate-200/80 hover:shadow-md'
                : 'border-slate-200 bg-slate-50/70 opacity-75'
            }`}
          >
            <div>
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {sec.name}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    /{sec.slug}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActive(sec)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                    sec.isActive
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {sec.isActive ? '● Ativo' : '○ Inativo'}
                </button>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 min-h-8 mb-4">
                {sec.description || 'Sem descrição cadastrada.'}
              </p>

              {/* Flags Comportamentais Parametrizáveis */}
              <div className="space-y-1.5 mb-6 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>💰</span>
                    <span>Financeiro:</span>
                  </span>
                  <span
                    className={`font-semibold text-[11px] ${
                      sec.isFinancial ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {sec.isFinancial ? 'Sim (Exige R$ e Vencimento)' : 'Não'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>📸</span>
                    <span>Exige Comprovante:</span>
                  </span>
                  <span
                    className={`font-semibold text-[11px] ${
                      sec.requiresProofFile ? 'text-purple-600' : 'text-slate-400'
                    }`}
                  >
                    {sec.requiresProofFile ? `Sim (${sec.allowedProofTypes})` : 'Não'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>🔒</span>
                    <span>Acesso Restrito:</span>
                  </span>
                  <span
                    className={`font-semibold text-[11px] ${
                      sec.isRestricted ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {sec.isRestricted ? 'Apenas Solicitantes Autorizados' : 'Público'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer do Card com Estatísticas e Botão Editar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span>
                  <strong>{sec._count.tickets}</strong> chamados
                </span>
                <span>•</span>
                <span>
                  <strong>{sec._count.sectorRoles}</strong> papéis RBAC
                </span>
              </div>
              <button
                type="button"
                onClick={() => openEditModal(sec)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação / Edição de Setor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingSector ? `Editar Setor: ${editingSector.name}` : 'Cadastrar Novo Setor'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure as regras comportamentais dinâmicas deste setor no OmniFlux.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Setor
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Recursos Humanos"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              {!editingSector && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Identificador Único (Slug)
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="ex: recursos-humanos"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Finalidade e escopo de atendimento deste setor..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              {/* Toggles Comportamentais */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200/60">
                <div className="text-xs font-bold text-slate-800 mb-2">
                  Regras e Flags de Negócio (Engine Dinâmica)
                </div>

                {/* is_financial */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFinancial}
                    onChange={(e) => setIsFinancial(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Habilitar Fluxo Financeiro (is_financial)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Torna obrigatório o preenchimento de valor monetário (R$) e data de vencimento.
                    </span>
                  </div>
                </label>

                {/* requires_proof_file */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresProofFile}
                    onChange={(e) => setRequiresProofFile(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Exigir Comprovante na Conclusão (requires_proof_file)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      O executor só pode enviar para homologação se anexar foto ou documento comprobatório.
                    </span>
                  </div>
                </label>

                {/* allowed_proof_types */}
                {requiresProofFile && (
                  <div className="pl-7 pt-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipos de Comprovantes Permitidos:
                    </label>
                    <select
                      value={allowedProofTypes}
                      onChange={(e) =>
                        setAllowedProofTypes(e.target.value as ProofType)
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                    >
                      <option value={ProofType.ALL}>Todos (Imagens e PDF)</option>
                      <option value={ProofType.IMAGE}>Apenas Fotos / Imagens</option>
                      <option value={ProofType.DOCUMENT}>Apenas Documentos (PDF)</option>
                    </select>
                  </div>
                )}

                {/* is_restricted */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRestricted}
                    onChange={(e) => setIsRestricted(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Setor com Acesso Restrito (is_restricted)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Se marcado, apenas usuários com papel de SOLICITANTE neste setor podem emitir chamados.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Salvando...'
                    : editingSector
                    ? 'Salvar Alterações'
                    : 'Criar Setor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
