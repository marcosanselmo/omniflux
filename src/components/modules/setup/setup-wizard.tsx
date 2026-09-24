'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PRESET_SECTORS,
  initializeSystemAction,
} from '@/server/actions/setup.actions';

export function SetupWizard() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Passo 1: Administrador
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Passo 2: Setores
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    PRESET_SECTORS.map((s) => s.slug)
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSector = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const selectAllSectors = () => {
    setSelectedSlugs(PRESET_SECTORS.map((s) => s.slug));
  };

  const deselectAllSectors = () => {
    setSelectedSlugs([]);
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (adminPassword.length < 6) {
      setError('A senha deve conter ao menos 6 caracteres.');
      return;
    }

    if (adminPassword !== confirmPassword) {
      setError('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedSlugs.length === 0) {
      setError('Por favor, selecione ao menos 1 setor para inicializar a organização.');
      return;
    }

    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const sectorsToCreate = PRESET_SECTORS.filter((s) =>
        selectedSlugs.includes(s.slug)
      );

      const res = await initializeSystemAction({
        adminName,
        adminEmail,
        adminPassword,
        selectedSectors: sectorsToCreate,
      });

      if (res.success) {
        router.push('/login?setup=success');
      } else {
        setError(res.error);
        setIsSubmitting(false);
      }
    } catch {
      setError('Ocorreu uma falha ao comunicar com o servidor. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10">
      {/* Indicador de Passos */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />

          {/* Passo 1 */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                step >= 1
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              1
            </div>
            <span className="text-[11px] font-semibold text-slate-600 mt-1.5">
              Administrador
            </span>
          </div>

          {/* Passo 2 */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                step >= 2
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </div>
            <span className="text-[11px] font-semibold text-slate-600 mt-1.5">
              Setores Base
            </span>
          </div>

          {/* Passo 3 */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                step === 3
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              3
            </div>
            <span className="text-[11px] font-semibold text-slate-600 mt-1.5">
              Conclusão
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* PASSO 1: ADMIN MASTER                                                */}
      {/* -------------------------------------------------------------------- */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Criar Conta do Administrador Master
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Este usuário terá privilégios globais (`ADMIN_GERAL`) para gerenciar setores, usuários e auditoria.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Ex: Carlos Oliveira"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Corporativo do Master *
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@suaempresa.com.br"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha Master *
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirme a Senha *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2"
            >
              <span>Avançar para Setores</span>
              <span>&rarr;</span>
            </button>
          </div>
        </form>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* PASSO 2: ESCOLHA DOS SETORES PADRÃO                                  */}
      {/* -------------------------------------------------------------------- */}
      {step === 2 && (
        <form onSubmit={handleStep2Next} className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Selecione os Setores Padrão
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Escolha os setores que já devem iniciar ativos no OmniFlux. Você poderá editar ou criar outros depois.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={selectAllSectors}
                className="text-[#2563EB] hover:underline"
              >
                Marcar Todos
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={deselectAllSectors}
                className="text-slate-500 hover:underline"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {PRESET_SECTORS.map((sec) => {
              const isSelected = selectedSlugs.includes(sec.slug);
              return (
                <div
                  key={sec.slug}
                  onClick={() => toggleSector(sec.slug)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    isSelected
                      ? 'bg-blue-50/50 border-[#2563EB] shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // controlado pelo onClick do container
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      {sec.name}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {sec.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sec.isFinancial && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          Financeiro
                        </span>
                      )}
                      {sec.requiresProofFile && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                          Exige Comprovante
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              &larr; Voltar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2"
            >
              <span>Avançar para Conclusão</span>
              <span>&rarr;</span>
            </button>
          </div>
        </form>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* PASSO 3: REVISÃO & INICIALIZAÇÃO                                     */}
      {/* -------------------------------------------------------------------- */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Revisar e Inicializar
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Confirme os dados antes de gravar no banco de dados e liberar o acesso.
            </p>
          </div>

          <div className="space-y-4">
            {/* Card Admin */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Administrador Master
              </span>
              <div className="text-sm font-bold text-slate-900">{adminName}</div>
              <div className="text-xs text-slate-500 font-mono">{adminEmail}</div>
            </div>

            {/* Card Setores */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Setores a Criar ({selectedSlugs.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SECTORS.filter((s) => selectedSlugs.includes(s.slug)).map(
                  (sec) => (
                    <span
                      key={sec.slug}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                    >
                      {sec.name}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
            >
              &larr; Voltar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="px-8 py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Inicializando OmniFlux...</span>
                </>
              ) : (
                <>
                  <span>🚀 Concluir Configuração e Inicializar</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
