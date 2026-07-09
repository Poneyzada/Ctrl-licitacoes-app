import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getReajusteCountdown, getMeasurementStatusLabel } from '@/lib/utils'
import { canAccessFieldDiary, canAccessFinancial, canApprove } from '@/lib/rbac'
import { ArrowLeft, Building2, Calendar, MapPin, FileText, TrendingUp, Shield, CheckSquare, Edit, BarChart2, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

async function getContract(id: string, userId: string, role: string) {
  const isGlobal = role === 'DIRETORIA' || role === 'COORDENADOR'
  return prisma.contract.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(!isGlobal && { assignments: { some: { userId } } }),
    },
    include: {
      milestones:   { orderBy: { order: 'asc' } },
      measurements: { orderBy: { createdAt: 'desc' }, take: 3 },
      tasks:        { where: { status: { in: ['ABERTA', 'EM_ANDAMENTO'] } }, include: { assignee: { select: { name: true } } }, take: 5 },
      guarantees:   { orderBy: { expiryDate: 'asc' } },
      assignments:  { include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } } },
    },
  })
}

const SCOPE_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  OBRA:          { label: 'Obra',          color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  },
  SERVICO:       { label: 'Servico',       color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  },
  GERENCIAMENTO: { label: 'Gerenciamento', color: '#c084fc', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ATIVO:      { label: 'Ativo',      color: '#34d399', bg: 'rgba(16,185,129,0.12)'  },
  CONCLUIDO:  { label: 'Concluido',  color: '#60a5fa', bg: 'rgba(59,130,246,0.12)'  },
  SUSPENSO:   { label: 'Suspenso',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  RESCINDIDO: { label: 'Rescindido', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

const MILESTONE_DOT: Record<string, string> = {
  PENDENTE:     '#64748b',
  EM_ANDAMENTO: '#fbbf24',
  CONCLUIDO:    '#34d399',
  ATRASADO:     '#f87171',
}

const MEAS_STATUS_CLASS: Record<string, string> = {
  EM_ANALISE: 'badge-em_analise',
  APROVADO:   'badge-aprovado',
  FATURADO:   'badge-faturado',
  PAGO:       'badge-pago',
  ATRASADO:   'badge-atrasado',
}

export default async function ContractOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userId = session.user.id as string
  const role   = session.user.role as string

  const contract = await getContract(id, userId, role)
  if (!contract) notFound()

  const scope    = SCOPE_STYLES[contract.scope]  ?? SCOPE_STYLES.OBRA
  const statusCf = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.ATIVO
  const reajuste = getReajusteCountdown(contract.baseDate)
  const progress = contract.physicalProgress

  const canDiary  = canAccessFieldDiary(role as any)
  const canMeds   = canAccessFinancial(role as any)
  const canEdit   = canApprove(role as any)

  const openTasks       = contract.tasks.length
  const totalMeasValue  = contract.measurements.reduce((s, m) => s + m.amount, 0)

  const TABS = [
    { label: 'Visao Geral',  href: `/dashboard/contratos/${id}`,            active: true  },
    { label: 'Diario',       href: `/dashboard/contratos/${id}/diario`,     active: false, show: canDiary },
    { label: 'Medicoes',     href: `/dashboard/contratos/${id}/medicoes`,   active: false, show: canMeds  },
    { label: 'Milestones',   href: `/dashboard/contratos/${id}#milestones`, active: false, show: true     },
    { label: 'Garantias',    href: `/dashboard/contratos/${id}/medicoes#garantias`,  active: false, show: canMeds  },
  ].filter(t => t.show !== false)

  return (
    <div className="animate-fade-in">
      {/* Back + Title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <Link href="/dashboard/contratos" className="btn btn-ghost btn-sm btn-icon" style={{ marginTop: 4 }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {contract.title}
            </h1>
            <span className="badge" style={{ background: statusCf.bg, color: statusCf.color, border: `1px solid ${statusCf.color}33`, fontWeight: 700 }}>
              {statusCf.label}
            </span>
            <span className="badge" style={{ background: scope.bg, color: scope.color, border: `1px solid ${scope.border}`, fontWeight: 600 }}>
              {scope.label}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Contrato N. {contract.number}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {canDiary && (
            <Link href={`/dashboard/contratos/${id}/diario`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={14} /> Diario
            </Link>
          )}
          {canMeds && (
            <Link href={`/dashboard/contratos/${id}/medicoes`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={14} /> Medicoes
            </Link>
          )}
          {canEdit && (
            <Link href={`/dashboard/contratos/${id}/editar`} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Edit size={14} /> Editar
            </Link>
          )}
        </div>
      </div>

      {/* Big progress bar */}
      <div className="card mb-4" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Progresso Fisico Geral</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: progress >= 80 ? '#34d399' : progress >= 50 ? 'var(--text-primary)' : '#fbbf24' }}>
            {progress.toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar" style={{ height: 10, borderRadius: 6 }}>
          <div
            className={`progress-fill ${progress >= 80 ? 'success' : progress >= 50 ? '' : 'warning'}`}
            style={{ width: `${progress}%`, borderRadius: 6 }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.73rem', color: 'var(--text-muted)' }}>
          <span>Inicio: {formatDate(contract.startDate)}</span>
          {contract.endDate && <span>Termino: {formatDate(contract.endDate)}</span>}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="contract-tabs mb-6">
        {TABS.map(tab => (
          <Link key={tab.href} href={tab.href} className={`contract-tab ${tab.active ? 'active' : ''}`}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="overview-grid">

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Contract info */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <FileText size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Informacoes do Contrato
              </h3>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Numero</span>
                <span className="info-value">{contract.number}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Orgao Contratante</span>
                <span className="info-value">{contract.organ}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Data de Inicio</span>
                <span className="info-value">{formatDate(contract.startDate)}</span>
              </div>
              {contract.endDate && (
                <div className="info-item">
                  <span className="info-label">Termino Previsto</span>
                  <span className="info-value">{formatDate(contract.endDate)}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Data-Base Reajuste</span>
                <span className="info-value">{formatDate(contract.baseDate)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Valor Total</span>
                <span className="info-value" style={{ color: '#60a5fa', fontWeight: 800, fontSize: '1rem' }}>
                  {formatCurrency(contract.totalValue)}
                </span>
              </div>
              {contract.address && (
                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="info-label">Endereco</span>
                  <span className="info-value">{contract.address}</span>
                </div>
              )}
              {contract.description && (
                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="info-label">Descricao</span>
                  <span className="info-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {contract.description}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Milestones */}
          <div className="card" id="milestones">
            <div className="card-header">
              <h3 className="card-title">
                <TrendingUp size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Milestones ({contract.milestones.length})
              </h3>
              <Link href={`/dashboard/contratos/${id}#milestones`} className="btn btn-ghost btn-sm">
                Ver todos
              </Link>
            </div>
            {contract.milestones.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum milestone cadastrado</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {contract.milestones.slice(0, 5).map(ms => (
                  <div key={ms.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: MILESTONE_DOT[ms.status] ?? '#64748b', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ms.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {ms.status} &middot; {formatDate(ms.targetDate)}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {ms.completionPct.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Reajuste timer */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <h3 className="card-title">
                <Calendar size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Reajuste Contratual
              </h3>
            </div>
            <div className={`reajuste-timer ${reajuste.status}`} style={{ marginBottom: 14 }}>
              <Calendar size={20} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  {reajuste.status === 'overdue' ? 'Reajuste em atraso!' :
                   reajuste.status === 'danger'  ? 'Reajuste urgente!'   :
                   reajuste.status === 'warning' ? 'Reajuste proximo'    :
                   'Prazo confortavel'}
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Prox.: {formatDate(reajuste.nextDate)}</div>
              </div>
              <div className="timer-days">{reajuste.days}d</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ciclo anual</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{reajuste.percentage.toFixed(0)}%</span>
            </div>
            <div className="progress-bar" style={{ height: 6 }}>
              <div
                className={`progress-fill ${reajuste.status === 'safe' ? 'success' : reajuste.status === 'warning' ? 'warning' : 'danger'}`}
                style={{ width: `${reajuste.percentage}%` }}
              />
            </div>
          </div>

          {/* Last measurements */}
          {canMeds && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <BarChart2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Ultimas Medicoes
                </h3>
                <Link href={`/dashboard/contratos/${id}/medicoes`} className="btn btn-ghost btn-sm">Ver todas</Link>
              </div>
              {contract.measurements.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sem medicoes</p>
                </div>
              ) : (
                <>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr><th>Periodo</th><th>Valor</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {contract.measurements.map(m => (
                          <tr key={m.id}>
                            <td style={{ fontSize: '0.8rem' }}>{m.period}</td>
                            <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatCurrency(m.amount)}</td>
                            <td>
                              <span className={`badge ${MEAS_STATUS_CLASS[m.status] ?? ''}`} style={{ fontSize: '0.68rem' }}>
                                {getMeasurementStatusLabel(m.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total (ult. 3)</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#60a5fa' }}>{formatCurrency(totalMeasValue)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Open tasks */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <CheckSquare size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Tarefas em Aberto
              </h3>
            </div>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: openTasks > 0 ? '#fbbf24' : '#34d399', lineHeight: 1 }}>
                {openTasks}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {openTasks === 0 ? 'Nenhuma pendente' : `tarefa${openTasks !== 1 ? 's' : ''} pendente${openTasks !== 1 ? 's' : ''}`}
              </div>
            </div>
            {contract.tasks.slice(0, 3).map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{task.assignee.name}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Guarantees */}
          {canMeds && contract.guarantees.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Shield size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Garantias ({contract.guarantees.length})
                </h3>
                <Link href={`/dashboard/contratos/${id}/garantias`} className="btn btn-ghost btn-sm">Ver todas</Link>
              </div>
              {contract.guarantees.slice(0, 3).map(g => (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{g.type}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vence: {formatDate(g.expiryDate)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .contract-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0;
        }
        .contract-tab {
          padding: 10px 16px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
          text-decoration: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.15s;
          border-radius: var(--radius-md) var(--radius-md) 0 0;
        }
        .contract-tab:hover { color: var(--text-primary); background: var(--bg-elevated); }
        .contract-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
        .overview-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
        }
        @media (max-width: 1000px) { .overview-grid { grid-template-columns: 1fr; } }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 600px) { .info-grid { grid-template-columns: 1fr; } }
        .info-item { display: flex; flex-direction: column; gap: 3px; }
        .info-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
        .info-value { font-size: 0.875rem; color: var(--text-primary); font-weight: 500; }
      `}</style>
    </div>
  )
}