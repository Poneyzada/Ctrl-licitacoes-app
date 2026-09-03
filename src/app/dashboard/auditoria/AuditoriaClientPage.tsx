'use client'

import { useState, useEffect } from 'react'
import { formatDateTime } from '@/lib/utils'
import { ClipboardList, X, Info, ShieldAlert, Search, Filter, ShieldCheck, UserCheck } from 'lucide-react'

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
    email?: string
    role: string
  }
  contract?: {
    title: string
    number: string
  } | null
}

const actionConfig: Record<string, { label: string; color: string; bg: string }> = {
  LOGIN: { label: 'Acesso / Login', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)' },
  CREATE: { label: 'Criação', color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)' },
  UPDATE: { label: 'Atualização', color: '#fcd34d', bg: 'rgba(245,158,11,0.12)' },
  DELETE: { label: 'Exclusão', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  APPROVE: { label: 'Aprovação', color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
  REJECT: { label: 'Rejeição', color: '#fb923c', bg: 'rgba(249,115,22,0.12)' },
  DEDUPLICATE: { label: 'Deduplicação', color: '#c084fc', bg: 'rgba(168,85,247,0.15)' },
  UPLOAD: { label: 'Envio de Documento', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)' },
}

const roleColors: Record<string, string> = {
  DIRETORIA: '#f87171',
  DIRETOR: '#f87171',
  COORDENADOR: '#a5b4fc',
  MANUTENCAO_MASTER: '#c084fc',
  OPERADOR: '#6ee7b7',
  OPERADOR_CAMPO: '#6ee7b7',
  OPERADOR_ADM: '#fcd34d',
}

export default function AuditoriaClientPage({ initialLogs }: { initialLogs: any[] }) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [logs] = useState<AuditLog[]>(initialLogs)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [userFilter, setUserFilter] = useState('ALL')

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

  // Unique users for filter
  const uniqueUsers = Array.from(new Set(logs.map(l => l.user?.name).filter(Boolean)))

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false
    if (userFilter !== 'ALL' && log.user?.name !== userFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const matchUser = log.user?.name?.toLowerCase().includes(q) || log.user?.email?.toLowerCase().includes(q)
      const matchEntity = log.entity?.toLowerCase().includes(q)
      const matchMeta = log.metadata?.toLowerCase().includes(q)
      if (!matchUser && !matchEntity && !matchMeta) return false
    }
    return true
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} style={{ color: 'var(--color-primary)' }} />
            Trilha de Auditoria & Acessos Unificados
          </h1>
          <p className="page-subtitle">
            Rastreamento em tempo real de acessos, uploads de documentos e alterações de todos os membros
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por usuário, ação, documento ou detalhes..." 
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', width: '100%' }}
            />
          </div>

          <select 
            value={actionFilter} 
            onChange={(e) => setActionFilter(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '170px' }}
          >
            <option value="ALL">Ação: Todas</option>
            <option value="LOGIN">Acessos / Logins</option>
            <option value="CREATE">Criações</option>
            <option value="UPDATE">Atualizações</option>
            <option value="DELETE">Exclusões</option>
            <option value="DEDUPLICATE">Deduplicações</option>
            <option value="APPROVE">Aprovações</option>
          </select>

          <select 
            value={userFilter} 
            onChange={(e) => setUserFilter(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '180px' }}
          >
            <option value="ALL">Membro: Todos</option>
            {uniqueUsers.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {(search || actionFilter !== 'ALL' || userFilter !== 'ALL') && (
            <button 
              onClick={() => { setSearch(''); setActionFilter('ALL'); setUserFilter('ALL'); }}
              className="btn btn-ghost btn-sm" 
              style={{ height: '40px' }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">Registros de Atividade ({filteredLogs.length})</h3>
          <span className="badge badge-neutral-dark">Visível para toda a Diretoria & Coordenação</span>
        </div>

        <p className="help-text-click" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          💡 Clique em qualquer linha para visualizar o conteúdo exato das alterações ou dados enviados.
        </p>

        <div className="table-wrapper">
          <table className="table audit-table">
            <thead>
              <tr>
                <th>Ação Realizada</th>
                <th>Membro / Usuário</th>
                <th>Perfil</th>
                <th>Módulo / Entidade</th>
                <th>Data e Hora</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    Nenhum log de auditoria encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const cfg = actionConfig[log.action] || { label: log.action, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }
                  const rColor = roleColors[log.user?.role] || '#94a3b8'

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.color}30`,
                            display: 'inline-block',
                          }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.user?.name || 'Sistema'}
                        </div>
                        {log.user?.email && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {log.user.email}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-sm)',
                            background: `${rColor}18`,
                            color: rColor,
                          }}
                        >
                          {log.user?.role || 'N/A'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {log.entity} {log.entityId ? `(#${log.entityId.slice(0, 8)})` : ''}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
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

      {/* Modal de Detalhes do Log */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Detalhes do Evento</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Usuário</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedLog.user?.name} ({selectedLog.user?.email || 'N/A'}) — Cargo: {selectedLog.user?.role}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ação / Entidade</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedLog.action} em {selectedLog.entity} (ID: {selectedLog.entityId || 'N/A'})
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Data e Hora Exata</span>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {formatDateTime(new Date(selectedLog.createdAt))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dados Registrados (Payload)</span>
                <pre style={{
                  background: 'var(--bg-elevated)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  overflowX: 'auto',
                  marginTop: '4px',
                  color: 'var(--text-primary)'
                }}>
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)
                    } catch {
                      return selectedLog.metadata || 'Sem payload adicional'
                    }
                  })()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
