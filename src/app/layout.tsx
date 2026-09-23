import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';

export const metadata: Metadata = {
  title: 'OmniFlux — Gestão Operacional & Governança de Workflow',
  description:
    'Plataforma de tickets internos, governança operacional e fluxo de aprovação multi-setorial dinâmico.',
  manifest: '/manifest.json',
  themeColor: '#182234',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#F1F5F9] text-[#0F172A] font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
