"use client";

import React, { useState, useEffect } from 'react';
import { 
  Scale, Clock, Filter, Plus, Search, 
  FileText, CheckCircle2, AlertTriangle, 
  ChevronRight, Calendar, ArrowRight, Loader2, X, Save, Gavel,
  Edit3, Trash2, Check, RefreshCw
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function RecursosPage() {
  const [recursos, setRecursos] = useState<any[]>([]);
  const [licitacoes, setLicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [search, setSearch] = useState('');
  
  // Modal Novo Recurso State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRecurso, setNewRecurso] = useState({
    licitacaoId: '',
    tipo: 'ESCLARECIMENTO',
    posicao: 'NOSSA_EMPRESA',
    prazo: '',
    responsavel: '',
    concorrente: '',
    setor: 'JURIDICO',
    resumo: '',
    fundamento: '',
    proximaAcao: ''
  });

  // Modal Editar Recurso State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecurso, setEditingRecurso] = useState<any>(null);
  const [editData, setEditData] = useState({
    prazo: '',
    proximaAcao: '',
    status: 'ABERTO',
    responsavel: '',
    setor: 'JURIDICO',
    resumo: '',
    fundamento: '',
    concorrente: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetch('/api/licitacoes')
      .then(res => res.json())
      .then(data => {
        setLicitacoes(data);
        if (data.length > 0) {
          setNewRecurso(prev => ({ ...prev, licitacaoId: data[0].id }));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchRecursos();
  }, [filterTipo, filterSetor]);

  const fetchRecursos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTipo) params.append('tipo', filterTipo);
      if (filterSetor) params.append('setor', filterSetor);
      
      const res = await fetch(`/api/recursos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecursos(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysLeft = (dateString: string | null) => {
    if (!dateString) return null;
    const diff = new Date(dateString).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const handleCreateRecurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecurso.licitacaoId || !newRecurso.resumo) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/recursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecurso)
      });
      if (res.ok) {
        setModalOpen(false);
        setNewRecurso({
          licitacaoId: licitacoes[0]?.id || '',
          tipo: 'ESCLARECIMENTO',
          posicao: 'NOSSA_EMPRESA',
          prazo: '',
          responsavel: '',
          concorrente: '',
          setor: 'JURIDICO',
          resumo: '',
          fundamento: '',
          proximaAcao: ''
        });
        fetchRecursos();
      } else {
        alert('Erro ao criar recurso.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao criar recurso.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (r: any) => {
    setEditingRecurso(r);
    setEditData({
      prazo: r.prazo ? r.prazo.split('T')[0] : '',
      proximaAcao: r.proximaAcao || '',
      status: r.status || 'ABERTO',
      responsavel: r.responsavel || '',
      setor: r.setor || 'JURIDICO',
      resumo: r.resumo || '',
      fundamento: r.fundamento || '',
      concorrente: r.concorrente || ''
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
      } else {
        alert('Erro ao atualizar recurso.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar alterações.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteRecurso = async (id: string) => {
    if (!confirm('Deseja realmente excluir este caso de recurso?')) return;

    try {
      const res = await fetch(`/api/recursos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEditModalOpen(false);
        fetchRecursos();
      } else {
        alert('Erro ao excluir recurso.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/recursos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchRecursos();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRecursos = recursos.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.resumo?.toLowerCase().includes(q) ||
      r.proximaAcao?.toLowerCase().includes(q) ||
      r.responsavel?.toLowerCase().includes(q) ||
      r.licitacao?.orgaoNome?.toLowerCase().includes(q) ||
      r.licitacao?.numero?.toLowerCase().includes(q)
    );
  });

  const criticalPrazos = recursos.filter(r => {
    if (r.status === 'CONCLUIDO') return false;
    const days = calculateDaysLeft(r.prazo);
    return days !== null && days <= 5;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={26} style={{ color: 'var(--color-primary)' }} />
            Recursos & Prazos Administrativos
          </h1>
          <p className="page-subtitle">
            Gestão estratégica de impugnações, pedidos de esclarecimento, recursos, contrarrazões e ações
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setModalOpen(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Novo Recurso / Peça
          </button>
        </div>
      </div>

      {/* Radar de Prazos Iminentes */}
      {criticalPrazos.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>
            <Clock size={16} />
            RADAR DE PRAZOS IMINENTES (CONTAGEM REGRESSIVA)
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {criticalPrazos.map(r => {
              const days = calculateDaysLeft(r.prazo);
              const isUrgent = days !== null && days <= 1;

              return (
                <div 
                  key={r.id} 
                  className="card" 
                  style={{ 
                    border: `1px solid ${isUrgent ? '#ef4444' : '#f59e0b'}`, 
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '16px 18px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(232, 93, 93, 0.15)',
                      color: 'var(--color-primary)'
                    }}>
                      {r.tipo}
                    </span>

                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: isUrgent ? '#f87171' : '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Clock size={12} />
                      {days !== null ? (days < 0 ? `Vencido há ${Math.abs(days)} dias` : (days === 0 ? 'VENCE HOJE!' : `${days} dias restantes`)) : ''}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {r.licitacao?.orgaoNome}
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    {r.resumo}
                  </p>

                  {r.proximaAcao && (
                    <div style={{ fontSize: '0.78rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                      <strong>Ação a realizar:</strong> {r.proximaAcao}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Resp: {r.responsavel || 'Não atribuído'}
                    </span>
                    <button 
                      onClick={() => handleOpenEdit(r)} 
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    >
                      <Edit3 size={12} /> Editar Prazo & Ação
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por órgão, resumo, número ou responsável..." 
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', width: '100%' }}
            />
          </div>

          <select 
            value={filterTipo} 
            onChange={(e) => setFilterTipo(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '160px' }}
          >
            <option value="">Tipo: Todos</option>
            <option value="IMPUGNACAO">Impugnação</option>
            <option value="ESCLARECIMENTO">Esclarecimento</option>
            <option value="INTENCAO_RECURSAL">Intenção Recursal</option>
            <option value="RECURSO">Recurso</option>
            <option value="CONTRARRAZOES">Contrarrazões</option>
            <option value="DILIGENCIA">Diligência</option>
          </select>

          <select 
            value={filterSetor} 
            onChange={(e) => setFilterSetor(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '160px' }}
          >
            <option value="">Setor: Todos</option>
            <option value="JURIDICO">Jurídico</option>
            <option value="TECNICO">Técnico</option>
            <option value="ORCAMENTO">Orçamento</option>
            <option value="LICITACOES">Licitações</option>
            <option value="DIRETORIA">Diretoria</option>
          </select>

          {(search || filterTipo || filterSetor) && (
            <button 
              onClick={() => { setSearch(''); setFilterTipo(''); setFilterSetor(''); }}
              className="btn btn-ghost btn-sm" 
              style={{ height: '40px' }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando recursos e prazos...</p>
        </div>
      ) : filteredRecursos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Scale size={44} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Nenhum recurso cadastrado</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Cadastre prazos de impugnações e recursos para controle da equipe.
          </p>
          <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> Novo Recurso / Peça
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Tipo & Posição</th>
                <th>Órgão Licitante</th>
                <th>Resumo / Ação a Realizar</th>
                <th>Prazo Fatal</th>
                <th>Responsável / Setor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecursos.map((r) => {
                const days = calculateDaysLeft(r.prazo);
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{r.tipo}</span>
                        <span style={{ fontSize: '0.7rem', color: r.posicao === 'NOSSA_EMPRESA' ? '#34d399' : '#fbbf24' }}>
                          {r.posicao === 'NOSSA_EMPRESA' ? '➔ Nossa Empresa' : '➔ Concorrente'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.licitacao?.orgaoNome}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Edital nº {r.licitacao?.numero || 'S/N'}</div>
                    </td>

                    <td style={{ maxWidth: '350px' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{r.resumo}</p>
                      {r.proximaAcao && (
                        <div style={{ fontSize: '0.76rem', color: '#60a5fa', marginTop: '4px', background: 'rgba(59, 130, 246, 0.08)', padding: '4px 8px', borderRadius: '4px' }}>
                          <strong>Ação:</strong> {r.proximaAcao}
                        </div>
                      )}
                    </td>

                    <td>
                      {r.prazo ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{formatDate(new Date(r.prazo))}</div>
                          <span style={{ fontSize: '0.72rem', color: days !== null && days <= 2 ? '#f87171' : 'var(--text-muted)' }}>
                            {days !== null ? (days < 0 ? `Vencido (${Math.abs(days)}d)` : `${days}d restantes`) : ''}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem prazo</span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{r.responsavel || 'Não atribuído'}</div>
                      <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                        {r.setor || 'Geral'}
                      </span>
                    </td>

                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: 'var(--radius-sm)',
                        background: r.status === 'CONCLUIDO' || r.status === 'DEFERIDO' ? 'rgba(34, 197, 94, 0.15)' : (r.status === 'EM_ANDAMENTO' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                        color: r.status === 'CONCLUIDO' || r.status === 'DEFERIDO' ? '#34d399' : (r.status === 'EM_ANDAMENTO' ? '#60a5fa' : '#fbbf24')
                      }}>
                        {r.status}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => handleOpenEdit(r)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Editar Prazo, Ação e Status"
                        >
                          <Edit3 size={13} style={{ color: '#60a5fa' }} /> Editar
                        </button>

                        {r.status !== 'CONCLUIDO' && (
                          <button 
                            onClick={() => updateStatus(r.id, 'CONCLUIDO')}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px', color: '#34d399', fontSize: '0.75rem' }}
                            title="Marcar como Concluído"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Editar Recurso & Prazo */}
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
              maxWidth: '650px', 
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
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editar Recurso & Prazo</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{editingRecurso.licitacao?.orgaoNome}</p>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Data do Prazo Fatal *</label>
                  <input 
                    type="date"
                    value={editData.prazo} 
                    onChange={(e) => setEditData({ ...editData, prazo: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status do Procedimento</label>
                  <select 
                    value={editData.status} 
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="form-control"
                  >
                    <option value="ABERTO">Aberto / Em Análise</option>
                    <option value="EM_ANDAMENTO">Em Andamento / Redação</option>
                    <option value="PROTOCOLADO">Protocolado no Portal</option>
                    <option value="DEFERIDO">Deferido / Aceito</option>
                    <option value="INDEFERIDO">Indeferido / Recusado</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Próxima Ação a Realizar *</label>
                <input 
                  value={editData.proximaAcao} 
                  onChange={(e) => setEditData({ ...editData, proximaAcao: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Protocolar impugnação via Comprasnet até as 18h"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Responsável</label>
                  <input 
                    value={editData.responsavel} 
                    onChange={(e) => setEditData({ ...editData, responsavel: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Ana Paula Souza / Dr. Luciano"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Setor Responsável</label>
                  <select 
                    value={editData.setor} 
                    onChange={(e) => setEditData({ ...editData, setor: e.target.value })}
                    className="form-control"
                  >
                    <option value="JURIDICO">Jurídico</option>
                    <option value="TECNICO">Técnico / Engenharia</option>
                    <option value="ORCAMENTO">Orçamento / Custos</option>
                    <option value="LICITACOES">Licitações</option>
                    <option value="DIRETORIA">Diretoria</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resumo do Caso / Motivo</label>
                <textarea 
                  value={editData.resumo} 
                  onChange={(e) => setEditData({ ...editData, resumo: e.target.value })}
                  className="form-control" 
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fundamento Legal / Jurisprudência (TCU / Lei 14.133)</label>
                <textarea 
                  value={editData.fundamento} 
                  onChange={(e) => setEditData({ ...editData, fundamento: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Ex: Violação ao Art. 67 da Lei 14.133/2021 e Súmula TCU nº 263..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  type="button" 
                  onClick={() => handleDeleteRecurso(editingRecurso.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={15} /> Excluir Caso
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingEdit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Recurso */}
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
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Novo Caso de Recurso / Prazo</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRecurso} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Licitação Vinculada *</label>
                <select 
                  value={newRecurso.licitacaoId} 
                  onChange={(e) => setNewRecurso({ ...newRecurso, licitacaoId: e.target.value })}
                  className="form-control" 
                  required
                >
                  <option value="">Selecione a licitação...</option>
                  {licitacoes.map(lic => (
                    <option key={lic.id} value={lic.id}>{lic.orgaoNome} — Edital nº {lic.numero || 'S/N'}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Procedimento</label>
                  <select 
                    value={newRecurso.tipo} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, tipo: e.target.value })}
                    className="form-control"
                  >
                    <option value="ESCLARECIMENTO">Pedido de Esclarecimento</option>
                    <option value="IMPUGNACAO">Impugnação ao Edital</option>
                    <option value="INTENCAO_RECURSAL">Intenção de Recurso</option>
                    <option value="RECURSO">Recurso Administrativo</option>
                    <option value="CONTRARRAZOES">Contrarrazões</option>
                    <option value="DILIGENCIA">Diligência / Esclarecimento</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Posição da Peça</label>
                  <select 
                    value={newRecurso.posicao} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, posicao: e.target.value })}
                    className="form-control"
                  >
                    <option value="NOSSA_EMPRESA">Nossa Empresa (Autora)</option>
                    <option value="CONCORRENTE">Concorrente (Adversário)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Data do Prazo Fatal</label>
                  <input 
                    type="date" 
                    value={newRecurso.prazo} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, prazo: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Setor Responsável</label>
                  <select 
                    value={newRecurso.setor} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, setor: e.target.value })}
                    className="form-control"
                  >
                    <option value="JURIDICO">Jurídico</option>
                    <option value="TECNICO">Técnico / Engenharia</option>
                    <option value="ORCAMENTO">Orçamento / Custos</option>
                    <option value="LICITACOES">Licitações</option>
                    <option value="DIRETORIA">Diretoria</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Próxima Ação a Realizar</label>
                <input 
                  value={newRecurso.proximaAcao} 
                  onChange={(e) => setNewRecurso({ ...newRecurso, proximaAcao: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Protocolar recurso no Comprasnet" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resumo do Caso / Motivo da Peça *</label>
                <textarea 
                  value={newRecurso.resumo} 
                  onChange={(e) => setNewRecurso({ ...newRecurso, resumo: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Descreva o motivo da impugnação ou recurso..." 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fundamento Legal (Opcional)</label>
                <textarea 
                  value={newRecurso.fundamento} 
                  onChange={(e) => setNewRecurso({ ...newRecurso, fundamento: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Artigos da Lei 14.133/2021, jurisprudência do TCU..." 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar no Radar de Prazos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
