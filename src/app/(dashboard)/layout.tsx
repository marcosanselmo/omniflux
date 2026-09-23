import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await requireAuth();

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden font-sans">
      {/* Menu Lateral Dark Navy */}
      <Sidebar user={session.user} />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra Superior */}
        <Topbar />

        {/* Conteúdo Rolável */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
