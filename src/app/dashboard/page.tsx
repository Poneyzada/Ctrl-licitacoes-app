import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getReajusteCountdown, daysUntil } from '@/lib/utils'
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Building2,
  CalendarClock,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

async function getDashboardData(userId: string, role: string) {
  const isGlobal = role === 'DIRETORIA' || role === 'COORDENADOR'

  const whereContracts = isGlobal
    ? { deletedAt: null }
    : {
        deletedAt: null,
        assignments: { some: { userId } },
      }

  const contracts = await prisma.contract.findMany({
    where: whereContracts,
    include: {
      measurements: { orderBy: { createdAt: 'desc' }, take: 3 },
      tasks: { where: { assignedTo: userId, status: { in: ['ABERTA', 'EM_ANDAMENTO'] } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalValue = contracts.reduce((sum, c) => sum + c.totalValue, 0)
  const avgProgress = contracts.length
    ? contracts.reduce((sum, c) => sum + c.physicalProgress, 0) / contracts.length
    : 0

  const measurements = await prisma.measurement.findMany({
    where: { contract: whereContracts },
    include: { contract: { select: { title: true, number: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const tasks = await prisma.task.findMany({
    where: { assignedTo: userId, status: { in: ['ABERTA', 'EM_ANDAMENTO'] } },
    include: { contract: { select: { title: true } }, creator: { select: { name: true } } },
    orderBy: { dueDate: 'asc' },
    take: 5,
  })

  // Alertas de reajuste
  const reajusteAlerts = contracts
    .map((c) => ({ ...c, reajuste: getReajusteCountdown(c.baseDate) }))
    .filter((c) => c.reajuste.status === 'danger' || c.reajuste.status === 'warning')
    .sort((a, b) => a.reajuste.days - b.reajuste.days)
    .slice(0, 3)

  // Garantias vencendo
  const guarantees = await prisma.guarantee.findMany({
    where: { contract: whereContracts },
    include: { contract: { select: { title: true, number: true } } },
  })

  const expiringGuarantees = guarantees
    .map((g) => ({ ...g, daysLeft: daysUntil(g.expiryDate) }))
    .filter((g) => g.daysLeft <= g.alertDaysBefore)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3)

  const delayedMeasurements = measurements.filter((m) => m.status === 'ATRASADO').length
  const pendingAnalysis = measurements.filter((m) => m.status === 'EM_ANALISE').length

  return {
    contracts,
    totalValue,
    avgProgress,
    measurements,
    tasks,
    reajusteAlerts,
    expiringGuarantees,
    delayedMeasurements,
    pendingAnalysis,
    contractsCount: contracts.length,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id as string
  const role = session?.user?.role as string
  const userName = session?.user?.name || ''

  const data = await getDashboardData(userId, role)

  const statusColors: Record<string, string> = {
    EM_ANALISE: 'badge-em_analise',
    APROVADO: 'badge-aprovado',
    FATURADO: 'badge-faturado',
    PAGO: 'badge-pago',
    ATRASADO: 'badge-atrasado',
  }

  const statusLabels: Record<string, string> = {
    EM_ANALISE: 'Em Análise',
    APROVADO: 'Aprovado',
    FATURADO: 'Faturado',
    PAGO: 'Pago',
    ATRASADO: 'Atrasado',
  }

  const priorityColors: Record<string, string> = {
    BAIXA: 'badge-neutral-dark',
    MEDIA: 'badge-info-dark',
    ALTA: 'badge-warning-dark',
    URGENTE: 'badge-danger-dark',
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Olá, {userName.split(' ')[0]}! 👋
          </h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
            <Building2 size={20} color="#60a5fa" />
          </div>
          <div className="stat-value">{data.contractsCount}</div>
          <div className="stat-label">Contratos Ativos</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <TrendingUp size={20} color="#34d399" />
          </div>
          <div className="stat-value">{data.avgProgress.toFixed(0)}%</div>
          <div className="stat-label">Progresso Médio</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
            <DollarSign size={20} color="#a5b4fc" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(data.totalValue)}</div>
          <div className="stat-label">Valor Total em Gestão</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <AlertTriangle size={20} color="#f87171" />
          </div>
          <div className="stat-value" style={{ color: data.delayedMeasurements > 0 ? '#f87171' : '#34d399' }}>
            {data.delayedMeasurements}
          </div>
          <div className="stat-label">Medições em Atraso</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Coluna principal */}
        <div className="dashboard-main">

          {/* Contratos em andamento */}
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Contratos em Andamento</h3>
              {(role === 'DIRETORIA' || role === 'COORDENADOR') && (
                <Link href="/dashboard/contratos" className="btn btn-ghost btn-sm">
                  Ver todos <ArrowRight size={14} />
                </Link>
              )}
            </div>

            {data.contracts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>Nenhum contrato vinculado</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {data.contracts.slice(0, 4).map((contract) => {
                  const reajuste = getReajusteCountdown(contract.baseDate)
                  return (
                    <Link
                      key={contract.id}
                      href={`/dashboard/contratos/${contract.id}`}
                      className="contract-row"
                    >
                      <div className="contract-row-header">
                        <div className="min-w-0">
                          <div className="contract-row-title">{contract.title}</div>
                          <div className="contract-row-sub">
                            {contract.number} · {contract.organ}
                          </div>
                        </div>
                        <div className="contract-row-value">
                          {formatCurrency(contract.totalValue)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="progress-bar flex-1">
                          <div
                            className={`progress-fill ${
                              contract.physicalProgress >= 80 ? 'success' :
                              contract.physicalProgress >= 50 ? '' : 'warning'
                            }`}
                            style={{ width: `${contract.physicalProgress}%` }}
                          />
                        </div>
                        <span className="text-xs text-secondary shrink-0">
                          {contract.physicalProgress}%
                        </span>
                        {reajuste.status !== 'safe' && (
                          <span className={`badge badge-${reajuste.status === 'danger' ? 'atrasado' : 'warning'}-dark text-xs`}>
                            Reajuste: {reajuste.days}d
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Últimas medições */}
          {(role === 'DIRETORIA' || role === 'COORDENADOR' || role === 'OPERADOR_ADM') && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Últimas Medições</h3>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Contrato</th>
                      <th>Período</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.measurements.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-8">
                          Nenhuma medição registrada
                        </td>
                      </tr>
                    ) : (
                      data.measurements.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div className="text-primary font-medium text-sm truncate" style={{ maxWidth: '200px' }}>
                              {m.contract.title}
                            </div>
                            <div className="text-xs text-muted">{m.contract.number}</div>
                          </td>
                          <td className="text-secondary">{m.period}</td>
                          <td className="font-semibold text-primary">{formatCurrency(m.amount)}</td>
                          <td>
                            <span className={`badge ${statusColors[m.status]}`}>
                              {statusLabels[m.status]}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="dashboard-side">
          {/* Minhas tarefas */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">Minhas Tarefas</h3>
              <Link href="/dashboard/tarefas" className="btn btn-ghost btn-sm">
                <ArrowRight size={14} />
              </Link>
            </div>
            {data.tasks.length === 0 ? (
              <div className="empty-state py-8">
                <CheckCircle size={32} color="#10b981" style={{ marginBottom: 8 }} />
                <p className="text-sm">Tudo em dia! Nenhuma tarefa pendente.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {data.tasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="flex items-start gap-2">
                      <Clock size={14} style={{ color: '#64748b', marginTop: 2, flexShrink: 0 }} />
                      <div className="min-w-0">
                        <div className="task-title">{task.title}</div>
                        {task.contract && (
                          <div className="task-contract">{task.contract.title}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 justify-between">
                      <span className={`badge ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-muted">
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alertas de reajuste */}
          {data.reajusteAlerts.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h3 className="card-title">⏰ Alertas de Reajuste</h3>
              </div>
              <div className="flex flex-col gap-3">
                {data.reajusteAlerts.map((contract) => (
                  <div key={contract.id} className={`reajuste-timer ${contract.reajuste.status}`}>
                    <CalendarClock size={20} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary truncate">{contract.title}</div>
                      <div className="text-xs text-muted">
                        Próx. reajuste: {formatDate(contract.reajuste.nextDate)}
                      </div>
                    </div>
                    <div className="timer-days">{contract.reajuste.days}d</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Garantias vencendo */}
          {data.expiringGuarantees.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🛡️ Garantias a Vencer</h3>
              </div>
              <div className="flex flex-col gap-2">
                {data.expiringGuarantees.map((g) => (
                  <div key={g.id} className="guarantee-item">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-primary truncate">{g.type}</div>
                        <div className="text-xs text-muted truncate">{g.contract.title}</div>
                      </div>
                      <span className={`badge shrink-0 ${g.daysLeft <= 15 ? 'badge-atrasado' : 'badge-warning-dark'}`}>
                        {g.daysLeft}d
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-1">Vence: {formatDate(g.expiryDate)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }

        @media (max-width: 1100px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .contract-row {
          display: block;
          padding: 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-elevated);
          text-decoration: none;
          transition: all var(--transition-base);
        }

        .contract-row:hover {
          border-color: rgba(59, 130, 246, 0.3);
          background: rgba(59, 130, 246, 0.05);
          transform: translateY(-1px);
        }

        .contract-row-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .contract-row-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .contract-row-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .contract-row-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: #60a5fa;
          white-space: nowrap;
        }

        .task-item {
          padding: 12px;
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          transition: all var(--transition-fast);
        }

        .task-item:hover {
          border-color: var(--border-color-strong);
        }

        .task-title {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .task-contract {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .guarantee-item {
          padding: 12px;
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
        }
      `}</style>
    </div>
  )
}
