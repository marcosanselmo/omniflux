'use client';

import React from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

// ==============================================================================
// OMNIFLUX - PROVEDOR DE SESSÃO CLIENT-SIDE
// Encapsula o contexto de autenticação para nós de interface interativos
// ==============================================================================

interface Props {
  children: React.ReactNode;
}

export function SessionProvider({ children }: Props) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
