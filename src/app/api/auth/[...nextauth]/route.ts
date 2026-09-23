import NextAuth from 'next-auth';
import { authOptions } from '@/config/auth';

// ==============================================================================
// OMNIFLUX - ROUTE HANDLER DO NEXTAUTH (APP ROUTER)
// ==============================================================================

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
