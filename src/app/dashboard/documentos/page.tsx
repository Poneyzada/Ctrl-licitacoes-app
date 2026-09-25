"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Filter, Plus, AlertCircle, 
  CheckCircle2, Clock, FileText, Building2, Calendar, 
  AlertTriangle, XCircle, ArrowUpRight, Loader2, X, Save,
  Trash2, RefreshCw, Eye, Download, FileUp
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal Novo Documento State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDoc, setNewDoc] = useState({
    orgId: '',
    nome: '',
    tipo: 'CND_FEDERAL',
    numero: '',
    emissor: '',
    emissao: '',
    vencimento: '',
    semVencimento: false,
    observacoes: '',
    storageUrl: '',
    storageKey: ''
  });

  // Modal Ver / Renovar State
  const [renovarModalOpen, setRenovarModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [renovarData, setRenovarData] = useState({
    numero: '',
    emissao: '',
    vencimento: '',
    semVencimento: false,
    observacoes: '',
    status: 'VIGENTE',
    storageUrl: '',
    storageKey: ''
  });
  const [updating, setUpdating] = useState(false);

  const downloadOrOpenDoc = (url: string, name: string) => {
    if (!url) {
      alert('Arquivo sem anexo ou link de visualização disponível.');
      return;
    }
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = name && name.includes('.') ? name : `${name || 'documento'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(url, '_blank');
    }
  };

  const [stats, setStats] = useState({
    validos: 0,
    atencao: 0,
    critico: 0,
    vencidos: 0
  });

  useEffect(() => {
    fetch('/api/empresas')
      .then(res => res.json())
      .then(data => {
        setOrganizations(data);
        if (data.length > 0) {
          setNewDoc(prev => ({ ...prev, orgId: data[0].id }));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [filterEmpresa, filterStatus, search]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let url = '/api/documentos?';
      if (filterEmpresa) url += `orgId=${filterEmpresa}&`;
      if (filterStatus !== 'ALL') url += `status=${filterStatus}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        // Calculate status dynamically
        const now = new Date();
        const processed = data.map((doc: any) => {
          if (doc.semVencimento) {
            return { ...doc, daysLeft: 999, uiStatus: 'VIGENTE' };
          }
          if (!doc.vencimento) {
            return { ...doc, daysLeft: 0, uiStatus: 'SEM_DATA' };
          }
          const venc = new Date(doc.vencimento);
          const diffTime = venc.getTime() - now.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let uiStatus = 'VIGENTE';
          if (daysLeft < 0) uiStatus = 'VENCIDO';
          else if (daysLeft <= 15) uiStatus = 'CRITICO';
          else if (daysLeft <= 30) uiStatus = 'ATENCAO';

          return { ...doc, daysLeft, uiStatus };
        });

        setDocuments(processed);

        // Update Stats
        const validos = processed.filter((d: any) => d.uiStatus === 'VIGENTE').length;
        const atencao = processed.filter((d: any) => d.uiStatus === 'ATENCAO').length;
        const critico = processed.filter((d: any) => d.uiStatus === 'CRITICO').length;
        const vencidos = processed.filter((d: any) => d.uiStatus === 'VENCIDO').length;

        setStats({ validos, atencao, critico, vencidos });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.nome || !newDoc.orgId) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });

      if (res.ok) {
        setModalOpen(false);
        setNewDoc({
          orgId: organizations[0]?.id || '',
          nome: '',
          tipo: 'CND_FEDERAL',
          numero: '',
          emissor: '',
          emissao: '',
          vencimento: '',
          semVencimento: false,
          observacoes: '',
          storageUrl: '',
          storageKey: ''
        });
        fetchDocuments();
      } else {
        alert('Erro ao cadastrar documento');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenRenovar = (doc: any) => {
    setSelectedDoc(doc);
    setRenovarData({
      numero: doc.numero || '',
      emissao: doc.emissao ? doc.emissao.split('T')[0] : '',
      vencimento: doc.vencimento ? doc.vencimento.split('T')[0] : '',
      semVencimento: doc.semVencimento || false,
      observacoes: doc.observacoes || '',
      status: doc.status || 'VIGENTE',
      storageUrl: doc.storageUrl || '',
      storageKey: doc.storageKey || ''
    });
    setRenovarModalOpen(true);
  };

  const handleSaveRenovar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/documentos/${selectedDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(renovarData)
      });

      if (res.ok) {
        setRenovarModalOpen(false);
        fetchDocuments();
      } else {
        alert('Erro ao atualizar documento');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao conectar com servidor');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Deseja realmente remover este documento do radar?')) return;

    try {
      const res = await fetch(`/api/documentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRenovarModalOpen(false);
        fetchDocuments();
      } else {
        alert('Erro ao excluir documento');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string, daysLeft: number, semVencimento: boolean) => {
    if (semVencimento) {
      return (
        <span className="badge badge-aprovado">
          ✓ Sem Vencimento
        </span>
      );
    }

    switch (status) {
      case 'VENCIDO':
        return (
          <span className="badge badge-atrasado">
            ✕ Vencida ({Math.abs(daysLeft)}d atrás)
          </span>
        );
      case 'CRITICO':
        return (
          <span className="badge badge-atrasado">
            ⚠ Crítico ({daysLeft}d restantes)
          </span>
        );
      case 'ATENCAO':
        return (
          <span className="badge badge-em_analise">
            ⏰ Atenção ({daysLeft}d restantes)
          </span>
        );
      case 'VIGENTE':
        return (
          <span className="badge badge-pago">
            ✓ Vigente ({daysLeft}d restantes)
          </span>
        );
      default:
        return (
          <span className="badge badge-neutral-dark">
            Não informado
          </span>
        );
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Radar de Documentos & Compliance</h1>
          <p className="page-subtitle">
            Monitoramento de CNDs, certidões fiscais, balanços e habilitação jurídica
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setModalOpen(true)} 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Nova Certidão / Documento
          </button>
        </div>
      </div>

      {/* KPI Cards — Radar de Vencimentos */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#34d399' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>{stats.validos}</div>
          <div className="stat-label">Certidões Vigentes (&gt;30d)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <Clock size={22} />
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.atencao}</div>
          <div className="stat-label">Vencendo em até 30 dias</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.12)', color: '#fb923c' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-value" style={{ color: '#fb923c' }}>{stats.critico}</div>
          <div className="stat-label">Crítico (Vence em ≤15 dias)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>
            <XCircle size={22} />
          </div>
          <div className="stat-value" style={{ color: '#f87171' }}>{stats.vencidos}</div>
          <div className="stat-label">Certidões Vencidas</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '28px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por certidão, emissor, número..." 
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', width: '100%' }}
            />
          </div>

          <select 
            value={filterEmpresa} 
            onChange={(e) => setFilterEmpresa(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '180px' }}
          >
            <option value="">Empresa: Todas</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.tradeName || org.name}</option>
            ))}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '160px' }}
          >
            <option value="ALL">Status: Todos</option>
            <option value="VIGENTE">Vigente</option>
            <option value="ATENCAO">Atenção (≤30d)</option>
            <option value="CRITICO">Crítico (≤15d)</option>
            <option value="VENCIDO">Vencido</option>
          </select>

          {(search || filterEmpresa || filterStatus !== 'ALL') && (
            <button 
              onClick={() => { setSearch(''); setFilterEmpresa(''); setFilterStatus('ALL'); }}
              className="btn btn-ghost btn-sm" 
              style={{ height: '40px' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando radar de documentos...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShieldCheck size={44} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Nenhum documento encontrado</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Cadastre as certidões e balanços para manter o radar atualizado.
          </p>
          <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> Cadastrar Documento
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Documento / Certidão</th>
                <th>Empresa</th>
                <th>Órgão Emissor</th>
                <th>Emissão</th>
                <th>Vencimento</th>
                <th>Radar de Validade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const isUfc = doc.organization?.name?.toLowerCase().includes('ufc');

                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.nome}</div>
                      {doc.numero && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nº {doc.numero}</div>
                      )}
                      {doc.storageUrl && (
                        <button
                          type="button"
                          onClick={() => downloadOrOpenDoc(doc.storageUrl, doc.storageKey || doc.nome)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            color: 'var(--color-primary)',
                            background: 'rgba(232, 93, 93, 0.1)',
                            border: '1px solid rgba(232, 93, 93, 0.25)',
                            borderRadius: '4px',
                            padding: '2px 7px',
                            marginTop: '4px',
                            cursor: 'pointer'
                          }}
                          title="Abrir / Baixar arquivo anexado"
                        >
                          <FileText size={11} />
                          <span>{doc.storageKey || 'Ver Anexo'}</span>
                          <Download size={10} style={{ opacity: 0.8 }} />
                        </button>
                      )}
                    </td>

                    <td>
                      <span className={isUfc ? 'tag-company-ufc' : 'tag-company-portico'}>
                        {doc.organization?.tradeName || doc.organization?.name || 'N/A'}
                      </span>
                    </td>

                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {doc.emissor || 'Órgão Competente'}
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {doc.emissao ? formatDate(new Date(doc.emissao)) : '--/--/----'}
                    </td>

                    <td style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {doc.semVencimento ? 'Indeterminado' : (doc.vencimento ? formatDate(new Date(doc.vencimento)) : 'Não informado')}
                    </td>

                    <td>
                      {getStatusBadge(doc.uiStatus, doc.daysLeft, doc.semVencimento)}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {doc.storageUrl && (
                          <button
                            type="button"
                            onClick={() => downloadOrOpenDoc(doc.storageUrl, doc.storageKey || doc.nome)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '5px 8px', color: 'var(--color-primary)' }}
                            title="Baixar / Abrir Arquivo Anexo"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenRenovar(doc)}
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <RefreshCw size={13} style={{ color: 'var(--color-primary)' }} />
                          Ver / Renovar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ver & Renovar Documento */}
      {renovarModalOpen && selectedDoc && (
        <div 
          className="modal-overlay"
          onClick={() => setRenovarModalOpen(false)}
        >
          <div 
            className="card modal-dialog-card" 
            style={{ 
              maxWidth: '620px', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Visualizar & Renovar Certidão</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Atualizar vigência no radar de compliance</p>
                </div>
              </div>
              <button onClick={() => setRenovarModalOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Document Info Banner */}
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedDoc.nome}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                Empresa: <strong style={{ color: 'var(--text-secondary)' }}>{selectedDoc.organization?.tradeName || selectedDoc.organization?.name}</strong> • Órgão: <strong style={{ color: 'var(--text-secondary)' }}>{selectedDoc.emissor || 'Órgão Competente'}</strong>
              </div>
            </div>

            {/* Renewal Form */}
            <form onSubmit={handleSaveRenovar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nº do Documento / Código de Autenticidade</label>
                <input 
                  value={renovarData.numero} 
                  onChange={(e) => setRenovarData({ ...renovarData, numero: e.target.value })}
                  className="form-control"
                  placeholder="Ex: PGFN-2026-991" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Nova Data de Emissão</label>
                  <input 
                    type="date" 
                    value={renovarData.emissao} 
                    onChange={(e) => setRenovarData({ ...renovarData, emissao: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nova Data de Vencimento *</label>
                  <input 
                    type="date" 
                    value={renovarData.vencimento} 
                    onChange={(e) => setRenovarData({ ...renovarData, vencimento: e.target.value })}
                    disabled={renovarData.semVencimento}
                    className="form-control" 
                    required={!renovarData.semVencimento}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <input 
                  type="checkbox" 
                  checked={renovarData.semVencimento} 
                  onChange={(e) => setRenovarData({ ...renovarData, semVencimento: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                Certidão sem prazo de validade (indeterminado)
              </label>

              {/* Campo de Anexo / Documento na Renovação */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Documento Anexo / Certidão (PDF ou Imagem)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opcional</span>
                </label>

                {renovarData.storageUrl ? (
                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <FileText size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {renovarData.storageKey || selectedDoc.nome}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>
                          ✓ Arquivo vinculado à certidão
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => downloadOrOpenDoc(renovarData.storageUrl, renovarData.storageKey || selectedDoc.nome)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
                      >
                        <Eye size={13} /> Visualizar / Baixar
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenovarData(prev => ({ ...prev, storageUrl: '', storageKey: '' }))}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444', padding: '6px' }}
                        title="Substituir / Remover arquivo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    border: '1px dashed var(--border-color-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    background: 'rgba(255,255,255,0.02)',
                    textAlign: 'center'
                  }}>
                    <input
                      type="file"
                      id="renovarFileInput"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 15 * 1024 * 1024) {
                            alert('O arquivo deve ter no máximo 15MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setRenovarData(prev => ({
                              ...prev,
                              storageUrl: ev.target?.result as string,
                              storageKey: file.name
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="renovarFileInput"
                      className="btn btn-secondary btn-sm"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <FileUp size={15} style={{ color: 'var(--color-primary)' }} />
                      Anexar Nova Certidão (PDF / Imagem)
                    </label>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      ou informe um link externo abaixo:
                    </div>
                    <input
                      type="url"
                      value={renovarData.storageUrl?.startsWith('data:') ? '' : renovarData.storageUrl}
                      onChange={(e) => setRenovarData(prev => ({ ...prev, storageUrl: e.target.value, storageKey: e.target.value ? 'Link Externo' : '' }))}
                      className="form-control"
                      placeholder="https://..."
                      style={{ marginTop: '6px', fontSize: '0.82rem' }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Observações / Chave de Validação</label>
                <textarea 
                  value={renovarData.observacoes} 
                  onChange={(e) => setRenovarData({ ...renovarData, observacoes: e.target.value })}
                  className="form-control"
                  rows={2}
                  placeholder="Anotações internas sobre a renovação..." 
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  type="button" 
                  onClick={() => handleDeleteDoc(selectedDoc.id)} 
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={15} /> Excluir Certidão
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setRenovarModalOpen(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={updating} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Salvar Renovação
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Documento */}
      {modalOpen && (
        <div 
          className="modal-overlay"
          onClick={() => setModalOpen(false)}
        >
          <div 
            className="card modal-dialog-card" 
            style={{ 
              maxWidth: '600px', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Nova Certidão / Documento Legal</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Empresa Titular *</label>
                <select 
                  value={newDoc.orgId} 
                  onChange={(e) => setNewDoc({ ...newDoc, orgId: e.target.value })}
                  className="form-control" 
                  required
                >
                  <option value="">Selecione a empresa...</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.tradeName || org.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nome do Documento / Certidão *</label>
                <input 
                  value={newDoc.nome} 
                  onChange={(e) => setNewDoc({ ...newDoc, nome: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Certidão Negativa Federal PGFN"
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select 
                    value={newDoc.tipo} 
                    onChange={(e) => setNewDoc({ ...newDoc, tipo: e.target.value })}
                    className="form-control"
                  >
                    <option value="CND_FEDERAL">CND Federal / PGFN</option>
                    <option value="TRABALHISTA">CNDT Trabalhista (TST)</option>
                    <option value="FGTS">CRF FGTS (Caixa)</option>
                    <option value="CERTIDAO_ESTADUAL">CND Estadual (SEFAZ)</option>
                    <option value="CERTIDAO_MUNICIPAL">CND Municipal (ISS/IPTU)</option>
                    <option value="BALANCO_PATRIMONIAL">Balanço Patrimonial</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nº do Documento / Autenticidade</label>
                  <input 
                    value={newDoc.numero} 
                    onChange={(e) => setNewDoc({ ...newDoc, numero: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: PGFN-2026-991" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Órgão Emissor</label>
                <input 
                  value={newDoc.emissor} 
                  onChange={(e) => setNewDoc({ ...newDoc, emissor: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Receita Federal, Caixa Econômica..." 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Data de Emissão</label>
                  <input 
                    type="date" 
                    value={newDoc.emissao} 
                    onChange={(e) => setNewDoc({ ...newDoc, emissao: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data de Vencimento</label>
                  <input 
                    type="date" 
                    value={newDoc.vencimento} 
                    onChange={(e) => setNewDoc({ ...newDoc, vencimento: e.target.value })}
                    disabled={newDoc.semVencimento}
                    className="form-control" 
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <input 
                  type="checkbox" 
                  checked={newDoc.semVencimento} 
                  onChange={(e) => setNewDoc({ ...newDoc, semVencimento: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                Documento sem prazo de validade (ex: Balanço, Contrato Social)
              </label>

              {/* Campo de Anexo da Certidão */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Anexo da Certidão / Documento (PDF, Imagem ou Link)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opcional</span>
                </label>

                <div style={{
                  border: '1px dashed var(--border-color-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  textAlign: 'center'
                }}>
                  {newDoc.storageUrl ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-elevated)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <FileText size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {newDoc.storageKey || 'Documento Anexado'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>
                            ✓ Arquivo pronto para envio
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewDoc(prev => ({ ...prev, storageUrl: '', storageKey: '' }))}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444', padding: '6px', flexShrink: 0 }}
                        title="Remover anexo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="newDocFileInput"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 15 * 1024 * 1024) {
                              alert('O arquivo deve ter no máximo 15MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setNewDoc(prev => ({
                                ...prev,
                                storageUrl: ev.target?.result as string,
                                storageKey: file.name
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="newDocFileInput"
                        className="btn btn-secondary btn-sm"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <FileUp size={16} style={{ color: 'var(--color-primary)' }} />
                        Escolher Arquivo do Computador (PDF / Imagem)
                      </label>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        ou informe um link externo abaixo (Google Drive, Portal SEFAZ, etc.)
                      </div>
                      <input
                        type="url"
                        value={newDoc.storageUrl.startsWith('data:') ? '' : newDoc.storageUrl}
                        onChange={(e) => setNewDoc(prev => ({ ...prev, storageUrl: e.target.value, storageKey: e.target.value ? 'Link Externo' : '' }))}
                        className="form-control"
                        placeholder="https://..."
                        style={{ marginTop: '8px', fontSize: '0.82rem' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar no Radar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
