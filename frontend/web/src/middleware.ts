import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/agenda',
  '/barbeiros',
  '/clientes',
  '/assinaturas',
  '/financeiro',
  '/estoque',
  '/configuracoes',
];

// Rotas acessíveis apenas por ADMIN (dono da barbearia)
const ADMIN_ONLY_PREFIXES = [
  '/barbeiros',
  '/clientes',
  '/assinaturas',
  '/financeiro',
  '/estoque',
  '/configuracoes',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const session = request.cookies.get('barberstack-session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const role = request.cookies.get('barberstack-role')?.value;

    if (role === 'SUPER_ADMIN') {
      // SUPER_ADMIN accesses /dashboard for SaaS metrics, but shouldn't access barbershop-specific routes
      const isSuperAdminOnly = ['/dashboard'].some((p) => pathname.startsWith(p));
      if (!isSuperAdminOnly) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else if (role === 'BARBER') {
      // BARBER accesses only /agenda
      const isBarberOnly = ['/agenda'].some((p) => pathname.startsWith(p));
      if (!isBarberOnly) {
        return NextResponse.redirect(new URL('/agenda', request.url));
      }
    } else if (role === 'ADMIN') {
      // ADMIN (Barbershop Owner) has access to all protected prefixes
      // No redirection needed
    } else {
      // CLIENT or other roles should not be in the management panel
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)', '/'],
};
