'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { formatDateTime } from '@/lib/utils'
import { ClipboardList, X, Info, ShieldAlert } from 'lucide-react'

// Definição dos tipos locais
interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  metadata: string
  createdAt: string
  user: {
    name: string
    role: string
  }
  contract?: {
    title: string
    number: string
  } | null
}

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

export default function AuditoriaClientPage({ initialLogs }: { initialLogs: any[] }) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [logs] = useState<AuditLog[]>(initialLogs)

  // Desativa scroll do body quando o modal está aberto
  useEffect(() => {
    if (selectedLog) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedLog])

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
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <h3 className="card-title">Registros de Atividade</h3>
          <span className="badge badge-neutral-dark">{logs.length} eventos</span>
        </div>

        <p className="help-text-click">💡 Clique em qualquer linha para ver os detalhes completos em um pop-up.</p>

        <div className="table-wrapper">
          <table className="table audit-table">
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
                    <tr key={log.id} onClick={() => setSelectedLog(log)} className="audit-row">
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
                        {formatDateTime(new Date(log.createdAt))}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP / MODAL DETALHADO DO LOG DE AUDITORIA */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal audit-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Info size={18} color="#3b82f6" />
                Detalhes da Atividade
              </h3>
              <button className="btn-close" onClick={() => setSelectedLog(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Ação Realizada</span>
                  <div>
                    <span
                      className="badge"
                      style={{
                        background: actionConfig[selectedLog.action]?.bg || 'rgba(255,255,255,0.08)',
                        color: actionConfig[selectedLog.action]?.color || '#fff',
                        fontSize: '0.8rem',
                        padding: '4px 10px'
                      }}
                    >
                      {actionConfig[selectedLog.action]?.label || selectedLog.action}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Usuário Responsável</span>
                  <div className="flex items-center gap-2">
                    <div className="avatar avatar-sm" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                      {getInitials(selectedLog.user.name)}
                    </div>
                    <div>
                      <div className="text-primary font-medium text-sm">{selectedLog.user.name}</div>
                      <div
                        className="text-xs font-semibold"
                        style={{ color: roleColors[selectedLog.user.role] }}
                      >
                        {selectedLog.user.role.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Data e Hora</span>
                  <span className="text-primary text-sm font-medium">
                    {formatDateTime(new Date(selectedLog.createdAt))}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Tabela / Entidade</span>
                  <span className="text-secondary text-sm font-mono bg-elevated px-2 py-1 rounded">
                    {selectedLog.entity} {selectedLog.entityId && `(ID: ${selectedLog.entityId})`}
                  </span>
                </div>

                {selectedLog.contract && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Contrato Vinculado</span>
                    <div className="bg-elevated p-3 rounded-md border border-color">
                      <div className="text-sm font-semibold text-primary">{selectedLog.contract.title}</div>
                      <div className="text-xs text-muted mt-1">Número: {selectedLog.contract.number}</div>
                    </div>
                  </div>
                )}

                <div className="detail-item full-width">
                  <span className="detail-label">Informações Adicionais</span>
                  <div className="metadata-container bg-elevated">
                    {(() => {
                      try {
                        const meta = JSON.parse(selectedLog.metadata)
                        const keys = Object.keys(meta)
                        if (keys.length === 0) return <span className="text-muted text-xs">Nenhuma informação extra registrada.</span>
                        
                        const translateKey = (k: string) => {
                          const dict: Record<string, string> = {
                            ip: 'Endereço IP',
                            amount: 'Valor Relacionado',
                            period: 'Período de Referência',
                            decision: 'Parecer / Decisão',
                            note: 'Notas / Justificativa',
                            nfNumber: 'Número da Nota Fiscal',
                            date: 'Data informada',
                            weather: 'Clima lançado',
                          }
                          return dict[k] || k.charAt(0).toUpperCase() + k.slice(1)
                        }

                        const formatValue = (k: string, v: any) => {
                          if (k === 'amount' && typeof v === 'number') {
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
                          }
                          if (k === 'weather' && typeof v === 'string') {
                            const weatherDict: Record<string, string> = {
                              ENSOLARADO: 'Ensolarado ☀️',
                              NUBLADO: 'Nublado ☁️',
                              CHUVOSO: 'Chuvoso 🌧️',
                              TEMPESTADE: 'Tempestade ⛈️',
                            }
                            return weatherDict[v] || v
                          }
                          if (k === 'date' && typeof v === 'string') {
                            try {
                              return new Date(v).toLocaleDateString('pt-BR')
                            } catch (e) {
                              return v
                            }
                          }
                          if (v === null || v === undefined) return '—'
                          if (typeof v === 'object') return JSON.stringify(v)
                          return String(v)
                        }

                        return (
                          <div className="meta-list">
                            {keys.map((k) => (
                              <div key={k} className="meta-row">
                                <span className="meta-key">{translateKey(k)}</span>
                                <span className="meta-value">{formatValue(k, meta[k])}</span>
                              </div>
                            ))}
                          </div>
                        )
                      } catch (e) {
                        return <span className="text-primary text-xs font-mono">{selectedLog.metadata}</span>
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLog(null)}>
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

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

        .help-text-click {
          font-size: 0.75rem;
          color: var(--color-primary);
          margin-bottom: 12px;
          background: rgba(59, 130, 246, 0.05);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          display: inline-block;
        }

        .audit-row {
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .audit-row:hover {
          background: rgba(255, 255, 255, 0.035) !important;
        }

        .whitespace-nowrap { white-space: nowrap; }

        /* Modal customizado */
        .audit-modal {
          background: var(--bg-surface);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 520px;
          border: 1px solid var(--border-color-strong);
        }

        .btn-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
        }

        .btn-close:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 8px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-item.full-width {
          grid-column: span 2;
        }

        .detail-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .bg-elevated {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
        }

        .metadata-container {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px;
          max-height: 180px;
          overflow-y: auto;
        }

        .meta-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 6px;
        }

        .meta-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .meta-key {
          font-size: 0.725rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .meta-value {
          font-size: 0.75rem;
          color: var(--text-primary);
          font-weight: 600;
          font-family: var(--font-mono);
          text-align: right;
        }

        @media (max-width: 500px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }
          .detail-item.full-width {
            grid-column: span 1;
          }
        }

        @keyframes scaleIn {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .animate-scale-in {
          animation: scaleIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
