"use client";

import React, { useState, useEffect } from 'react';
import { 
  MonitorCheck, CheckCircle2, AlertTriangle, Clock, 
  ExternalLink, Key, Plus, ShieldCheck, Building2, Globe,
  Edit3, Trash2, X, Save, Loader2, FileUp, FileText, Download,
  Eye, RefreshCw, Search
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function PlataformasPage() {
  const [plataformas, setPlataformas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('ALL');

  // Modal Novo Portal
  const [modalNewOpen, setModalNewOpen] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [newPlat, setNewPlat] = useState({
    nome: '',
    url: '',
    tipo: 'FEDERAL',
    ufcStatus: 'CREDENCIADO',
    porticoStatus: 'CREDENCIADO',
    validadeCertificado: '',
    responsavel: '',
    loginUfc: '',
    loginPortico: '',
    observacoes: '',
    storageUrl: '',
    storageKey: ''
  });

  // Modal Editar Portal
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [editingPlat, setEditingPlat] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editPlatData, setEditPlatData] = useState<any>({});

  useEffect(() => {
    fetchPlataformas();
  }, []);

  const fetchPlataformas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plataformas');
      if (res.ok) {
        const data = await res.json();
        setPlataformas(data);
      }
    } catch (e) {
      console.error('Erro ao carregar plataformas:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (plat: any) => {
    setEditingPlat(plat);
    setEditPlatData({
      nome: plat.nome || '',
      url: plat.url || '',
      tipo: plat.tipo || 'FEDERAL',
      ufcStatus: plat.ufcStatus || 'CREDENCIADO',
      porticoStatus: plat.porticoStatus || 'CREDENCIADO',
      validadeCertificado: plat.validadeCertificado ? plat.validadeCertificado.split('T')[0] : '',
      responsavel: plat.responsavel || '',
      loginUfc: plat.loginUfc || '',
      loginPortico: plat.loginPortico || '',
      observacoes: plat.observacoes || '',
      storageUrl: plat.storageUrl || '',
      storageKey: plat.storageKey || ''
    });
    setModalEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlat) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/plataformas/${editingPlat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPlatData)
      });

      if (res.ok) {
        setModalEditOpen(false);
        fetchPlataformas();
      } else {
        alert('Erro ao atualizar plataforma');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreatePlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlat.nome.trim()) {
      alert('Informe o nome da plataforma');
      return;
    }

    setSavingNew(true);
    try {
      const res = await fetch('/api/plataformas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlat)
      });

      if (res.ok) {
        setModalNewOpen(false);
        setNewPlat({
          nome: '',
          url: '',
          tipo: 'FEDERAL',
          ufcStatus: 'CREDENCIADO',
          porticoStatus: 'CREDENCIADO',
          validadeCertificado: '',
          responsavel: '',
          loginUfc: '',
          loginPortico: '',
          observacoes: '',
          storageUrl: '',
          storageKey: ''
        });
        fetchPlataformas();
      } else {
        alert('Erro ao cadastrar plataforma');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão');
    } finally {
      setSavingNew(false);
    }
  };

  const handleDeletePlat = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente excluir a plataforma "${nome}"?`)) return;

    try {
      const res = await fetch(`/api/plataformas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setModalEditOpen(false);
        fetchPlataformas();
      } else {
        alert('Erro ao excluir plataforma');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const downloadOrOpenDoc = (url: string, name: string) => {
    if (!url) {
      alert('Arquivo sem anexo ou link disponível.');
      return;
    }
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = name && name.includes('.') ? name : `${name || 'certificado'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(url, '_blank');
    }
  };

  const filteredPlataformas = plataformas.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.responsavel && p.responsavel.toLowerCase().includes(search.toLowerCase())) ||
      (p.observacoes && p.observacoes.toLowerCase().includes(search.toLowerCase()));
    const matchesTipo = tipoFilter === 'ALL' || p.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREDENCIADO':
        return (
          <span style={{ 
            fontWeight: 700, 
            fontSize: '0.75rem', 
            padding: '2px 8px', 
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#34d399'
          }}>
            ✓ Credenciado
          </span>
        );
      case 'RENOVAR':
        return (
          <span style={{ 
            fontWeight: 700, 
            fontSize: '0.75rem', 
            padding: '2px 8px', 
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24'
          }}>
            ⚠ Renovar Senha
          </span>
        );
      case 'PENDENTE':
        return (
          <span style={{ 
            fontWeight: 700, 
            fontSize: '0.75rem', 
            padding: '2px 8px', 
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa'
          }}>
            ⏳ Pendente
          </span>
        );
      case 'EXPIRADO':
        return (
          <span style={{ 
            fontWeight: 700, 
            fontSize: '0.75rem', 
            padding: '2px 8px', 
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171'
          }}>
            ✕ Expirado / Inativo
          </span>
        );
      default:
        return (
          <span style={{ 
            fontWeight: 700, 
            fontSize: '0.75rem', 
            padding: '2px 8px', 
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-secondary)'
          }}>
            {status}
          </span>
        );
    }
  };

  const totalAtivas = plataformas.length;
  const ufcAtivas = plataformas.filter(p => p.ufcStatus === 'CREDENCIADO').length;
  const porticoAtivas = plataformas.filter(p => p.porticoStatus === 'CREDENCIADO').length;
  const pendencias = plataformas.filter(p => p.ufcStatus === 'RENOVAR' || p.porticoStatus === 'RENOVAR').length;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MonitorCheck size={26} style={{ color: 'var(--color-primary)' }} />
            Validade das Plataformas & Portais de Licitação
          </h1>
          <p className="page-subtitle">
            Controle de credenciamentos, logins em portais eletrônicos e validade de certificados e-CNPJ
          </p>
        </div>

        <button 
          onClick={() => setModalNewOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> Cadastrar Nova Plataforma
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total de Portais</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-primary)' }}>
            {totalAtivas}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Portais monitorados</span>
        </div>

        <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Credenciadas UFC</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '6px', color: '#34d399' }}>
            {ufcAtivas} / {totalAtivas}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status regular</span>
        </div>

        <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Credenciadas Pórtico</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '6px', color: '#34d399' }}>
            {porticoAtivas} / {totalAtivas}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status regular</span>
        </div>

        <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Atenção / Renovar Senha</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '6px', color: pendencias > 0 ? '#fbbf24' : '#34d399' }}>
            {pendencias}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ações pendentes</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '22px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome da plataforma ou responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
            />
          </div>

          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="form-control"
            style={{ height: '38px', fontSize: '0.85rem', minWidth: '180px' }}
          >
            <option value="ALL">Todas as Esferas</option>
            <option value="FEDERAL">Federal</option>
            <option value="ESTADUAL">Estadual</option>
            <option value="ESTADUAL_MUNICIPAL">Estadual / Municipal</option>
            <option value="NACIONAL">Nacional</option>
            <option value="PRIVADO_MUNICIPAL">Privado / Municipal</option>
          </select>

          {(search || tipoFilter !== 'ALL') && (
            <button 
              onClick={() => { setSearch(''); setTipoFilter('ALL'); }}
              className="btn btn-ghost btn-sm"
              style={{ height: '38px' }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Grid of Platforms */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando plataformas...</p>
        </div>
      ) : filteredPlataformas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)' }}>
          <MonitorCheck size={44} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Nenhuma plataforma encontrada</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.88rem' }}>
            Cadastre um novo portal ou limpe os filtros.
          </p>
          <button onClick={() => setModalNewOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> Cadastrar Plataforma
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {filteredPlataformas.map((p) => (
            <div 
              key={p.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '22px',
                position: 'relative'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Globe size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.nome}
                    </h3>
                    {p.url && (
                      <a 
                        href={p.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ fontSize: '0.78rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                      >
                        Acessar Portal <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                    {p.tipo}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                    title="Editar informações e credenciamento"
                  >
                    <Edit3 size={13} style={{ color: 'var(--color-primary)' }} />
                    Editar
                  </button>
                </div>
              </div>

              {/* Status por Empresa */}
              <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>UFC Engenharia:</span>
                    {p.loginUfc && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Login: {p.loginUfc}
                      </div>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(p.ufcStatus || 'CREDENCIADO')}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Pórtico Construções:</span>
                    {p.loginPortico && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Login: {p.loginPortico}
                      </div>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(p.porticoStatus || 'CREDENCIADO')}
                  </div>
                </div>
              </div>

              {/* Anexo de Documento / Certificado se houver */}
              {p.storageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(232, 93, 93, 0.08)', border: '1px solid rgba(232, 93, 93, 0.2)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <FileText size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.storageKey || 'Certificado / Anexo'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadOrOpenDoc(p.storageUrl, p.storageKey || p.nome)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-primary)', padding: '2px 6px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Download size={12} /> Abrir
                  </button>
                </div>
              )}

              {/* Certificate & Responsible */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: 'auto' }}>
                <span>
                  Certificado e-CNPJ: <strong style={{ color: 'var(--text-secondary)' }}>{p.validadeCertificado ? formatDate(new Date(p.validadeCertificado)) : 'Não informado'}</strong>
                </span>
                <span>
                  Resp: <strong style={{ color: 'var(--text-secondary)' }}>{p.responsavel || 'Não atribuído'}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: EDITAR PLATAFORMA / PORTAL                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modalEditOpen && editingPlat && (
        <div 
          className="modal-overlay"
          onClick={() => setModalEditOpen(false)}
        >
          <div 
            className="card modal-dialog-card" 
            style={{ 
              maxWidth: '640px', 
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
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editar Plataforma / Portal</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Atualizar credenciamentos e validade de acessos</p>
                </div>
              </div>
              <button onClick={() => setModalEditOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nome da Plataforma / Portal *</label>
                <input 
                  value={editPlatData.nome} 
                  onChange={(e) => setEditPlatData({ ...editPlatData, nome: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Compras.gov.br (SIASG / Comprasnet)"
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">URL / Link de Acesso</label>
                  <input 
                    type="url"
                    value={editPlatData.url} 
                    onChange={(e) => setEditPlatData({ ...editPlatData, url: e.target.value })}
                    className="form-control" 
                    placeholder="https://..." 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Esfera / Tipo</label>
                  <select 
                    value={editPlatData.tipo} 
                    onChange={(e) => setEditPlatData({ ...editPlatData, tipo: e.target.value })}
                    className="form-control"
                  >
                    <option value="FEDERAL">Federal</option>
                    <option value="ESTADUAL">Estadual</option>
                    <option value="ESTADUAL_MUNICIPAL">Estadual / Municipal</option>
                    <option value="NACIONAL">Nacional</option>
                    <option value="PRIVADO_MUNICIPAL">Privado / Municipal</option>
                  </select>
                </div>
              </div>

              {/* Status de Credenciamento UFC */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                  UFC Engenharia
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Status Credenciamento</label>
                    <select 
                      value={editPlatData.ufcStatus} 
                      onChange={(e) => setEditPlatData({ ...editPlatData, ufcStatus: e.target.value })}
                      className="form-control"
                    >
                      <option value="CREDENCIADO">✓ Credenciado (Ativo)</option>
                      <option value="RENOVAR">⚠ Renovar Senha / Acesso</option>
                      <option value="PENDENTE">⏳ Pendente</option>
                      <option value="EXPIRADO">✕ Expirado / Inativo</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Login / Usuário (Opcional)</label>
                    <input 
                      value={editPlatData.loginUfc} 
                      onChange={(e) => setEditPlatData({ ...editPlatData, loginUfc: e.target.value })}
                      className="form-control" 
                      placeholder="Ex: ufc.licita" 
                    />
                  </div>
                </div>
              </div>

              {/* Status de Credenciamento Pórtico */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Pórtico Construções
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Status Credenciamento</label>
                    <select 
                      value={editPlatData.porticoStatus} 
                      onChange={(e) => setEditPlatData({ ...editPlatData, porticoStatus: e.target.value })}
                      className="form-control"
                    >
                      <option value="CREDENCIADO">✓ Credenciado (Ativo)</option>
                      <option value="RENOVAR">⚠ Renovar Senha / Acesso</option>
                      <option value="PENDENTE">⏳ Pendente</option>
                      <option value="EXPIRADO">✕ Expirado / Inativo</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Login / Usuário (Opcional)</label>
                    <input 
                      value={editPlatData.loginPortico} 
                      onChange={(e) => setEditPlatData({ ...editPlatData, loginPortico: e.target.value })}
                      className="form-control" 
                      placeholder="Ex: portico.compras" 
                    />
                  </div>
                </div>
              </div>

              {/* Certificado e Responsável */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Validade Certificado e-CNPJ</label>
                  <input 
                    type="date" 
                    value={editPlatData.validadeCertificado} 
                    onChange={(e) => setEditPlatData({ ...editPlatData, validadeCertificado: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Responsável pelo Login / Acesso</label>
                  <input 
                    value={editPlatData.responsavel} 
                    onChange={(e) => setEditPlatData({ ...editPlatData, responsavel: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Carlos Mendes" 
                  />
                </div>
              </div>

              {/* Campo de Anexo (Certificado ou Documento de Credenciamento) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Anexo (Comprovante de Credenciamento / Certificado)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opcional</span>
                </label>

                {editPlatData.storageUrl ? (
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
                          {editPlatData.storageKey || 'Comprovante / Certificado Anexado'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>
                          ✓ Arquivo anexado à plataforma
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => downloadOrOpenDoc(editPlatData.storageUrl, editPlatData.storageKey || editingPlat.nome)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
                      >
                        <Eye size={13} /> Visualizar / Baixar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPlatData((prev: any) => ({ ...prev, storageUrl: '', storageKey: '' }))}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444', padding: '6px' }}
                        title="Remover arquivo"
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
                      id="editPlatFileInput"
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
                            setEditPlatData((prev: any) => ({
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
                      htmlFor="editPlatFileInput"
                      className="btn btn-secondary btn-sm"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <FileUp size={15} style={{ color: 'var(--color-primary)' }} />
                      Anexar Arquivo (PDF / Imagem)
                    </label>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      ou informe um link externo abaixo:
                    </div>
                    <input
                      type="url"
                      value={editPlatData.storageUrl?.startsWith('data:') ? '' : editPlatData.storageUrl}
                      onChange={(e) => setEditPlatData((prev: any) => ({ ...prev, storageUrl: e.target.value, storageKey: e.target.value ? 'Link Externo' : '' }))}
                      className="form-control"
                      placeholder="https://..."
                      style={{ marginTop: '6px', fontSize: '0.82rem' }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Observações / Anotações Internas</label>
                <textarea 
                  value={editPlatData.observacoes} 
                  onChange={(e) => setEditPlatData({ ...editPlatData, observacoes: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Informações adicionais sobre o portal..." 
                />
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => handleDeletePlat(editingPlat.id, editingPlat.nome)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={16} /> Excluir Plataforma
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setModalEditOpen(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingEdit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: CADASTRAR NOVA PLATAFORMA                            */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modalNewOpen && (
        <div 
          className="modal-overlay"
          onClick={() => setModalNewOpen(false)}
        >
          <div 
            className="card modal-dialog-card" 
            style={{ 
              maxWidth: '640px', 
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
                  <Plus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cadastrar Nova Plataforma</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cadastrar novo portal eletrônico no monitoramento</p>
                </div>
              </div>
              <button onClick={() => setModalNewOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePlat} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nome da Plataforma / Portal *</label>
                <input 
                  value={newPlat.nome} 
                  onChange={(e) => setNewPlat({ ...newPlat, nome: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Petronect, BBMNet, Portal de Licitações..."
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">URL / Link de Acesso</label>
                  <input 
                    type="url"
                    value={newPlat.url} 
                    onChange={(e) => setNewPlat({ ...newPlat, url: e.target.value })}
                    className="form-control" 
                    placeholder="https://..." 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Esfera / Tipo</label>
                  <select 
                    value={newPlat.tipo} 
                    onChange={(e) => setNewPlat({ ...newPlat, tipo: e.target.value })}
                    className="form-control"
                  >
                    <option value="FEDERAL">Federal</option>
                    <option value="ESTADUAL">Estadual</option>
                    <option value="ESTADUAL_MUNICIPAL">Estadual / Municipal</option>
                    <option value="NACIONAL">Nacional</option>
                    <option value="PRIVADO_MUNICIPAL">Privado / Municipal</option>
                  </select>
                </div>
              </div>

              {/* Status de Credenciamento UFC */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                  UFC Engenharia
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Status Credenciamento</label>
                    <select 
                      value={newPlat.ufcStatus} 
                      onChange={(e) => setNewPlat({ ...newPlat, ufcStatus: e.target.value })}
                      className="form-control"
                    >
                      <option value="CREDENCIADO">✓ Credenciado (Ativo)</option>
                      <option value="RENOVAR">⚠ Renovar Senha / Acesso</option>
                      <option value="PENDENTE">⏳ Pendente</option>
                      <option value="EXPIRADO">✕ Expirado / Inativo</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Login / Usuário (Opcional)</label>
                    <input 
                      value={newPlat.loginUfc} 
                      onChange={(e) => setNewPlat({ ...newPlat, loginUfc: e.target.value })}
                      className="form-control" 
                      placeholder="Ex: ufc.licita" 
                    />
                  </div>
                </div>
              </div>

              {/* Status de Credenciamento Pórtico */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Pórtico Construções
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Status Credenciamento</label>
                    <select 
                      value={newPlat.porticoStatus} 
                      onChange={(e) => setNewPlat({ ...newPlat, porticoStatus: e.target.value })}
                      className="form-control"
                    >
                      <option value="CREDENCIADO">✓ Credenciado (Ativo)</option>
                      <option value="RENOVAR">⚠ Renovar Senha / Acesso</option>
                      <option value="PENDENTE">⏳ Pendente</option>
                      <option value="EXPIRADO">✕ Expirado / Inativo</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Login / Usuário (Opcional)</label>
                    <input 
                      value={newPlat.loginPortico} 
                      onChange={(e) => setNewPlat({ ...newPlat, loginPortico: e.target.value })}
                      className="form-control" 
                      placeholder="Ex: portico.compras" 
                    />
                  </div>
                </div>
              </div>

              {/* Certificado e Responsável */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Validade Certificado e-CNPJ</label>
                  <input 
                    type="date" 
                    value={newPlat.validadeCertificado} 
                    onChange={(e) => setNewPlat({ ...newPlat, validadeCertificado: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Responsável pelo Login / Acesso</label>
                  <input 
                    value={newPlat.responsavel} 
                    onChange={(e) => setNewPlat({ ...newPlat, responsavel: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Carlos Mendes" 
                  />
                </div>
              </div>

              {/* Campo de Anexo */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Anexo (Comprovante de Credenciamento / Certificado)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opcional</span>
                </label>

                <div style={{
                  border: '1px dashed var(--border-color-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  textAlign: 'center'
                }}>
                  {newPlat.storageUrl ? (
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
                            {newPlat.storageKey || 'Arquivo Anexado'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>
                            ✓ Arquivo pronto para salvar
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewPlat(prev => ({ ...prev, storageUrl: '', storageKey: '' }))}
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
                        id="newPlatFileInput"
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
                              setNewPlat(prev => ({
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
                        htmlFor="newPlatFileInput"
                        className="btn btn-secondary btn-sm"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <FileUp size={16} style={{ color: 'var(--color-primary)' }} />
                        Escolher Arquivo do Computador (PDF / Imagem)
                      </label>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        ou informe um link externo abaixo:
                      </div>
                      <input
                        type="url"
                        value={newPlat.storageUrl.startsWith('data:') ? '' : newPlat.storageUrl}
                        onChange={(e) => setNewPlat(prev => ({ ...prev, storageUrl: e.target.value, storageKey: e.target.value ? 'Link Externo' : '' }))}
                        className="form-control"
                        placeholder="https://..."
                        style={{ marginTop: '8px', fontSize: '0.82rem' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observações / Anotações Internas</label>
                <textarea 
                  value={newPlat.observacoes} 
                  onChange={(e) => setNewPlat({ ...newPlat, observacoes: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Informações adicionais sobre o portal..." 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalNewOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingNew} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {savingNew ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Cadastrar Plataforma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
