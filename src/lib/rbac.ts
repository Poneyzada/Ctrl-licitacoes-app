export type UserRole = 'DIRETORIA' | 'COORDENADOR' | 'OPERADOR_CAMPO' | 'OPERADOR_ADM'

export interface RoutePermission {
  allowedRoles: UserRole[]
}

// Mapa de permissões por rota
export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  '/dashboard': { allowedRoles: ['DIRETORIA', 'COORDENADOR', 'OPERADOR_CAMPO', 'OPERADOR_ADM'] },
  '/dashboard/licitacoes': { allowedRoles: ['DIRETORIA', 'COORDENADOR'] },
  '/dashboard/contratos': { allowedRoles: ['DIRETORIA', 'COORDENADOR', 'OPERADOR_CAMPO', 'OPERADOR_ADM'] },
  '/dashboard/auditoria': { allowedRoles: ['DIRETORIA'] },
  '/dashboard/tarefas': { allowedRoles: ['DIRETORIA', 'COORDENADOR', 'OPERADOR_CAMPO', 'OPERADOR_ADM'] },
}

// Permissões por sub-rota de contrato
export const CONTRACT_ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  '/diario': { allowedRoles: ['DIRETORIA', 'COORDENADOR', 'OPERADOR_CAMPO'] },
  '/medicoes': { allowedRoles: ['DIRETORIA', 'COORDENADOR', 'OPERADOR_ADM'] },
  '/milestones': { allowedRoles: ['DIRETORIA', 'COORDENADOR'] },
  '/garantias': { allowedRoles: ['DIRETORIA', 'COORDENADOR'] },
}

export function canAccess(role: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role)
}

export function canDelete(role: UserRole): boolean {
  return role === 'DIRETORIA'
}

export function canApprove(role: UserRole): boolean {
  return role === 'DIRETORIA' || role === 'COORDENADOR'
}

export function canAccessFinancial(role: UserRole): boolean {
  return role === 'DIRETORIA' || role === 'COORDENADOR' || role === 'OPERADOR_ADM'
}

export function canAccessFieldDiary(role: UserRole): boolean {
  return role === 'DIRETORIA' || role === 'COORDENADOR' || role === 'OPERADOR_CAMPO'
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    DIRETORIA: 'Diretoria',
    COORDENADOR: 'Coordenador',
    OPERADOR_CAMPO: 'Operador de Campo',
    OPERADOR_ADM: 'Operador Administrativo',
  }
  return labels[role]
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    DIRETORIA: 'badge-diretoria',
    COORDENADOR: 'badge-coordenador',
    OPERADOR_CAMPO: 'badge-campo',
    OPERADOR_ADM: 'badge-adm',
  }
  return colors[role]
}
