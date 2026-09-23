import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// ==============================================================================
// OMNIFLUX - EDGE MIDDLEWARE DE PROTEÇÃO DE ROTAS E GOVERNANÇA RBAC
// Intercepta requisições HTTP e valida autenticação e papéis administrativos
// ==============================================================================

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redireciona a raiz para o destino apropriado
    if (pathname === '/') {
      return NextResponse.redirect(
        new URL(token ? '/dashboard' : '/login', req.url)
      );
    }

    // Se o usuário já estiver autenticado e tentar acessar /login, redireciona para o dashboard
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Rotas administrativas exigem papel global ADMIN_GERAL
    if (pathname.startsWith('/admin') && token?.globalRole !== 'ADMIN_GERAL') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Páginas públicas
        if (pathname === '/login') {
          return true;
        }

        // Todas as outras rotas cobertas pelo matcher exigem token de sessão válido
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas exceto assets estáticos, service workers e rotas do Next.js
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)',
  ],
};
