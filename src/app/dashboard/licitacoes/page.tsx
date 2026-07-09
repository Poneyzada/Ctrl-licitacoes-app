import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTenderStatusLabel, formatDate, truncate } from '@/lib/utils'
import Link from 'next/link'
import {
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Gavel,
} from 'lucide-react'

export const metadata = { title: 'Licitacoes - Ctrl-Licitacao' }

async function getTenders() {
  return prisma.tender.findMany({
    include: {
      contract: {
        select: {
          title: true,
          number: true,
          organ: true,
          startDate: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'APROVADO': return <CheckCircle size={14} />
    case 'RECUSADO': return <XCircle size={14} />
    case 'IMPUGNADO': return <AlertTriangle size={14} />
    default: return <FileText size={14} />
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'TRIAGEM': return 'badge badge-triagem'
    case 'APROVADO': return 'badge badge-aprovado'
    case 'RECUSADO': return 'badge badge-recusado'
    case 'IMPUGNADO': return 'badge badge-impugnado'
    default: return 'badge badge-neutral-dark'
  }
}

const STATUS_FILTERS = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Em Triagem', value: 'TRIAGEM' },
  { label: 'Aprovadas', value: 'APROVADO' },
  { label: 'Recusadas', value: 'RECUSADO' },
  { label: 'Impugnadas', value: 'IMPUGNADO' },
]

export default async function LicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await auth()
  const { status: filterStatus } = await searchParams

  const allTenders = await getTenders()

  const tenders =
    !filterStatus || filterStatus === 'ALL'
      ? allTenders
      : allTenders.filter((t) => t.status === filterStatus)

  const counts = {
    ALL: allTenders.length,
    TRIAGEM: allTenders.filter((t) => t.status === 'TRIAGEM').length,
    APROVADO: allTenders.filter((t) => t.status === 'APROVADO').length,
    RECUSADO: allTenders.filter((t) => t.status === 'RECUSADO').length,
    IMPUGNADO: allTenders.filter((t) => t.status === 'IMPUGNADO').length,
  }

  return (
    <div className="animate-fade-in">
      <style>{`
        .licitacoes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 18px;
        }
        .tender-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all var(--transition-base);
          position: relative;
          overflow: hidden;
        }
        .tender-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          opacity: 0;
          transition: opacity var(--transition-base);
        }
        .tender-card:hover {
          border-color: var(--border-color-strong);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .tender-card:hover::before { opacity: 1; }
        .tender-card.status-triagem::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
        .tender-card.status-aprovado::before { background: var(--gradient-success); }
        .tender-card.status-recusado::before { background: var(--gradient-danger); }
        .tender-card.status-impugnado::before { background: linear-gradient(90deg, #a855f7, #7c3aed); }
        .tender-card-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.4;
        }
        .tender-card-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tender-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }
        .tender-meta-row svg { color: var(--text-muted); flex-shrink: 0; }
        .tender-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
          margin-top: auto;
        }
        .status-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 500;
          border: 1px solid var(--border-color-strong);
          background: var(--bg-elevated);
          color: var(--text-secondary);
          text-decoration: none;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .filter-chip:hover { border-color: var(--color-primary); color: var(--color-primary); background: rgba(59,130,246,0.1); }
        .filter-chip.active { border-color: var(--color-primary); color: var(--color-primary); background: rgba(59,130,246,0.15); font-weight: 600; }
        .filter-count {
          background: rgba(255,255,255,0.1);
          border-radius: var(--radius-full);
          padding: 1px 7px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        .filter-chip.active .filter-count { background: rgba(59,130,246,0.2); }
        .organ-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          background: rgba(99,102,241,0.1);
          color: #a5b4fc;
          font-size: 0.75rem;
          font-weight: 500;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ai-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          background: rgba(168,85,247,0.1);
          color: #c4b5fd;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        @media (max-width: 640px) {
          .licitacoes-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Gavel size={26} style={{ color: 'var(--color-primary)' }} />
            Licitacoes
          </h1>
          <p className="page-subtitle">
            {allTenders.length === 0
              ? 'Nenhuma licitacao cadastrada'
              : `${allTenders.length} licitaca${allTenders.length === 1 ? 'o' : 'oes'} no total`}
          </p>
        </div>
        <Link href="/dashboard/licitacoes/novo" className="btn btn-primary">
          <Plus size={16} />
          Nova Licitacao
        </Link>
      </div>

      {/* Status Filters */}
      <div className="status-filters">
        {STATUS_FILTERS.map((f) => {
          const isActive = (!filterStatus && f.value === 'ALL') || filterStatus === f.value
          const count = counts[f.value as keyof typeof counts]
          return (
            <Link
              key={f.value}
              href={f.value === 'ALL' ? '/dashboard/licitacoes' : `/dashboard/licitacoes?status=${f.value}`}
              className={`filter-chip${isActive ? ' active' : ''}`}
            >
              {f.label}
              <span className="filter-count">{count}</span>
            </Link>
          )
        })}
      </div>

      {/* Grid */}
      {tenders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Gavel size={48} />
          </div>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
            Nenhuma licitacao encontrada
          </h3>
          <p style={{ marginBottom: 20 }}>
            {filterStatus && filterStatus !== 'ALL'
              ? 'Tente outro filtro ou cadastre uma nova licitacao.'
              : 'Comece cadastrando sua primeira licitacao.'}
          </p>
          <Link href="/dashboard/licitacoes/novo" className="btn btn-primary btn-sm">
            <Plus size={14} />
            Nova Licitacao
          </Link>
        </div>
      ) : (
        <div className="licitacoes-grid">
          {tenders.map((tender) => (
            <div key={tender.id} className={`tender-card status-${tender.status.toLowerCase()}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="tender-card-title">{truncate(tender.title, 72)}</p>
                <span className={getStatusBadgeClass(tender.status)} style={{ flexShrink: 0 }}>
                  {getStatusIcon(tender.status)}
                  {getTenderStatusLabel(tender.status)}
                </span>
              </div>

              <div className="tender-card-meta">
                <div className="tender-meta-row">
                  <FileText size={13} />
                  <span>
                    <span style={{ color: 'var(--text-muted)' }}>N&deg;</span>{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{tender.contract.number}</strong>
                  </span>
                </div>

                <div className="tender-meta-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  <span className="organ-tag" title={tender.contract.organ}>{tender.contract.organ}</span>
                </div>

                <div className="tender-meta-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>Publicado em {formatDate(tender.contract.startDate)}</span>
                </div>

                <div className="tender-meta-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Cadastrado em {formatDate(tender.createdAt)}</span>
                </div>
              </div>

              <div className="tender-card-footer">
                <div className="flex items-center gap-2">
                  {tender.aiReport && (
                    <span className="ai-indicator">&#10022; IA</span>
                  )}
                  {tender.editalUrl && (
                    <a
                      href={tender.editalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      Edital
                    </a>
                  )}
                </div>
                <Link href={`/dashboard/licitacoes/${tender.id}`} className="btn btn-secondary btn-sm">
                  <Eye size={13} />
                  Ver detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}