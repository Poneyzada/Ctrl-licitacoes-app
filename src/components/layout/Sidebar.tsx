'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  FileSearch,
  FolderOpen,
  BookOpen,
  DollarSign,
  Layers,
  Shield,
  CheckSquare,
  ClipboardList,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { canAccess, getRoleLabel, getRoleBadgeColor, type UserRole } from '@/lib/rbac'
import { getInitials } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  allowedRoles: UserRole[]
  badge?: number
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
    allowedRoles: ['DIRETORIA', 'COORDENADOR', 'OPERADOR_CAMPO', 'OPERADOR_ADM'],
  },
  {
    href: '/dashboard/licitacoes',
    label: 'Licitações',
    icon: <FileSearch size={18} />,
    allowedRoles: ['DIRETORIA', 'COORDENADOR'],
  },
  {
    href: '/dashboard/contratos',
    label: 'Contratos',
    icon: <FolderOpen size={18} />,
    allowedRoles: ['DIRETORIA', 'COORDENADOR'],
  },
  {
    href: '/dashboard/tarefas',
    label: 'Minhas Tarefas',
    icon: <CheckSquare size={18} />,
    allowedRoles: ['DIRETORIA', 'COORDENADOR', 'OPERADOR_CAMPO', 'OPERADOR_ADM'],
  },
  {
    href: '/dashboard/auditoria',
    label: 'Auditoria',
    icon: <ClipboardList size={18} />,
    allowedRoles: ['DIRETORIA'],
  },
]

const quickLinks = [
  { label: 'Diário de Obras', icon: <BookOpen size={14} />, href: '/dashboard/contratos' },
  { label: 'Medições', icon: <DollarSign size={14} />, href: '/dashboard/contratos' },
  { label: 'Garantias', icon: <Shield size={14} />, href: '/dashboard/contratos' },
  { label: 'Milestones', icon: <Layers size={14} />, href: '/dashboard/contratos' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const role = session?.user?.role as UserRole
  const userName = session?.user?.name || ''

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <FolderOpen size={20} color="#fff" />
        </div>
        <div>
          <span className="sidebar-logo-text">Ctrl-Licitação</span>
          <span className="sidebar-logo-sub">Lei 14.133/2021</span>
        </div>
      </div>

      {/* Navegação principal */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu Principal</div>
        {navItems
          .filter((item) => canAccess(role, item.allowedRoles))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
              {isActive(item.href) && <ChevronRight size={14} className="sidebar-nav-chevron" />}
            </Link>
          ))}

        {/* Links rápidos */}
        {(role === 'DIRETORIA' || role === 'COORDENADOR') && (
          <>
            <div className="sidebar-section-label" style={{ marginTop: '20px' }}>Acesso Rápido</div>
            {quickLinks.map((link) => (
              <Link key={link.label} href={link.href} className="sidebar-quick-link">
                <span className="sidebar-quick-icon">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Perfil do usuário */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar avatar-md" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            {getInitials(userName)}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{userName}</span>
            <span className={`badge ${getRoleBadgeColor(role)}`} style={{ fontSize: '0.65rem' }}>
              {getRoleLabel(role)}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="sidebar-logout-btn"
          title="Sair do sistema"
        >
          <LogOut size={16} />
        </button>
      </div>

      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--sidebar-bg);
          border-right: 1px solid var(--sidebar-border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow-y: auto;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 16px;
          border-bottom: 1px solid var(--sidebar-border);
        }

        .sidebar-logo-icon {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .sidebar-logo-text {
          display: block;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .sidebar-logo-sub {
          display: block;
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-section-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 8px 8px;
          margin-top: 4px;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all var(--transition-fast);
          text-decoration: none;
          position: relative;
        }

        .sidebar-nav-item:hover {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
        }

        .sidebar-nav-item.active {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .sidebar-nav-item.active .sidebar-nav-icon {
          color: #60a5fa;
        }

        .sidebar-nav-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .sidebar-nav-label {
          flex: 1;
        }

        .sidebar-nav-chevron {
          opacity: 0.6;
        }

        .sidebar-quick-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: 0.8125rem;
          font-weight: 400;
          transition: all var(--transition-fast);
          text-decoration: none;
        }

        .sidebar-quick-link:hover {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
        }

        .sidebar-quick-icon {
          display: flex;
          align-items: center;
          opacity: 0.6;
        }

        .sidebar-footer {
          padding: 12px 10px;
          border-top: 1px solid var(--sidebar-border);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .sidebar-user-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .sidebar-user-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .sidebar-logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }
      `}</style>
    </aside>
  )
}
