import { auth } from '@/lib/auth.edge'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROUTE_PERMISSIONS, CONTRACT_ROUTE_PERMISSIONS, type UserRole } from '@/lib/rbac'

export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req
  const session = req.auth
  const pathname = nextUrl.pathname

  // Permite acesso às rotas públicas
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    if (session && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Redireciona para login se não autenticado
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = session.user?.role as UserRole

  // Verifica permissões de rotas de contrato (/dashboard/contratos/[id]/diario, /medicoes, etc.)
  const contractRouteMatch = pathname.match(/\/dashboard\/contratos\/[^/]+(\/.+)/)
  if (contractRouteMatch) {
    const subRoute = contractRouteMatch[1]
    const permission = CONTRACT_ROUTE_PERMISSIONS[subRoute]
    if (permission && !permission.allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard?error=sem-permissao', req.url))
    }
  }

  // Verifica permissões das rotas principais
  const routeEntries = Object.entries(ROUTE_PERMISSIONS)
  for (const [route, permission] of routeEntries) {
    if (pathname === route || (pathname.startsWith(route + '/') && route !== '/dashboard')) {
      if (!permission.allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL('/dashboard?error=sem-permissao', req.url))
      }
      break
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
