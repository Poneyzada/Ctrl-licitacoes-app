import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate, formatDateTime, getWeatherIcon, getWeatherLabel } from '@/lib/utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { canAccessFieldDiary } from '@/lib/rbac'
import { Camera, CloudSun, Users, Lock, BookOpen, AlertTriangle, ArrowLeft } from 'lucide-react'
import CreateDailyLogForm from './CreateDailyLogForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DiarioPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) redirect('/login')

  const role = session.user.role as string

  if (role === 'OPERADOR_ADM') {
    redirect('/dashboard?error=sem-permissao')
  }

  if (!canAccessFieldDiary(role as any)) {
    redirect('/dashboard?error=sem-permissao')
  }

  const contract = await prisma.contract.findUnique({
    where: { id, deletedAt: null },
    include: {
      milestones: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!contract) redirect('/dashboard/contratos')

  const dailyLogs = await prisma.dailyLog.findMany({
    where: { contractId: id },
    orderBy: { date: 'desc' },
    include: {
      creator: { select: { name: true } },
      milestone: { select: { title: true } },
    },
  })

  const totalLogs = dailyLogs.length
  const lastLog = dailyLogs[0]
  const avgProgress =
    totalLogs > 0
      ? Math.round(dailyLogs.reduce((s, l) => s + l.progressPct, 0) / totalLogs)
      : 0

  const progressClass =
    contract.physicalProgress >= 75
      ? 'success'
      : contract.physicalProgress >= 40
      ? ''
      : 'warning'

  return (
    <>
      <style>{`
        .diario-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }
        .log-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 20px;
          transition: all var(--transition-base);
          position: relative;
          overflow: hidden;
        }
        .log-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
        }
        .log-card:hover {
          border-color: var(--border-color-strong);
          box-shadow: var(--shadow-md);
        }
        .log-card.locked {
          border-color: rgba(239,68,68,0.2);
        }
        .weather-icon {
          font-size: 1.75rem;
          line-height: 1;
        }
        .progress-widget {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 20px;
          margin-bottom: 24px;
        }
        .stat-mini {
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          border: 1px solid var(--border-color);
        }
        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .badge-locked {
          background: rgba(239,68,68,0.15);
          color: #f87171;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .badge-progress {
          background: rgba(59,130,246,0.15);
          color: #93c5fd;
          padding: 2px 10px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .badge-photos {
          background: rgba(99,102,241,0.15);
          color: #a5b4fc;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .contract-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1px;
          margin-bottom: 24px;
        }
        .contract-tab {
          padding: 10px 16px;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          border-bottom: 2px solid transparent;
          transition: all var(--transition-fast);
          margin-bottom: -1px;
        }
        .contract-tab:hover {
          color: var(--text-primary);
        }
        .contract-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
          font-weight: 600;
        }
        @media (max-width: 900px) {
          .diario-layout { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="animate-fade-in">
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <Link href="/dashboard/contratos" className="btn btn-ghost btn-sm btn-icon" style={{ marginTop: 4 }}>
            <ArrowLeft size={18} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-info-dark" style={{ fontSize: '0.7rem', letterSpacing: '0.06em' }}>
                DIÁRIO DE OBRAS
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {contract.title}
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Contrato N. {contract.number}
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="contract-tabs">
          <Link href={`/dashboard/contratos/${id}`} className="contract-tab">Visao Geral</Link>
          <Link href={`/dashboard/contratos/${id}/diario`} className="contract-tab active">Diario</Link>
          <Link href={`/dashboard/contratos/${id}/medicoes`} className="contract-tab">Medicoes</Link>
          <Link href={`/dashboard/contratos/${id}#milestones`} className="contract-tab">Milestones</Link>
          <Link href={`/dashboard/contratos/${id}/medicoes#garantias`} className="contract-tab">Garantias</Link>
        </div>

        {/* Progress bar widget */}
        <div className="progress-widget mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm text-secondary">Progresso Físico Geral</span>
            <span className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              {contract.physicalProgress.toFixed(1)}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 12 }}>
            <div
              className={`progress-fill ${progressClass}`}
              style={{ width: `${contract.physicalProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted">{totalLogs} registros no diário</span>
            <span className="text-xs text-muted">Média: {avgProgress}%</span>
          </div>
        </div>

        {/* Main layout */}
        <div className="diario-layout">
          {/* LEFT COLUMN */}
          <div>
            {/* Form */}
            <CreateDailyLogForm
              contractId={id}
              milestones={contract.milestones.map((m) => ({
                id: m.id,
                title: m.title,
                status: m.status,
              }))}
            />

            {/* Logs list */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary" style={{ fontSize: '1rem' }}>
                  Registros Anteriores
                </h3>
                <span className="badge badge-neutral-dark">{totalLogs}</span>
              </div>

              {dailyLogs.length === 0 ? (
                <div className="empty-state card">
                  <div className="empty-state-icon">📋</div>
                  <p className="font-medium text-secondary" style={{ marginTop: 8 }}>
                    Nenhum registro ainda
                  </p>
                  <p className="text-xs text-muted mt-2">
                    Adicione o primeiro registro do diário de campo.
                  </p>
                </div>
              ) : (
                <div className="logs-list">
                  {dailyLogs.map((log) => {
                    const photos = (() => {
                      try {
                        return JSON.parse(log.photos) as string[]
                      } catch {
                        return []
                      }
                    })()
                    const isLocked = !!log.lockedAt

                    return (
                      <div key={log.id} className={`log-card ${isLocked ? 'locked' : ''}`}>
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="weather-icon">{getWeatherIcon(log.weather)}</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-primary" style={{ fontSize: '0.9375rem' }}>
                                  {formatDate(log.date)}
                                </span>
                                <span className="text-xs text-muted">{getWeatherLabel(log.weather)}</span>
                              </div>
                              {log.milestone && (
                                <span className="text-xs text-muted mt-1" style={{ display: 'block' }}>
                                  📌 {log.milestone.title}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap shrink-0">
                            <span className="badge-progress">{log.progressPct}%</span>
                            {isLocked && (
                              <span className="badge-locked">
                                <Lock size={10} /> TRAVADO
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-secondary mb-3" style={{ lineHeight: 1.65 }}>
                          {log.description}
                        </p>

                        {/* Footer row */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            {log.workforce != null && (
                              <span className="flex items-center gap-1 text-xs text-muted">
                                <Users size={12} />
                                {log.workforce} trabalhadores
                              </span>
                            )}
                            {photos.length > 0 && (
                              <span className="badge-photos">
                                <Camera size={11} /> {photos.length} foto{photos.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted">
                            por <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{log.creator.name}</span>
                            {' · '}
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Stats */}
            <div className="card mb-4">
              <div className="card-header">
                <span className="card-title">Estatísticas</span>
                <CloudSun size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="stat-mini">
                  <div className="text-xs text-muted mb-1">Total de Registros</div>
                  <div className="font-bold text-primary" style={{ fontSize: '1.5rem' }}>{totalLogs}</div>
                </div>
                <div className="stat-mini">
                  <div className="text-xs text-muted mb-1">Progresso Médio Registrado</div>
                  <div className="font-bold" style={{ fontSize: '1.5rem', color: 'var(--color-success)' }}>
                    {avgProgress}%
                  </div>
                </div>
                {lastLog && (
                  <div className="stat-mini">
                    <div className="text-xs text-muted mb-1">Último Registro</div>
                    <div className="font-medium text-primary text-sm">{formatDate(lastLog.date)}</div>
                    <div className="text-xs text-muted mt-1">{getWeatherIcon(lastLog.weather)} {getWeatherLabel(lastLog.weather)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Milestones */}
            {contract.milestones.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Marcos do Contrato</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contract.milestones.map((m) => {
                    const statusColors: Record<string, string> = {
                      PENDENTE: 'var(--text-muted)',
                      EM_ANDAMENTO: 'var(--color-primary)',
                      CONCLUIDO: 'var(--color-success)',
                      ATRASADO: 'var(--color-danger)',
                    }
                    const statusDots: Record<string, string> = {
                      PENDENTE: '⚪',
                      EM_ANDAMENTO: '🔵',
                      CONCLUIDO: '✅',
                      ATRASADO: '🔴',
                    }
                    return (
                      <div
                        key={m.id}
                        style={{
                          padding: '10px 12px',
                          background: 'var(--bg-elevated)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '0.875rem' }}>{statusDots[m.status]}</span>
                          <span className="text-sm font-medium text-primary truncate">{m.title}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="progress-bar" style={{ height: 4, flex: 1, marginRight: 8 }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${m.completionPct}%`,
                                background: statusColors[m.status],
                              }}
                            />
                          </div>
                          <span className="text-xs" style={{ color: statusColors[m.status], minWidth: 32, textAlign: 'right' }}>
                            {m.completionPct}%
                          </span>
                        </div>
                        <div className="text-xs text-muted mt-1">
                          Meta: {formatDate(m.targetDate)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Info alert */}
            <div className="alert alert-info mt-4">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="font-medium" style={{ marginBottom: 2 }}>Política de bloqueio</div>
                <div className="text-xs" style={{ lineHeight: 1.55 }}>
                  Registros são travados automaticamente após 24 horas de criação e não podem ser editados.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
