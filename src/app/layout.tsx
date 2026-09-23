import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';

export const metadata: Metadata = {
  title: 'OmniFlux — Gestão Operacional & Governança de Workflow',
  description:
    'Plataforma de tickets internos, governança operacional e fluxo de aprovação multi-setorial dinâmico.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
