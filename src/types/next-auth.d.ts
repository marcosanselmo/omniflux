import { GlobalRole } from '@prisma/client';
import { UserSectorRoleData } from './auth';

// ==============================================================================
// OMNIFLUX - EXTENSÃO DE TIPAGEM ESTREITA DO NEXTAUTH
// Garante tipagem estrita para Session, User e JWT sem qualquer uso de any
// ==============================================================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string | null;
      globalRole: GlobalRole;
      sectorRoles: UserSectorRoleData[];
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    globalRole: GlobalRole;
    sectorRoles: UserSectorRoleData[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    globalRole: GlobalRole;
    sectorRoles: UserSectorRoleData[];
  }
}
