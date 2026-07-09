import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getReajusteCountdown, getContractScopeLabel } from '@/lib/utils'
import { canAccessFieldDiary, canAccessFinancial } from '@/lib/rbac'
import { Plus, Building2, TrendingUp, Calendar, ChevronRight, Filter, BookOpen, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

async function getContracts(userId: string, role: string) {
  const isGlobal = role === 'DIRETORIA' || role === 'COORDENADOR'
  const where = isGlobal
    ? { deletedAt: null }
    : { deletedAt: null, assignments: { some: { userId } } }

  return prisma.contract.findMany({
    where,
    include: {
      assignments: { include: { user: { select: { name: true, avatarUrl: true } } } },
      _count: { select: { measurements: true, milestones: true, tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

const SCOPE_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  OBRA:          { label: 'Obra',          color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  },
  SERVICO:       { label: 'Servico',       color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  },
  GERENCIAMENTO: { label: 'Gerenciamento', color: '#c084fc', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
}

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  ATIVO:      { label: 'Ativo',      color: '#34d399' },
  CONCLUIDO:  { label: 'Concluido',  color: '#60a5fa' },
  SUSPENSO:   { label: 'Suspenso',   color: '#fbbf24' },
  RESCINDIDO: { label: 'Rescindido', color: '#f87171' },
}

export default async function ContratosPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userId = session.user.id as string
  const role   = session.user.role as string

  const contracts = await getContracts(userId, role)
  const totalValue  = contracts.reduce((s, c) => s + c.totalValue, 0)
  const avgProgress = contracts.length
    ? contracts.reduce((s, c) => s + c.physicalProgress, 0) / contracts.length
    : 0
  const activeCount = contracts.filter(c => c.status === 'ATIVO').length

  const canDiary    = canAccessFieldDiary(role as any)
  const canMedicoes = canAccessFinancial(role as any)
  const canCreate   = role === 'DIRETORIA' || role === 'COORDENADOR'

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Contratos</h1>
          <p className="page-subtitle">
            {contracts.length} contrato{contracts.length !== 1 ? 's' : ''} encontrado{contracts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} /> Filtrar
          </button>
          {canCreate && (
            <Link href="/dashboard/contratos/novo" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Novo Contrato
            </Link>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Building2 size={20} color="#60a5fa" />
          </div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Contratos Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <TrendingUp size={20} color="#34d399" />
          </div>
          <div className="stat-value">{avgProgress.toFixed(0)}%</div>
          <div className="stat-label">Progresso Medio</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Calendar size={20} color="#a5b4fc" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.15rem' }}>{formatCurrency(totalValue)}</div>
          <div className="stat-label">Valor Total sob Gestao</div>
        </div>
      </div>

      {/* Contracts Grid */}
      {contracts.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <div className="empty-state-icon">📋</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Nenhum contrato encontrado
            </p>
            {canCreate && (
              <Link href="/dashboard/contratos/novo" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Criar primeiro contrato
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="contracts-grid">
          {contracts.map(contract => {
            const scope    = SCOPE_STYLES[contract.scope] ?? SCOPE_STYLES.OBRA
            const status   = STATUS_STYLES[contract.status] ?? STATUS_STYLES.ATIVO
            const reajuste = getReajusteCountdown(contract.baseDate)
            const progress = contract.physicalProgress
            const progressClass =
              progress >= 80 ? 'success' :
              progress >= 50 ? ''        : 'warning'

            return (
              <div key={contract.id} className="contract-card">
                <div className="contract-card-stripe" style={{ background: scope.color }} />

                {/* Header badges */}
                <div className="contract-card-header">
                  <span
                    className="badge"
                    style={{
                      background: scope.bg,
                      color: scope.color,
                      border: `1px solid ${scope.border}`,
                      fontWeight: 600,
                    }}
                  >
                    {scope.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: status.color, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    ● {status.label}
                  </span>
                </div>

                {/* Title */}
                <Link href={`/dashboard/contratos/${contract.id}`} className="contract-card-title-link">
                  <h3 className="contract-card-title">{contract.title}</h3>
                  <p className="contract-card-number">N. {contract.number}</p>
                </Link>

                {/* Organ */}
                <div className="contract-card-organ">
                  <Building2 size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                  <span>{contract.organ}</span>
                </div>

                {/* Progress */}
                <div style={{ margin: '14px 0 6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progresso fisico</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${progressClass}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Value */}
                <div className="contract-card-value">{formatCurrency(contract.totalValue)}</div>

                {/* Dates */}
                <div className="contract-card-dates">
                  <div className="contract-date-item">
                    <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                    <span>{formatDate(contract.startDate)}</span>
                  </div>
                  {contract.endDate && (
                    <>
                      <span style={{ color: 'var(--border-color-strong)' }}>to</span>
                      <div className="contract-date-item">
                        <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                        <span>{formatDate(contract.endDate)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Reajuste timer */}
                {(reajuste.status === 'warning' || reajuste.status === 'danger' || reajuste.status === 'overdue') && (
                  <div className={`reajuste-timer ${reajuste.status}`} style={{ marginTop: 12 }}>
                    <Calendar size={14} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Reajuste se aproxima</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Prox.: {formatDate(reajuste.nextDate)}</div>
                    </div>
                    <div className="timer-days">{reajuste.days}d</div>
                  </div>
                )}

                <div style={{ height: 1, background: 'var(--border-color)', margin: '14px 0' }} />

                {/* Actions */}
                <div className="contract-card-actions">
                  <Link
                    href={`/dashboard/contratos/${contract.id}`}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center', gap: 5 }}
                  >
                    Detalhes <ChevronRight size={13} />
                  </Link>
                  {canDiary && (
                    <Link
                      href={`/dashboard/contratos/${contract.id}/diario`}
                      className="btn btn-ghost btn-sm"
                      title="Diario de Campo"
                      style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <BookOpen size={14} />
                    </Link>
                  )}
                  {canMedicoes && (
                    <Link
                      href={`/dashboard/contratos/${contract.id}/medicoes`}
                      className="btn btn-ghost btn-sm"
                      title="Medicoes"
                      style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <BarChart2 size={14} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .contracts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        @media (max-width: 700px) {
          .contracts-grid { grid-template-columns: 1fr; }
        }
        .contract-card {
          position: relative;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 20px;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .contract-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.35);
          border-color: var(--border-color-strong);
        }
        .contract-card-stripe {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }
        .contract-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .contract-card-title-link {
          text-decoration: none;
          display: block;
        }
        .contract-card-title-link:hover .contract-card-title {
          color: var(--color-primary);
        }
        .contract-card-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.35;
          margin: 0 0 3px;
          transition: color 0.15s;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .contract-card-number {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin: 0;
          letter-spacing: 0.03em;
        }
        .contract-card-organ {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin-top: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .contract-card-value {
          font-size: 1.05rem;
          font-weight: 800;
          color: #60a5fa;
          letter-spacing: -0.01em;
          margin: 8px 0 10px;
        }
        .contract-card-dates {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .contract-date-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .contract-card-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>
    </div>
  )
}
