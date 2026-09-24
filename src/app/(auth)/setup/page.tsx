import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { SetupWizard } from '@/components/modules/setup/setup-wizard';

export const metadata = {
  title: 'Assistente de Inicialização | OmniFlux v1.0.0',
  description: 'Configure seu Administrador Master e setores iniciais da organização',
};

export default async function SetupPage() {
  // Se já houver usuários cadastrados, o setup está bloqueado
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Logotipo / Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#182234] text-white shadow-sm mb-3">
          <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
          <span className="text-xs font-bold tracking-wider uppercase">OmniFlux</span>
          <span className="text-[10px] text-sky-400 font-mono font-bold bg-sky-950/60 border border-sky-800/50 px-1.5 py-0.2 rounded">
            v1.0.0
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Bem-vindo ao OmniFlux
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Assistente de primeiro uso para configuração da sua organização.
        </p>
      </div>

      {/* Wizard */}
      <SetupWizard />
    </div>
  );
}
