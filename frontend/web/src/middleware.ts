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

    // RBAC: barbeiros só acessam /dashboard e /agenda
    const role = request.cookies.get('barberstack-role')?.value;
    if (role && role !== 'ADMIN') {
      const isAdminOnly = ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
      if (isAdminOnly) {
        return NextResponse.redirect(new URL('/agenda', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)', '/'],
};
