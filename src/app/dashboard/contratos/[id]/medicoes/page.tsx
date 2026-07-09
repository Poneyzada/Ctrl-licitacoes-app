import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getReajusteCountdown, daysUntil } from '@/lib/utils'
import { canAccessFinancial } from '@/lib/rbac'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  DollarSign,
  FileText,
  Shield,
  CalendarClock,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react'
import AprovacaoButton from './AprovacaoButton'
import UploadNFButton from './UploadNFButton'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_LABELS: Record<string, string> = {
  EM_ANALISE: 'Em Análise',
  APROVADO: 'Aprovado',
  FATURADO: 'Faturado',
  PAGO: 'Pago',
  ATRASADO: 'Atrasado',
}

const GUARANTEE_TYPE_LABELS: Record<string, string> = {
  SEGURO_OBRA: 'Seguro Obra',
  CAUCAO: 'Caução',
  FIANCA: 'Fiança Bancária',
  RETENCAO: 'Retenção Contratual',
  CARTA_FIANCA: 'Carta Fiança',
}

export default async function MedicoesPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) redirect('/login')

  const role = session.user.role as string

  if (role === 'OPERADOR_CAMPO') {
    redirect('/dashboard?error=sem-permissao')
  }

  if (!canAccessFinancial(role as any)) {
    redirect('/dashboard?error=sem-permissao')
  }

  const contract = await prisma.contract.findUnique({
    where: { id, deletedAt: null },
    include: {
      measurements: {
        orderBy: { createdAt: 'desc' },
        include: {
          approver: { select: { name: true } },
          invoice: true,
        },
      },
      guarantees: {
        orderBy: { expiryDate: 'asc' },
      },
    },
  })

  if (!contract) redirect('/dashboard/contratos')

  const reajuste = getReajusteCountdown(contract.baseDate)

  // Financial summary
  const totalMeasured = contract.measurements.reduce((s, m) => s + m.amount, 0)
  const totalPaid = contract.measurements
    .filter((m) => m.status === 'PAGO')
    .reduce((s, m) => s + m.amount, 0)
  const pendingAmount = contract.measurements
    .filter((m) => ['EM_ANALISE', 'APROVADO', 'FATURADO'].includes(m.status))
    .reduce((s, m) => s + m.amount, 0)
  const overdueCount = contract.measurements.filter((m) => m.status === 'ATRASADO').length

  // Guarantee status helper
  const getGuaranteeStatus = (expiryDate: Date) => {
    const days = daysUntil(expiryDate)
    if (days < 0) return { label: 'Vencida', cls: 'danger', days }
    if (days <= 30) return { label: `${days}d restantes`, cls: 'danger', days }
    if (days <= 60) return { label: `${days}d restantes`, cls: 'warning', days }
    return { label: `${days}d restantes`, cls: 'success', days }
  }

  return (
    <>
      <style>{`
        .medicoes-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .reajuste-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .reajuste-meta {
          font-size: 0.8125rem;
          opacity: 0.7;
          margin-top: 2px;
        }
        .timer-label {
          font-size: 0.75rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-weight: 600;
          opacity: 0.7;
        }
        .guarantee-card {
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          padding: 16px;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: flex-start;
          gap: 14px;
          transition: all var(--transition-base);
        }
        .guarantee-card:hover {
          border-color: var(--border-color-strong);
          box-shadow: var(--shadow-sm);
        }
        .guarantee-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 1.125rem;
        }
        .guarantee-icon.danger { background: rgba(239,68,68,0.12); }
        .guarantee-icon.warning { background: rgba(245,158,11,0.12); }
        .guarantee-icon.success { background: rgba(16,185,129,0.12); }
        .guarantees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }
        .expiry-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .expiry-badge.danger { background: rgba(239,68,68,0.15); color: #f87171; }
        .expiry-badge.warning { background: rgba(245,158,11,0.15); color: #fbbf24; }
        .expiry-badge.success { background: rgba(16,185,129,0.15); color: #34d399; }
        .action-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .table-nf {
          font-family: var(--font-mono, monospace);
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .contract-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1px;
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
      `}</style>

      <div className="animate-fade-in medicoes-layout">
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Link href="/dashboard/contratos" className="btn btn-ghost btn-sm btn-icon" style={{ marginTop: 4 }}>
            <ArrowLeft size={18} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-info-dark" style={{ fontSize: '0.7rem', letterSpacing: '0.06em' }}>
                MEDIÇÕES & FATURAMENTO
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
          <Link href={`/dashboard/contratos/${id}/diario`} className="contract-tab">Diario</Link>
          <Link href={`/dashboard/contratos/${id}/medicoes`} className="contract-tab active">Medicoes</Link>
          <Link href={`/dashboard/contratos/${id}#milestones`} className="contract-tab">Milestones</Link>
          <Link href={`/dashboard/contratos/${id}/medicoes#garantias`} className="contract-tab">Garantias</Link>
        </div>

        {/* Reajuste Timer - full width */}
        <div className={`reajuste-timer ${reajuste.status}`}>
          <div style={{ textAlign: 'center', minWidth: 80 }}>
            <div className="timer-days">{Math.abs(reajuste.days)}</div>
            <div className="timer-label">{reajuste.days < 0 ? 'dias vencido' : 'dias'}</div>
          </div>
          <div className="reajuste-info">
            <div
              className="font-semibold"
              style={{
                fontSize: '0.9375rem',
                color:
                  reajuste.status === 'safe'
                    ? '#34d399'
                    : reajuste.status === 'warning'
                    ? '#fbbf24'
                    : '#f87171',
              }}
            >
              {reajuste.days < 0
                ? '⚠️ Prazo de Reajuste Vencido'
                : reajuste.status === 'danger'
                ? '🔴 Reajuste Urgente'
                : reajuste.status === 'warning'
                ? '🟡 Reajuste Próximo'
                : '🟢 Reajuste em dia'}
            </div>
            <div className="reajuste-meta">
              Próxima data-base: {formatDate(reajuste.nextDate)} · Progresso do ciclo anual:{' '}
              {reajuste.percentage.toFixed(0)}%
            </div>
            <div className="progress-bar mt-2" style={{ height: 4 }}>
              <div
                className={`progress-fill ${reajuste.status === 'safe' ? 'success' : reajuste.status === 'warning' ? 'warning' : 'danger'}`}
                style={{ width: `${reajuste.percentage}%` }}
              />
            </div>
          </div>
          <CalendarClock
            size={28}
            style={{
              flexShrink: 0,
              opacity: 0.6,
              color:
                reajuste.status === 'safe'
                  ? 'var(--color-success)'
                  : reajuste.status === 'warning'
                  ? 'var(--color-warning)'
                  : 'var(--color-danger)',
            }}
          />
        </div>

        {/* Stats grid */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
              <TrendingUp size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="stat-label">Total Medido</div>
            <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: 6 }}>
              {formatCurrency(totalMeasured)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
            </div>
            <div className="stat-label">Total Pago</div>
            <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: 6, color: 'var(--color-success)' }}>
              {formatCurrency(totalPaid)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Clock size={20} style={{ color: 'var(--color-warning)' }} />
            </div>
            <div className="stat-label">A Receber</div>
            <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: 6, color: 'var(--color-warning)' }}>
              {formatCurrency(pendingAmount)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />
            </div>
            <div className="stat-label">Atrasadas</div>
            <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: 6, color: 'var(--color-danger)' }}>
              {overdueCount}
            </div>
          </div>
        </div>

        {/* Measurements Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            className="card-header"
            style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', marginBottom: 0 }}
          >
            <span className="card-title">
              <FileText size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Medições ({contract.measurements.length})
            </span>
          </div>

          {contract.measurements.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 24px' }}>
              <div className="empty-state-icon">📄</div>
              <p className="font-medium text-secondary" style={{ marginTop: 8 }}>
                Nenhuma medição cadastrada
              </p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Aprovado Por</th>
                    <th>Dt. Aprovação</th>
                    <th>NF Nº</th>
                    <th>Vencimento</th>
                    <th>Pago Em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contract.measurements.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <span className="font-medium text-primary">{m.period}</span>
                        {m.description && (
                          <div className="text-xs text-muted truncate" style={{ maxWidth: 140 }}>
                            {m.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="font-semibold text-primary">{formatCurrency(m.amount)}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${m.status.toLowerCase()}`}>
                          {STATUS_LABELS[m.status] ?? m.status}
                        </span>
                      </td>
                      <td>{m.approver?.name ?? <span className="text-muted">—</span>}</td>
                      <td>{m.approvedAt ? formatDate(m.approvedAt) : <span className="text-muted">—</span>}</td>
                      <td>
                        {m.invoice?.nfNumber ? (
                          <span className="table-nf">#{m.invoice.nfNumber}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {m.invoice?.dueAt ? (
                          <span
                            style={{
                              color: daysUntil(m.invoice.dueAt) < 0 ? 'var(--color-danger)' : 'inherit',
                            }}
                          >
                            {formatDate(m.invoice.dueAt)}
                          </span>
                        ) : m.dueDate ? (
                          <span
                            style={{
                              color: daysUntil(m.dueDate) < 0 ? 'var(--color-danger)' : 'inherit',
                            }}
                          >
                            {formatDate(m.dueDate)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {m.paidAt ? (
                          <span className="text-success">{formatDate(m.paidAt)}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div className="action-cell">
                          {(role === 'COORDENADOR' || role === 'DIRETORIA') &&
                            m.status === 'EM_ANALISE' && (
                              <AprovacaoButton measurementId={m.id} />
                            )}
                          {role === 'OPERADOR_ADM' && m.status === 'APROVADO' && (
                            <UploadNFButton measurementId={m.id} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Guarantees & Certidões */}
        <div className="card" id="garantias">
          <div className="card-header">
            <span className="card-title">
              <Shield size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Garantias & Certidões ({contract.guarantees.length})
            </span>
          </div>

          {contract.guarantees.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-state-icon">🛡️</div>
              <p className="font-medium text-secondary" style={{ marginTop: 8 }}>
                Nenhuma garantia cadastrada
              </p>
            </div>
          ) : (
            <div className="guarantees-grid">
              {contract.guarantees.map((g) => {
                const gStatus = getGuaranteeStatus(g.expiryDate)
                const icons: Record<string, string> = {
                  danger: '🔴',
                  warning: '🟡',
                  success: '🟢',
                }
                return (
                  <div key={g.id} className="guarantee-card">
                    <div className={`guarantee-icon ${gStatus.cls}`}>
                      <span>{icons[gStatus.cls]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-primary text-sm truncate">
                          {GUARANTEE_TYPE_LABELS[g.type] ?? g.type}
                        </span>
                        <span className={`expiry-badge ${gStatus.cls}`}>{gStatus.label}</span>
                      </div>
                      {g.description && (
                        <p className="text-xs text-secondary mb-2" style={{ lineHeight: 1.5 }}>
                          {g.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-muted">
                          Vencimento: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {formatDate(g.expiryDate)}
                          </span>
                        </span>
                        {g.renewedAt && (
                          <span className="text-xs text-muted">
                            Renovada: {formatDate(g.renewedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
