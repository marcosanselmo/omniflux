import { Sector, ProofType } from '@prisma/client';

// ==============================================================================
// OMNIFLUX - DEFINIÇÕES DE TIPOS DE SETORES DINÂMICOS
// ==============================================================================

export interface SectorSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isFinancial: boolean;
  requiresProofFile: boolean;
  allowedProofTypes: ProofType;
  isRestricted: boolean;
  isActive: boolean;
}

export interface SectorWithStats extends Sector {
  _count: {
    tickets: number;
    sectorRoles: number;
  };
}
