'use client';

import React, { useEffect, useState } from 'react';

interface FormattedDateProps {
  date: Date | string | null | undefined;
  includeTime?: boolean;
  className?: string;
  fallback?: string;
}

/**
 * Utilitário seguro contra erros de hidratação (SSR vs Client Timezone).
 * Usa suppressHydrationWarning e garante consistência visual.
 */
export function FormattedDate({
  date,
  includeTime = false,
  className = '',
  fallback = '—',
}: FormattedDateProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!date) {
    return <span className={className}>{fallback}</span>;
  }

  const d = typeof date === 'string' ? new Date(date) : date;

  // SSR inicial estável: formata sem depender do timezone local do navegador
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  const baseDateStr = `${day}/${month}/${year}`;

  if (!isMounted) {
    return (
      <time suppressHydrationWarning className={className}>
        {baseDateStr}
      </time>
    );
  }

  // No cliente montado, formata no padrão brasileiro com timezone local
  const clientDateStr = d.toLocaleDateString('pt-BR');
  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return (
      <time suppressHydrationWarning className={className}>
        {clientDateStr} às {hours}:{minutes}
      </time>
    );
  }

  return (
    <time suppressHydrationWarning className={className}>
      {clientDateStr}
    </time>
  );
}
