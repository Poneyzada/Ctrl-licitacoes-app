import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTenderStatusLabel, formatDate, formatDateTime, truncate } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bot,
  User,
  Calendar,
  Building2,
  Hash,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
} from 'lucide-react'

export const metadata = { title: 'Detalhe da Licitacao - Ctrl-Licitacao' }

async function getTender(id: string) {
  return prisma.tender.findUnique({
    where: { id },
    include: {
      contract: true,
      decider: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  })
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

function getStatusIcon(status: string) {
  switch (status) {
    case 'APROVADO': return <CheckCircle size={14} />
    case 'RECUSADO': return <XCircle size={14} />
    case 'IMPUGNADO': return <AlertTriangle size={14} />
    default: return <FileText size={14} />
  }
}

function getAderenciaColor(score: number): string {
  if (score >= 90) return 'var(--color-success)'
  if (score >= 70) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function getAderenciaLabel(score: number): string {
  if (score >= 90) return 'Excelente'
  if (score >= 70) return 'Adequado'
  return 'Critico'
}

interface AiReportData {
  aderencia?: number
  pontosCriticos?: string[]
  recomendacao?: string
  resumo?: string
}

const hasAnthropicKey = !!(process.env.ANTHROPIC_API_KEY)

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await auth()
  const { id } = await params

  const tender = await getTender(id)
  if (!tender) notFound()

  let aiReport: AiReportData | null = null
  if (tender.aiReport) {
    try {
      aiReport = JSON.parse(tender.aiReport) as AiReportData
    } catch {
      aiReport = null
    }
  }

  const aderenciaColor = aiReport?.aderencia != null
    ? getAderenciaColor(aiReport.aderencia)
    : undefined

  return (
    <div className="animate-fade-in">
      <style>{`
        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: start;
        }
        .detail-info-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border-color);
        }
        .detail-info-row:last-child { border-bottom: none; }
        .detail-info-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .detail-info-value {
          font-size: 0.9375rem;
          color: var(--text-primary);
          font-weight: 500;
        }
        .ai-score-ring {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          border: 3px solid;
          font-size: 1.75rem;
          font-weight: 800;
          line-height: 1;
          flex-shrink: 0;
        }
        .critical-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .critical-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .critical-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-warning);
          flex-shrink: 0;
          margin-top: 6px;
        }
        .decision-panel {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
        }
        .decision-panel-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .decision-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .decided-by-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .decider-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .decider-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .ai-panel {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
        }
        .ai-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .ai-panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .ai-score-section {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          padding: 16px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
        }
        .ai-score-info { flex: 1; }
        .ai-score-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }
        .ai-score-name { font-size: 1rem; font-weight: 700; }
        .section-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 10px;
        }
        .resumo-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
          padding: 14px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          border-left: 3px solid var(--color-primary);
        }
        .no-report-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px 16px;
          text-align: center;
          color: var(--text-muted);
        }
        @media (max-width: 900px) {
          .detail-layout { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/licitacoes" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
          <ArrowLeft size={15} />
          Voltar para Licitacoes
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="page-title" style={{ marginBottom: 8 }}>{tender.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={getStatusBadgeClass(tender.status)}>
                {getStatusIcon(tender.status)}
                {getTenderStatusLabel(tender.status)}
              </span>
              <span className="text-muted text-sm">ID: {tender.id.slice(0, 8)}...</span>
              <span className="text-muted text-sm">Criado em {formatDate(tender.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                Dados do Edital
              </span>
            </div>

            <div className="detail-info-row">
              <span className="detail-info-label"><Hash size={12} /> Numero do Edital</span>
              <span className="detail-info-value">{tender.contract.number}</span>
            </div>

            <div className="detail-info-row">
              <span className="detail-info-label"><Building2 size={12} /> Orgao Contratante</span>
              <span className="detail-info-value">{tender.contract.organ}</span>
            </div>

            <div className="detail-info-row">
              <span className="detail-info-label"><Calendar size={12} /> Data de Publicacao</span>
              <span className="detail-info-value">{formatDate(tender.contract.startDate)}</span>
            </div>

            {tender.contract.endDate && (
              <div className="detail-info-row">
                <span className="detail-info-label"><Calendar size={12} /> Prazo de Entrega</span>
                <span className="detail-info-value">{formatDate(tender.contract.endDate)}</span>
              </div>
            )}

            {tender.contract.description && (
              <div className="detail-info-row">
                <span className="detail-info-label"><FileText size={12} /> Observacoes</span>
                <span className="detail-info-value" style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                  {tender.contract.description}
                </span>
              </div>
            )}

            {tender.editalUrl && (
              <div className="detail-info-row">
                <span className="detail-info-label"><ExternalLink size={12} /> Link do Edital</span>
                <a
                  href={tender.editalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--color-primary)', wordBreak: 'break-all' }}
                >
                  <ExternalLink size={13} />
                  {truncate(tender.editalUrl, 60)}
                </a>
              </div>
            )}
          </div>

          <div className="ai-panel">
            <div className="ai-panel-header">
              <span className="ai-panel-title">
                <Bot size={16} style={{ color: '#c4b5fd' }} />
                Analise de IA
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={!hasAnthropicKey}
                title={!hasAnthropicKey ? 'Configure ANTHROPIC_API_KEY no .env.local' : 'Analisar com IA'}
              >
                <Bot size={14} />
                Analisar com IA
              </button>
            </div>

            {!hasAnthropicKey && (
              <div className="alert alert-warning" style={{ marginBottom: 16, fontSize: '0.8125rem' }}>
                <AlertTriangle size={16} />
                <span>
                  Configure ANTHROPIC_API_KEY no arquivo .env.local para habilitar a analise de IA.
                </span>
              </div>
            )}

            {aiReport ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {aiReport.aderencia != null && (
                  <div className="ai-score-section">
                    <div
                      className="ai-score-ring"
                      style={{ borderColor: aderenciaColor, color: aderenciaColor }}
                    >
                      {aiReport.aderencia}
                    </div>
                    <div className="ai-score-info">
                      <div className="ai-score-label">Aderencia ao Escopo</div>
                      <div className="ai-score-name" style={{ color: aderenciaColor }}>
                        {getAderenciaLabel(aiReport.aderencia)}
                      </div>
                      <div className="text-xs text-muted" style={{ marginTop: 4 }}>Pontuacao de 0 a 100</div>
                    </div>
                    {aiReport.recomendacao && (
                      <span
                        className={`badge ${
                          aiReport.recomendacao === 'APROVADO' ? 'badge-aprovado'
                          : aiReport.recomendacao === 'RECUSADO' ? 'badge-recusado'
                          : 'badge-triagem'
                        }`}
                        style={{ alignSelf: 'center' }}
                      >
                        {aiReport.recomendacao === 'APROVADO' && <CheckCircle size={12} />}
                        {aiReport.recomendacao === 'RECUSADO' && <XCircle size={12} />}
                        {aiReport.recomendacao}
                      </span>
                    )}
                  </div>
                )}

                {aiReport.pontosCriticos && aiReport.pontosCriticos.length > 0 && (
                  <div>
                    <div className="section-label">Pontos Criticos</div>
                    <ul className="critical-list">
                      {aiReport.pontosCriticos.map((ponto, i) => (
                        <li key={i} className="critical-item">
                          <span className="critical-dot" />
                          {ponto}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiReport.resumo && (
                  <div>
                    <div className="section-label">Resumo da Analise</div>
                    <p className="resumo-text">{aiReport.resumo}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-report-placeholder">
                <Bot size={40} style={{ opacity: 0.3 }} />
                <div>
                  <p style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Nenhuma analise disponivel
                  </p>
                  <p className="text-sm">
                    Clique em "Analisar com IA" para gerar um relatorio automatico.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {tender.status === 'TRIAGEM' && (
            <div className="decision-panel">
              <div className="decision-panel-title">Decisao sobre a Licitacao</div>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                Avalie o edital e registre a decisao da equipe.
              </p>
              <div className="decision-buttons">
                <a href="#" className="btn btn-success w-full" style={{ justifyContent: 'center' }}>
                  <ShieldCheck size={15} />
                  Aprovar Licitacao
                </a>
                <a href="#" className="btn btn-danger w-full" style={{ justifyContent: 'center' }}>
                  <ShieldX size={15} />
                  Recusar Licitacao
                </a>
                <a href="#" className="btn btn-warning w-full" style={{ justifyContent: 'center' }}>
                  <ShieldAlert size={15} />
                  Impugnar Licitacao
                </a>
              </div>
            </div>
          )}

          {tender.decider && tender.decisionAt && (
            <div className="card">
              <div className="card-header">
                <span className="card-title flex items-center gap-2">
                  <User size={15} style={{ color: 'var(--color-primary)' }} />
                  Decisao Registrada
                </span>
                <span className={getStatusBadgeClass(tender.status)}>
                  {getStatusIcon(tender.status)}
                  {getTenderStatusLabel(tender.status)}
                </span>
              </div>

              <div className="decided-by-card">
                <div className="decider-row">
                  <div className="decider-avatar">{getInitials(tender.decider.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-primary truncate">{tender.decider.name}</div>
                    <div className="text-xs text-muted truncate">{tender.decider.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Calendar size={12} />
                  <span>Decidido em {formatDateTime(tender.decisionAt)}</span>
                </div>
                {tender.decisionNote && (
                  <div style={{
                    padding: '10px 12px',
                    background: 'var(--bg-base)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    borderLeft: '3px solid var(--border-color-strong)',
                  }}>
                    {tender.decisionNote}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span className="card-title">Informacoes do Contrato</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Escopo</span>
                <span className="text-primary font-medium">
                  {tender.contract.scope === 'OBRA' ? 'Obra' : tender.contract.scope === 'SERVICO' ? 'Servico' : 'Gerenciamento'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Status</span>
                <span className="badge badge-success-dark">{tender.contract.status}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Valor Total</span>
                <span className="text-primary font-semibold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tender.contract.totalValue)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Progresso Fisico</span>
                <span className="text-primary font-medium">{tender.contract.physicalProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}