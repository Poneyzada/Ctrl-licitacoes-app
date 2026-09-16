"use client";

import React, { useState, useEffect } from 'react';
import { 
  Scale, Clock, Filter, Plus, Search, 
  FileText, CheckCircle2, AlertTriangle, 
  ChevronRight, Calendar, ArrowRight, Loader2, X, Save, Gavel,
  Edit3, Trash2, Check, RefreshCw, Landmark, ShieldCheck
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function RecursosPage() {
  const [recursos, setRecursos] = useState<any[]>([]);
  const [licitacoes, setLicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [esferaFilter, setEsferaFilter] = useState<'ALL' | 'ADMINISTRATIVA' | 'JUDICIAL'>('ALL');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // Modal Novo Recurso / Ação Judicial
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRecurso, setNewRecurso] = useState({
    licitacaoId: '',
    esfera: 'ADMINISTRATIVA',
    tipo: 'IMPUGNACAO',
    posicao: 'NOSSA_EMPRESA',
    prazo: '',
    responsavel: '',
    concorrente: '',
    setor: 'JURIDICO',
    tribunalVara: '',
    resumo: '',
    fundamento: '',
    proximaAcao: ''
  });

  // Modal Editar Recurso
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecurso, setEditingRecurso] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [resLic, resRec] = await Promise.all([
        fetch('/api/licitacoes'),
        fetch('/api/recursos')
      ]);

      if (resLic.ok) {
        const dataLic = await resLic.json();
        setLicitacoes(dataLic);
        if (dataLic.length > 0) {
          setNewRecurso(prev => ({ ...prev, licitacaoId: dataLic[0].id }));
        }
      }

      if (resRec.ok) {
        setRecursos(await resRec.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecursos = async () => {
    try {
      const res = await fetch('/api/recursos');
      if (res.ok) setRecursos(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const calculateDaysLeft = (dateString: string | null) => {
    if (!dateString) return null;
    const diff = new Date(dateString).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const isJudicial = (tipo: string, fundamento?: string | null) => {
    return tipo === 'MANDADO_DE_SEGURANCA' || 
           tipo === 'ACAO_ORDINARIA' || 
           tipo === 'AGRAVO_INSTRUMENTO' ||
           (fundamento && fundamento.includes('[ESFERA: JUDICIAL]'));
  };

  const handleCreateRecurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecurso.licitacaoId || !newRecurso.resumo) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      // Inserir metadados de esfera e tribunal no fundamento se for judicial
      const prefix = newRecurso.esfera === 'JUDICIAL' 
        ? `[ESFERA: JUDICIAL] [VARA/TRIBUNAL: ${newRecurso.tribunalVara || 'Vara da Fazenda Pública'}]\n\n`
        : `[ESFERA: ADMINISTRATIVA]\n\n`;

      const payload = {
        ...newRecurso,
        fundamento: prefix + (newRecurso.fundamento || '')
      };

      const res = await fetch('/api/recursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setModalOpen(false);
        setNewRecurso({
          licitacaoId: licitacoes[0]?.id || '',
          esfera: 'ADMINISTRATIVA',
          tipo: 'IMPUGNACAO',
          posicao: 'NOSSA_EMPRESA',
          prazo: '',
          responsavel: '',
          concorrente: '',
          setor: 'JURIDICO',
          tribunalVara: '',
          resumo: '',
          fundamento: '',
          proximaAcao: ''
        });
        fetchRecursos();
        alert('Processo / Recurso registrado com sucesso!');
      } else {
        alert('Erro ao salvar recurso');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (rec: any) => {
    setEditingRecurso(rec);
    setEditData({
      prazo: rec.prazo ? new Date(rec.prazo).toISOString().split('T')[0] : '',
      proximaAcao: rec.proximaAcao || '',
      status: rec.status || 'ABERTO',
      responsavel: rec.responsavel || '',
      setor: rec.setor || 'JURIDICO',
      resumo: rec.resumo || '',
      fundamento: rec.fundamento || '',
      concorrente: rec.concorrente || ''
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecurso) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/recursos/${editingRecurso.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (res.ok) {
        setEditModalOpen(false);
        fetchRecursos();
        alert('Processo atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar processo');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao atualizar');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteRecurso = async (id: string) => {
    if (!confirm('Deseja realmente remover este processo/recurso?')) return;

    try {
      const res = await fetch(`/api/recursos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRecursos();
        alert('Removido com sucesso!');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir');
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'IMPUGNACAO': return 'Impugnação ao Edital';
      case 'ESCLARECIMENTO': return 'Pedido de Esclarecimento';
      case 'RECURSO_ADMINISTRATIVO':
      case 'RECURSO': return 'Recurso Administrativo';
      case 'CONTRARRAZOES': return 'Contrarrazões Recursais';
      case 'DILIGENCIA': return 'Resposta à Diligência';
      case 'MANDADO_DE_SEGURANCA': return 'Mandado de Segurança (Judicial)';
      case 'ACAO_ORDINARIA': return 'Ação Ordinária / Anulatória';
      case 'AGRAVO_INSTRUMENTO': return 'Agravo de Instrumento';
      default: return tipo;
    }
  };

  const filteredRecursos = recursos.filter(r => {
    const judicial = isJudicial(r.tipo, r.fundamento);
    if (esferaFilter === 'ADMINISTRATIVA' && judicial) return false;
    if (esferaFilter === 'JUDICIAL' && !judicial) return false;

    if (filterTipo && r.tipo !== filterTipo) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;

    if (search) {
      const q = search.toLowerCase();
      const matchResumo = r.resumo && r.resumo.toLowerCase().includes(q);
      const matchResp = r.responsavel && r.responsavel.toLowerCase().includes(q);
      const matchConc = r.concorrente && r.concorrente.toLowerCase().includes(q);
      const matchOrgao = r.licitacao?.orgaoNome && r.licitacao.orgaoNome.toLowerCase().includes(q);
      if (!matchResumo && !matchResp && !matchConc && !matchOrgao) return false;
    }

    return true;
  });

  const totalAdmin = recursos.filter(r => !isJudicial(r.tipo, r.fundamento)).length;
  const totalJud = recursos.filter(r => isJudicial(r.tipo, r.fundamento)).length;
  const totalAbertos = recursos.filter(r => r.status === 'ABERTO' || r.status === 'EM_ELABORACAO').length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '22px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={26} style={{ color: 'var(--color-primary)' }} />
            Recursos Administrativos & Ações Jurídicas
          </h1>
          <p className="page-subtitle">
            Gestão estratégica de prazos preclusivos, impugnações, contrarrazões e mandados de segurança
          </p>
        </div>

        <button 
          onClick={() => setModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Cadastrar Novo Recurso / Processo
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Recursos Administrativos</span>
            <FileText size={18} style={{ color: '#60a5fa' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#60a5fa' }}>
            {totalAdmin}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Impugnações, esclarecimentos e recursos</span>
        </div>

        <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ações Judiciais & MS</span>
            <Landmark size={18} style={{ color: '#c084fc' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#c084fc' }}>
            {totalJud}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mandados de segurança e ações anulatórias</span>
        </div>

        <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prazos Críticos / Abertos</span>
            <Clock size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--color-primary)' }}>
            {totalAbertos}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Exigem providência e protocolo</span>
        </div>
      </div>

      {/* Seletor de Esfera: Administrativa vs Judicial */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setEsferaFilter('ALL')}
          className={`btn ${esferaFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.88rem' }}
        >
          <Scale size={16} />
          Todos os Processos ({recursos.length})
        </button>

        <button
          onClick={() => setEsferaFilter('ADMINISTRATIVA')}
          className={`btn ${esferaFilter === 'ADMINISTRATIVA' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.88rem' }}
        >
          <FileText size={16} />
          Esfera Administrativa ({totalAdmin})
        </button>

        <button
          onClick={() => setEsferaFilter('JUDICIAL')}
          className={`btn ${esferaFilter === 'JUDICIAL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.88rem' }}
        >
          <Landmark size={16} />
          Esfera Judicial / Mandados de Segurança ({totalJud})
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por órgão, objeto do recurso, concorrente ou responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-control"
            style={{ height: '38px', fontSize: '0.85rem', minWidth: '150px' }}
          >
            <option value="ALL">Status: Todos</option>
            <option value="ABERTO">Em Aberto</option>
            <option value="EM_ELABORACAO">Em Elaboração</option>
            <option value="PROTOCOLADO">Protocolado</option>
            <option value="JULGADO_DEFERIDO">Deferido / Concedido</option>
            <option value="JULGADO_INDEFERIDO">Indeferido</option>
          </select>
        </div>
      </div>

      {/* Grid de Recursos & Processos */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          Carregando recursos e processos...
        </div>
      ) : filteredRecursos.length === 0 ? (
        <div className="card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Nenhum recurso ou ação jurídica encontrada no momento.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredRecursos.map(rec => {
            const judicial = isJudicial(rec.tipo, rec.fundamento);
            const daysLeft = calculateDaysLeft(rec.prazo);
            const isLate = daysLeft !== null && daysLeft < 0;
            const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 2;

            return (
              <div 
                key={rec.id}
                className="card"
                style={{ 
                  padding: '22px', 
                  background: 'var(--bg-surface)',
                  border: judicial ? '1px solid rgba(192, 132, 252, 0.3)' : '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 800, 
                      padding: '3px 8px', 
                      borderRadius: 'var(--radius-sm)',
                      background: judicial ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: judicial ? '#c084fc' : '#60a5fa',
                      border: judicial ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {judicial ? <Landmark size={12} /> : <FileText size={12} />}
                      {judicial ? 'ESFERA JUDICIAL' : 'ADMINISTRATIVO'}
                    </span>

                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: isLate ? '#ef4444' : isUrgent ? '#fbbf24' : '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Clock size={13} />
                      {rec.prazo ? (
                        isLate ? `${Math.abs(daysLeft || 0)}d atrasado` : daysLeft === 0 ? 'Vence Hoje!' : `${daysLeft} dias restantes`
                      ) : 'Sem prazo'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {getTipoLabel(rec.tipo)}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#60a5fa', marginBottom: '8px' }}>
                    {rec.licitacao?.orgaoNome || 'Órgão Licitante'} • Edital {rec.licitacao?.numero || 'S/N'}
                  </p>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
                    {rec.resumo}
                  </p>

                  {rec.concorrente && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <strong>Concorrente envolvido:</strong> {rec.concorrente}
                    </div>
                  )}

                  {rec.proximaAcao && (
                    <div style={{ 
                      background: 'rgba(255, 255, 255, 0.03)', 
                      padding: '8px 10px', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.78rem', 
                      color: 'var(--text-primary)', 
                      marginBottom: '14px',
                      borderLeft: '3px solid var(--color-primary)'
                    }}>
                      <strong style={{ color: 'var(--color-primary)' }}>Próxima Ação:</strong> {rec.proximaAcao}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Resp: {rec.responsavel || 'Jurídico UFC / Pórtico'}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => openEditModal(rec)} 
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                    >
                      <Edit3 size={13} /> Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteRecurso(rec.id)} 
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '5px 8px', color: '#ef4444' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: NOVO RECURSO / MANDADO DE SEGURANÇA                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
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
        onClick={() => setModalOpen(false)}
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
              padding: '28px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Scale size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cadastrar Recurso ou Ação Judicial</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Controle de impugnações, recursos administrativos ou mandados de segurança</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateRecurso} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Licitação / Certame *</label>
                <select 
                  value={newRecurso.licitacaoId} 
                  onChange={(e) => setNewRecurso({ ...newRecurso, licitacaoId: e.target.value })}
                  className="form-control"
                  required
                >
                  {licitacoes.map(lic => (
                    <option key={lic.id} value={lic.id}>
                      {lic.orgaoNome} — Edital nº {lic.numero || 'S/N'} ({lic.uf || 'CE'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Seletor de Esfera */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Esfera Processual *</label>
                  <select 
                    value={newRecurso.esfera} 
                    onChange={(e) => {
                      const novaEsfera = e.target.value;
                      setNewRecurso({ 
                        ...newRecurso, 
                        esfera: novaEsfera,
                        tipo: novaEsfera === 'JUDICIAL' ? 'MANDADO_DE_SEGURANCA' : 'IMPUGNACAO'
                      });
                    }}
                    className="form-control"
                  >
                    <option value="ADMINISTRATIVA">Esfera Administrativa (Pregoeiro / Comissão)</option>
                    <option value="JUDICIAL">Esfera Judicial (Justiça / Tribunal)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Peça / Ação *</label>
                  <select 
                    value={newRecurso.tipo} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, tipo: e.target.value })}
                    className="form-control"
                  >
                    {newRecurso.esfera === 'ADMINISTRATIVA' ? (
                      <>
                        <option value="IMPUGNACAO">Impugnação ao Edital (Art. 164 Lei 14.133)</option>
                        <option value="ESCLARECIMENTO">Pedido de Esclarecimento</option>
                        <option value="RECURSO">Recurso Administrativo Pós-Julgamento</option>
                        <option value="CONTRARRAZOES">Contrarrazões a Recurso de Terceiro</option>
                        <option value="DILIGENCIA">Resposta a Diligência Técnica</option>
                      </>
                    ) : (
                      <>
                        <option value="MANDADO_DE_SEGURANCA">Mandado de Segurança com Pedido Liminar</option>
                        <option value="ACAO_ORDINARIA">Ação Anulatória / Ordinária</option>
                        <option value="AGRAVO_INSTRUMENTO">Agravo de Instrumento</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {newRecurso.esfera === 'JUDICIAL' && (
                <div className="form-group" style={{ background: 'rgba(168, 85, 247, 0.08)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <label className="form-label" style={{ color: '#c084fc' }}>Vara / Comarca / Tribunal Judicial</label>
                  <input 
                    value={newRecurso.tribunalVara} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, tribunalVara: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 2ª Vara da Fazenda Pública da Comarca de Fortaleza / TJCE"
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Prazo Fatal de Protocolo</label>
                  <input 
                    type="date"
                    value={newRecurso.prazo} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, prazo: e.target.value })}
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Responsável Técnico / Jurídico</label>
                  <input 
                    value={newRecurso.responsavel} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, responsavel: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Dr. Tosta / Jurídico UFC"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Concorrente / Terceiro Interessado (opcional)</label>
                <input 
                  value={newRecurso.concorrente} 
                  onChange={(e) => setNewRecurso({ ...newRecurso, concorrente: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Construtora Alfa Ltda"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resumo do Objeto / Motivo da Ação *</label>
                <textarea 
                  value={newRecurso.resumo} 
                  onChange={(e) => setNewRecurso({ ...newRecurso, resumo: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Descreva suscintamente a ilegalidade ou ponto questionado..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Próxima Ação Imediata</label>
                <input 
                  value={newRecurso.proximaAcao} 
                  onChange={(e) => setNewRecurso({ ...newRecurso, proximaAcao: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Coletar assinatura digital do RT e protocolar via Comprasnet"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Processo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR RECURSO */}
      {editModalOpen && editingRecurso && (
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
              maxWidth: '600px', 
              width: '100%', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Atualizar Recurso / Processo</h3>
              <button onClick={() => setEditModalOpen(false)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Status do Processo</label>
                  <select 
                    value={editData.status} 
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="form-control"
                  >
                    <option value="ABERTO">Em Aberto</option>
                    <option value="EM_ELABORACAO">Em Elaboração</option>
                    <option value="PROTOCOLADO">Protocolado</option>
                    <option value="JULGADO_DEFERIDO">Julgado: Deferido / Concedido</option>
                    <option value="JULGADO_INDEFERIDO">Julgado: Indeferido</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Prazo Fatal</label>
                  <input 
                    type="date"
                    value={editData.prazo} 
                    onChange={(e) => setEditData({ ...editData, prazo: e.target.value })}
                    className="form-control" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Responsável</label>
                <input 
                  value={editData.responsavel} 
                  onChange={(e) => setEditData({ ...editData, responsavel: e.target.value })}
                  className="form-control" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resumo do Processo</label>
                <textarea 
                  value={editData.resumo} 
                  onChange={(e) => setEditData({ ...editData, resumo: e.target.value })}
                  className="form-control" 
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Próxima Ação Imediata</label>
                <input 
                  value={editData.proximaAcao} 
                  onChange={(e) => setEditData({ ...editData, proximaAcao: e.target.value })}
                  className="form-control" 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={savingEdit} className="btn btn-primary">
                  {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
