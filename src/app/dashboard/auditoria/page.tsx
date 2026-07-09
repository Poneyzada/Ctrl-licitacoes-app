import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import { ClipboardList, User, Calendar, Hash } from 'lucide-react'

async function getAuditLogs() {
  return prisma.auditLog.findMany({
    include: {
      user: { select: { name: true, role: true } },
      contract: { select: { title: true, number: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export default async function AuditoriaPage() {
  const session = await auth()

  if (session?.user?.role !== 'DIRETORIA') {
    redirect('/dashboard?error=sem-permissao')
  }

  const logs = await getAuditLogs()

  const actionConfig: Record<string, { label: string; color: string; bg: string }> = {
    LOGIN: { label: 'Login', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)' },
    CREATE: { label: 'Criação', color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)' },
    UPDATE: { label: 'Atualização', color: '#fcd34d', bg: 'rgba(245,158,11,0.12)' },
    DELETE: { label: 'Exclusão', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
    APPROVE: { label: 'Aprovação', color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
    REJECT: { label: 'Rejeição', color: '#fb923c', bg: 'rgba(249,115,22,0.12)' },
  }

  const roleColors: Record<string, string> = {
    DIRETORIA: '#93c5fd',
    COORDENADOR: '#a5b4fc',
    OPERADOR_CAMPO: '#6ee7b7',
    OPERADOR_ADM: '#fcd34d',
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trilha de Auditoria</h1>
          <p className="page-subtitle">Histórico completo de ações no sistema · {logs.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="audit-legend">
            <ClipboardList size={16} color="#64748b" />
            <span>Somente Diretoria</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Registros de Atividade</h3>
          <span className="badge badge-neutral-dark">{logs.length} eventos</span>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Ação</th>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Entidade</th>
                <th>Contrato</th>
                <th>Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-8">
                    Nenhum log de auditoria registrado
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const action = actionConfig[log.action] || {
                    label: log.action,
                    color: '#94a3b8',
                    bg: 'rgba(148,163,184,0.1)',
                  }
                  return (
                    <tr key={log.id}>
                      <td>
                        <span
                          className="badge"
                          style={{ background: action.bg, color: action.color }}
                        >
                          {action.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="avatar avatar-sm"
                            style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: '0.6rem' }}
                          >
                            {log.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-primary text-sm font-medium">{log.user.name}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="text-xs font-medium"
                          style={{ color: roleColors[log.user.role] || '#94a3b8' }}
                        >
                          {log.user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-secondary text-sm">{log.entity}</td>
                      <td>
                        {log.contract ? (
                          <div>
                            <div className="text-sm text-primary truncate" style={{ maxWidth: '180px' }}>
                              {log.contract.title}
                            </div>
                            <div className="text-xs text-muted">{log.contract.number}</div>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-muted text-sm whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .audit-legend {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
          padding: 6px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }

        .whitespace-nowrap { white-space: nowrap; }
      `}</style>
    </div>
  )
}
