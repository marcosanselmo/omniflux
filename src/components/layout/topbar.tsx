'use client';

import React from 'react';
import { LogoutButton } from '@/components/common/logout-button';

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

        {/* Notificações / Ícones com Badge (Referência) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Notificações"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>
        </div>

        {/* Divisor */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Botão de Encerramento */}
        <LogoutButton />
      </div>
    </header>
  );
}
