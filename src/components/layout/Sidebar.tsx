'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Inbox, FileSearch, Scale, TrendingUp, CheckCircle2,
  CalendarClock, MonitorCheck, FolderOpen, Archive, Building2, BarChart3,
  Users, ShieldCheck, LogOut, Bell, ChevronRight, Menu, X,
  Plus, FileText, Gavel, Search, Sparkles
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    avatarUrl?: string | null;
  } | null;
  notificationCount?: number;
}

const menuItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, roles: ['OPERADOR','COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA','OPERADOR_CAMPO','OPERADOR_ADM'] },
  { href: '/dashboard/portal', label: 'Painel Central Completo', icon: Sparkles, roles: ['OPERADOR','COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA','OPERADOR_CAMPO','OPERADOR_ADM'] },
  { href: '/dashboard/axxia', label: 'Entrada AXXIA', icon: Inbox, roles: ['COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA'] },
  { href: '/dashboard/licitacoes', label: 'Licitações', icon: FileSearch, roles: ['OPERADOR','COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA','OPERADOR_CAMPO','OPERADOR_ADM'] },
  { href: '/dashboard/recursos', label: 'Recursos & Prazos', icon: Scale, roles: ['COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA'] },
  { href: '/dashboard/resultado', label: 'Acompanhando Resultado', icon: TrendingUp, roles: ['OPERADOR','COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA','OPERADOR_CAMPO','OPERADOR_ADM'] },
  { href: '/dashboard/finalizadas', label: 'Finalizadas', icon: CheckCircle2, roles: ['OPERADOR','COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA','OPERADOR_CAMPO','OPERADOR_ADM'] },
  { href: '/dashboard/agenda', label: 'Agenda & Alertas', icon: CalendarClock, roles: ['OPERADOR','COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA','OPERADOR_CAMPO','OPERADOR_ADM'] },
  { href: '/dashboard/plataformas', label: 'Validade das Plataformas', icon: MonitorCheck, roles: ['COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA'] },
  { href: '/dashboard/documentos', label: 'Documentos', icon: FolderOpen, roles: ['OPERADOR','COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA','OPERADOR_CAMPO','OPERADOR_ADM'] },
  { href: '/dashboard/acervo', label: 'Acervo Técnico', icon: Archive, roles: ['OPERADOR','COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA','OPERADOR_CAMPO','OPERADOR_ADM'] },
  { href: '/dashboard/empresas', label: 'Empresas & Habilitação', icon: Building2, roles: ['COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA'] },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart3, roles: ['COORDENADOR','DIRETOR','MANUTENCAO_MASTER','DIRETORIA'] },
  { href: '/dashboard/equipe', label: 'Equipe & Acessos', icon: Users, roles: ['DIRETOR','MANUTENCAO_MASTER','DIRETORIA'] },
  { href: '/dashboard/auditoria', label: 'Auditoria', icon: ShieldCheck, roles: ['DIRETOR','MANUTENCAO_MASTER','DIRETORIA'] },
];

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    OPERADOR: 'Operador',
    COORDENADOR: 'Coordenador',
    DIRETOR: 'Diretor',
    MANUTENCAO_MASTER: 'Manutenção Master',
    DIRETORIA: 'Diretoria',
    OPERADOR_CAMPO: 'Operador de Campo',
    OPERADOR_ADM: 'Operador Adm',
  };
  return labels[role] || role;
}

export function Sidebar({ user = { name: 'Usuário', role: 'OPERADOR' }, notificationCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const safeUser = user || { name: 'Usuário', role: 'OPERADOR' };
  const userRole = safeUser.role || 'OPERADOR';
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleItems = menuItems.filter(item => item.roles.includes(userRole));
  const mobileMainItems = visibleItems.slice(0, 4);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Gavel size={20} />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">LicitaControl</span>
            <span className="sidebar-brand-sub">Central de Licitações</span>
          </div>
        </div>

        {/* Quick Search Button */}
        <div style={{ padding: '10px 12px 4px' }}>
          <button 
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--sidebar-border)',
              color: 'var(--sidebar-text)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(232, 93, 93, 0.1)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.color = 'var(--sidebar-text)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} style={{ color: 'var(--color-primary)' }} />
              Buscar no portal...
            </span>
            <kbd style={{ 
              fontSize: '0.65rem', 
              background: 'rgba(255, 255, 255, 0.08)', 
              padding: '2px 5px', 
              borderRadius: '4px', 
              color: 'var(--text-muted)' 
            }}>
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="sidebar-nav-arrow" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="sidebar-footer">
          <Link href="/dashboard/notificacoes" className="sidebar-notif-btn">
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="sidebar-notif-badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
            )}
          </Link>
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {safeUser.avatarUrl ? (
                <img src={safeUser.avatarUrl} alt={safeUser.name || ''} />
              ) : (
                <span>{(safeUser.name || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{safeUser.name}</span>
              <span className="sidebar-user-role">{getRoleLabel(userRole)}</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="sidebar-logout-btn"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {mobileMainItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={`mobile-nav-item ${active ? 'active' : ''}`}>
              <Icon size={22} />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
        <button className="mobile-nav-item" onClick={() => setMoreOpen(true)}>
          <Menu size={22} />
          <span>Mais</span>
        </button>
      </nav>

      {/* Mobile More Sheet */}
      {moreOpen && (
        <div className="mobile-sheet-overlay" onClick={() => setMoreOpen(false)}>
          <div className="mobile-sheet" onClick={e => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <span>Menu</span>
              <button onClick={() => setMoreOpen(false)}><X size={20} /></button>
            </div>
            <div className="mobile-sheet-items">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobile-sheet-item ${active ? 'active' : ''}`}
                    onClick={() => setMoreOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mobile-sheet-footer">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="mobile-sheet-logout"
              >
                <LogOut size={18} />
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
