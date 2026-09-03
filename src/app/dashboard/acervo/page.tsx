"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, Search, Filter, Plus, FileText, 
  MapPin, Calendar, FileCheck, ArrowRight, Loader2,
  Sparkles, CheckCircle2, XCircle, AlertCircle, Eye,
  Layers, X, ShieldAlert, Trash2, Edit3, Download, ExternalLink, RefreshCw, Check, Save
} from 'lucide-react';

export default function AcervoPage() {
  const [acervos, setAcervos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [ufFilter, setUfFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('ALL');
  
  // Simulador Modal State
  const [simuladorOpen, setSimuladorOpen] = useState(false);
  const [simLicitacoes, setSimLicitacoes] = useState<any[]>([]);
  const [selectedLicitacao, setSelectedLicitacao] = useState('');
  const [simResults, setSimResults] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAcervo, setEditingAcervo] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Deduplication state
  const [deduplicating, setDeduplicating] = useState(false);
  const [auditSummary, setAuditSummary] = useState<any>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    ufc: 0,
    portico: 0,
    semArquivo: 0,
    semCat: 0,
  });

  useEffect(() => {
    fetchAcervos();
  }, [search, orgFilter, ufFilter]);

  const fetchAcervos = async () => {
    setLoading(true);
    try {
      let url = '/api/acervo?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (orgFilter) url += `orgId=${orgFilter}&`;
      if (ufFilter) url += `uf=${ufFilter}&`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAcervos(data);
        
        const ufcCount = data.filter((d: any) => d.organization?.name?.toLowerCase().includes('ufc')).length;
        const porticoCount = data.filter((d: any) => d.organization?.name?.toLowerCase().includes('pórtico') || d.organization?.name?.toLowerCase().includes('portico')).length;
        const semArquivoCount = data.filter((d: any) => !d.urlOrigem && !d.storageUrl).length;
        const semCatCount = data.filter((d: any) => !d.numeroCat && !d.numeroAtestado).length;

        setStats({
          total: data.length,
          ufc: ufcCount,
          portico: porticoCount,
          semArquivo: semArquivoCount,
          semCat: semCatCount,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeduplicate = async () => {
    if (!confirm('Deseja iniciar a varredura para remover registros duplicados e auditar o acervo?')) return;

    setDeduplicating(true);
    try {
      const res = await fetch('/api/acervo/deduplicar', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAuditSummary(data);
        fetchAcervos();
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao executar auditoria');
    } finally {
      setDeduplicating(false);
    }
  };

  const handleOpenEdit = (item: any) => {
    setEditingAcervo({
      ...item,
      quantitativosList: item.quantitativos ? (typeof item.quantitativos === 'string' ? JSON.parse(item.quantitativos) : item.quantitativos) : []
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcervo) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/acervo/${editingAcervo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroCat: editingAcervo.numeroCat,
          numeroAtestado: editingAcervo.numeroAtestado,
          numeroContrato: editingAcervo.numeroContrato,
          emitente: editingAcervo.emitente,
          objeto: editingAcervo.objeto,
          tipoServico: editingAcervo.tipoServico,
          areaTecnica: editingAcervo.areaTecnica,
          local: editingAcervo.local,
          uf: editingAcervo.uf,
          responsavelTecnico: editingAcervo.responsavelTecnico,
          urlOrigem: editingAcervo.urlOrigem,
          storageUrl: editingAcervo.storageUrl,
          observacoes: editingAcervo.observacoes,
          quantitativos: JSON.stringify(editingAcervo.quantitativosList || [])
        })
      });

      if (res.ok) {
        setEditModalOpen(false);
        fetchAcervos();
      } else {
        alert('Erro ao salvar alterações');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar');
    } finally {
      setSavingEdit(false);
    }
  };

  const openSimulador = async () => {
    setSimuladorOpen(true);
    try {
      const res = await fetch('/api/licitacoes');
      if (res.ok) {
        const data = await res.json();
        setSimLicitacoes(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runSimulacao = async () => {
    if (!selectedLicitacao) return;
    setSimLoading(true);
    try {
      const res = await fetch('/api/acervo/compatibilidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licitacaoId: selectedLicitacao })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(false);
    }
  };

  const filteredAcervos = acervos.filter(item => {
    if (healthFilter === 'SEM_ARQUIVO') return !item.urlOrigem && !item.storageUrl;
    if (healthFilter === 'SEM_CAT') return !item.numeroCat && !item.numeroAtestado;
    if (healthFilter === 'SEM_QUANTITATIVO') return !item.quantitativos || item.quantitativos === '[]';
    if (healthFilter === 'COMPLETOS') return (item.numeroCat || item.numeroAtestado) && (item.urlOrigem || item.storageUrl);
    return true;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Acervo Técnico & Atestados</h1>
          <p className="page-subtitle">
            Repositório central de CATs, atestados de capacidade técnica e quantitativos comprovados
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleDeduplicate}
            disabled={deduplicating}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {deduplicating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} style={{ color: '#fbbf24' }} />}
            {deduplicating ? 'Auditando...' : 'Auditar & Limpar Duplicados'}
          </button>

          <button 
            onClick={openSimulador} 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Sparkles size={18} style={{ color: '#a855f7' }} />
            Simulador de Habilitação
          </button>

          <Link href="/dashboard/acervo/novo" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            Novo Atestado / CAT
          </Link>
        </div>
      </div>

      {/* Audit Banner Alert if just run */}
      {auditSummary && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
              ✓ Auditoria e Deduplicação Concluída com Sucesso!
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
              Duplicados Removidos: <strong>{auditSummary.duplicadosRemovidos}</strong> • Registros Válidos: <strong>{auditSummary.totalRegistros}</strong> • Sem Arquivo de Download: <strong>{auditSummary.semArquivo}</strong> • Sem CAT: <strong>{auditSummary.semCat}</strong>
            </div>
          </div>
          <button onClick={() => setAuditSummary(null)} className="btn btn-ghost btn-sm">Fechar</button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <Layers size={22} />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total de Atestados / CATs</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(232, 93, 93, 0.12)', color: 'var(--color-primary)' }}>
            <Building2 size={22} />
          </div>
          <div className="stat-value">{stats.ufc}</div>
          <div className="stat-label">Acervo UFC Engenharia</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <Building2 size={22} />
          </div>
          <div className="stat-value">{stats.portico}</div>
          <div className="stat-label">Acervo Pórtico Construções</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>
            <ShieldAlert size={22} />
          </div>
          <div className="stat-value" style={{ color: stats.semArquivo > 0 ? '#f87171' : '#34d399' }}>{stats.semArquivo}</div>
          <div className="stat-label">Pendentes de Arquivo / Download</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ marginBottom: '28px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por objeto, CAT, engenheiro, emitente, quantitativo..." 
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', width: '100%' }}
            />
          </div>

          <select 
            value={orgFilter} 
            onChange={(e) => setOrgFilter(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '180px' }}
          >
            <option value="">Empresa: Todas</option>
            <option value="UFC">UFC Engenharia</option>
            <option value="PORTICO">Pórtico Construções</option>
          </select>

          <select 
            value={healthFilter} 
            onChange={(e) => setHealthFilter(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '200px' }}
          >
            <option value="ALL">Status do Acervo: Todos</option>
            <option value="COMPLETOS">Completos (Com CAT & Arquivo)</option>
            <option value="SEM_ARQUIVO">Sem Arquivo / Download</option>
            <option value="SEM_CAT">Sem CAT Informado</option>
            <option value="SEM_QUANTITATIVO">Sem Quantitativos</option>
          </select>

          {(search || orgFilter || healthFilter !== 'ALL') && (
            <button 
              onClick={() => { setSearch(''); setOrgFilter(''); setHealthFilter('ALL'); }}
              className="btn btn-ghost btn-sm" 
              style={{ height: '40px' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid of Acervo Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando acervo técnico...</p>
        </div>
      ) : filteredAcervos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FileCheck size={44} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Nenhum atestado encontrado</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Cadastre os atestados e CATs das empresas e profissionais.
          </p>
          <Link href="/dashboard/acervo/novo" className="btn btn-primary btn-sm">
            <Plus size={16} /> Cadastrar Atestado
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {filteredAcervos.map((item) => {
            const isUfc = item.organization?.name?.toLowerCase().includes('ufc');
            const quants = item.quantitativos ? (typeof item.quantitativos === 'string' ? JSON.parse(item.quantitativos) : item.quantitativos) : [];
            const hasDownload = Boolean(item.urlOrigem || item.storageUrl);

            return (
              <div 
                key={item.id} 
                className="card"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '14px',
                  background: 'var(--bg-surface)',
                  transition: 'transform var(--transition-base), border-color var(--transition-base)',
                  position: 'relative'
                }}
              >
                {/* Header of Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <span className={isUfc ? 'tag-company-ufc' : 'tag-company-portico'} style={{ marginBottom: '6px' }}>
                      {item.organization?.tradeName || item.organization?.name}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {item.numeroCat ? `CAT nº ${item.numeroCat}` : (item.numeroAtestado ? `Atestado ${item.numeroAtestado}` : 'Atestado Técnico')}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px', color: '#60a5fa' }}
                      title="Editar Atestado"
                    >
                      <Edit3 size={15} />
                    </button>
                    
                    {hasDownload ? (
                      <a 
                        href={item.urlOrigem || item.storageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Baixar / Acessar Atestado em PDF"
                      >
                        <Download size={13} style={{ color: '#34d399' }} />
                        Baixar
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#f87171', padding: '4px 6px', background: 'rgba(239, 68, 68, 0.12)', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                        Sem Anexo
                      </span>
                    )}
                  </div>
                </div>

                {/* Emitter */}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Emitente:</span> {item.emitente}
                </div>

                {/* Object */}
                <p 
                  style={{ 
                    fontSize: '0.86rem', 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {item.objeto}
                </p>

                {/* Quantitativos Highlights */}
                {quants.length > 0 && (
                  <div style={{ 
                    background: 'var(--bg-elevated)', 
                    padding: '12px 14px', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Principais Quantitativos Comprovados
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {quants.slice(0, 3).map((q: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{q.descricao}</span>
                          <span style={{ fontWeight: 700, color: '#60a5fa' }}>
                            {q.quantidade} {q.unidade}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Responsible & Location */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginTop: 'auto',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <span className="tag-location">
                    <MapPin size={13} /> {item.local ? `${item.local} - ` : ''}{item.uf || 'CE'}
                  </span>

                  {item.responsavelTecnico && (
                    <span className="tag-engineer" title={item.responsavelTecnico}>
                      👤 {item.responsavelTecnico}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Editar Acervo */}
      {editModalOpen && editingAcervo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={() => setEditModalOpen(false)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '680px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editar Atestado / CAT</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Atualizar dados e link do acervo</p>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Nº da CAT</label>
                  <input 
                    value={editingAcervo.numeroCat || ''} 
                    onChange={(e) => setEditingAcervo({ ...editingAcervo, numeroCat: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 14921/2024"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nº do Atestado</label>
                  <input 
                    value={editingAcervo.numeroAtestado || ''} 
                    onChange={(e) => setEditingAcervo({ ...editingAcervo, numeroAtestado: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: AT-091/2023"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Órgão / Cliente Emitente *</label>
                <input 
                  value={editingAcervo.emitente || ''} 
                  onChange={(e) => setEditingAcervo({ ...editingAcervo, emitente: e.target.value })}
                  className="form-control" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Objeto Executado *</label>
                <textarea 
                  value={editingAcervo.objeto || ''} 
                  onChange={(e) => setEditingAcervo({ ...editingAcervo, objeto: e.target.value })}
                  className="form-control" 
                  rows={3}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Engenheiro / Responsável Técnico</label>
                  <input 
                    value={editingAcervo.responsavelTecnico || ''} 
                    onChange={(e) => setEditingAcervo({ ...editingAcervo, responsavelTecnico: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Eng. Roberto Silva — CREA-CE 45892"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Link para Download do Documento / PDF</label>
                  <input 
                    type="url"
                    value={editingAcervo.urlOrigem || editingAcervo.storageUrl || ''} 
                    onChange={(e) => setEditingAcervo({ ...editingAcervo, urlOrigem: e.target.value, storageUrl: e.target.value })}
                    className="form-control" 
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingEdit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulador Modal */}
      {simuladorOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: '#a855f7' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Simulador de Qualificação Técnica</h3>
              </div>
              <button onClick={() => setSimuladorOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Selecione a Licitação Alvo</label>
              <select 
                value={selectedLicitacao} 
                onChange={(e) => setSelectedLicitacao(e.target.value)}
                className="form-control"
              >
                <option value="">Selecione uma licitação cadastrada...</option>
                {simLicitacoes.map(lic => (
                  <option key={lic.id} value={lic.id}>{lic.orgaoNome} — {lic.numero || 'Edital'} ({lic.objeto?.slice(0, 60)}...)</option>
                ))}
              </select>
            </div>

            <button 
              onClick={runSimulacao} 
              disabled={!selectedLicitacao || simLoading}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '20px' }}
            >
              {simLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Executar Cruzamento de Acervo x Exigências
            </button>

            {simResults && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ 
                  background: simResults.compatibilidade === 'ATENDE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${simResults.compatibilidade === 'ATENDE' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  padding: '16px',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ fontWeight: 700, color: simResults.compatibilidade === 'ATENDE' ? '#34d399' : '#f87171' }}>
                    Resultado: {simResults.compatibilidade} ({simResults.aderenciaScore}%)
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {simResults.justificativa}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
