'use client';

import React from 'react';
import { LogoutButton } from '@/components/common/logout-button';
import { NotificationsDropdown } from '@/components/layout/notifications-dropdown';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title = 'Painel Operacional' }: TopbarProps) {
  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shadow-sm shrink-0">
      {/* Título da Tela */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Barra de Busca e Ações Rápidas (Inspirada na Referência) */}
      <div className="flex items-center gap-6">
        {/* Campo de Busca Rápida */}
        <div className="relative hidden md:block w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar chamados, protocolos..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200/60 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
          />
        </div>

        {/* Notificações Reativas In-App */}
        <NotificationsDropdown />

        {/* Divisor */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Botão de Encerramento */}
        <LogoutButton />
      </div>
    </header>
  );
}
