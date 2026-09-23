import React from 'react';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth/session';
import { LogoutButton } from '@/components/common/logout-button';

// ==============================================================================
// OMNIFLUX - DASHBOARD PRINCIPAL (SERVER COMPONENT)
// Demonstra recuperação de sessão no servidor e visualização da matriz RBAC
// ==============================================================================

export default async function DashboardPage() {
  const session = await getServerAuthSession();

  if (!session || !session.user) {
    redirect('/login');
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Corporativo */}
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              OF
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">OmniFlux</span>
              <span className="ml-2 text-xs uppercase px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                Single-Tenant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner de Boas-Vindas e Papel Global */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Painel Operacional
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sessão autenticada e validada via NextAuth.js com JWT e autorização RBAC.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Papel Global:
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  user.globalRole === 'ADMIN_GERAL'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}
              >
                {user.globalRole}
              </span>
            </div>
          </div>
        </div>

        {/* Setores Vinculados e Papéis */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight mb-4">
            Vínculos Setoriais & Permissões Granulares
          </h2>

          {user.sectorRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum vínculo setorial específico atribuído diretamente.
              {user.globalRole === 'ADMIN_GERAL' &&
                ' Como Administrador Geral, você possui autoridade irrestrita em todos os setores.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {user.sectorRoles.map((roleBinding, idx) => (
                <div
                  key={`${roleBinding.sectorId}-${roleBinding.role}-${idx}`}
                  className="rounded-lg border border-border/80 bg-background/50 p-4 space-y-2"
                >
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {roleBinding.sectorSlug}
                  </div>
                  <div className="font-medium text-sm text-foreground line-clamp-1">
                    {roleBinding.sectorName}
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                      {roleBinding.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
