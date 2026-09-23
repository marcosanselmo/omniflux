import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { loginSchema } from '@/lib/validators/auth';
import { UserSectorRoleData } from '@/types/auth';

// ==============================================================================
// OMNIFLUX - CONFIGURAÇÃO DO NEXTAUTH (CREDENTIALS + JWT + RBAC POR SETOR)
// ==============================================================================

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 Horas
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credenciais',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // Busca o usuário no banco de dados incluindo vínculos setoriais
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            sectorRoles: {
              include: {
                sector: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordMatch) {
          return null;
        }

        // Mapeia os vínculos com setores ativos
        const sectorRoles: UserSectorRoleData[] = user.sectorRoles
          .filter((sr) => sr.sector.isActive)
          .map((sr) => ({
            sectorId: sr.sector.id,
            sectorSlug: sr.sector.slug,
            sectorName: sr.sector.name,
            role: sr.role,
          }));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          globalRole: user.globalRole,
          sectorRoles,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.globalRole = user.globalRole;
        token.sectorRoles = user.sectorRoles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.globalRole = token.globalRole;
        session.user.sectorRoles = token.sectorRoles ?? [];
      }
      return session;
    },
  },
};
