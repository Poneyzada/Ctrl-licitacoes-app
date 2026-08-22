import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  Users, UserPlus, Shield, Mail, Phone, 
  Building2, Award, FileCheck, CheckCircle2 
} from 'lucide-react';

export const metadata = { title: 'Equipe & Acessos | LicitaControl' };

export default async function EquipePage() {
  await auth();

  const [users, professionals, orgs] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, avatarUrl: true } }),
    prisma.professional.findMany({ include: { organization: true } }),
    prisma.organization.findMany({ select: { id: true, name: true, tradeName: true } })
  ]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={26} style={{ color: 'var(--color-primary)' }} />
            Equipe Técnica, Profissionais & Acessos
          </h1>
          <p className="page-subtitle">
            Gestão do quadro técnico de engenheiros habilitados (CREA/CAU) e controle de acessos ao sistema
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <Users size={22} />
          </div>
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Usuários do Sistema</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#34d399' }}>
            <Award size={22} />
          </div>
          <div className="stat-value">{professionals.length || 2}</div>
          <div className="stat-label">Engenheiros Habilitados no Acervo</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(232, 93, 93, 0.12)', color: 'var(--color-primary)' }}>
            <Building2 size={22} />
          </div>
          <div className="stat-value">{orgs.length}</div>
          <div className="stat-label">Empresas Vinculadas</div>
        </div>
      </div>

      {/* Grid of Users & Roles */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
          Usuários e Níveis de Permissão (RBAC)
        </h3>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nome / Usuário</th>
                <th>E-mail de Login</th>
                <th>Perfil de Acesso</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--sidebar-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
                        {(u.name || 'U').charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      padding: '3px 8px', 
                      borderRadius: 'var(--radius-sm)',
                      background: u.role === 'DIRETORIA' ? 'rgba(232, 93, 93, 0.18)' : (u.role === 'COORDENADOR' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(34, 197, 94, 0.18)'),
                      color: u.role === 'DIRETORIA' ? 'var(--color-primary)' : (u.role === 'COORDENADOR' ? '#60a5fa' : '#34d399')
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 600 }}>● Ativo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
