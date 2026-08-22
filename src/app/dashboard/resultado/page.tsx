"use client";

import React, { useState, useEffect } from 'react';
import { 
  Kanban, Plus, Clock, AlertCircle, CheckCircle2, 
  ArrowRight, ArrowLeft, Search, Loader2, X, Save, Building2, DollarSign
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const KANBAN_COLUMNS = [
  { id: 'PENDENTE', title: 'Pendente', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
  { id: 'EM_ELABORACAO', title: 'Em Elaboração', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' },
  { id: 'PROTOCOLADO', title: 'Protocolado', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)' },
  { id: 'CONCLUIDO', title: 'Concluído', color: '#34d399', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)' },
];

export default function ResultadoPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [licitacoes, setLicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({
    licitacaoId: '',
    tipo: 'PROPOSTA_AJUSTADA',
    fase: 'PENDENTE',
    proximaAcao: '',
    prazo: '',
    responsavel: '',
    observacoes: ''
  });

  useEffect(() => {
    fetch('/api/licitacoes')
      .then(res => res.json())
      .then(data => {
        setLicitacoes(data);
        if (data.length > 0) {
          setNewItem(prev => ({ ...prev, licitacaoId: data[0].id }));
        }
      })
      .catch(console.error);

    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resultado');
      if (res.ok) {
        const data = await res.json();
        setFollowups(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updatePhase = async (id: string, newFase: string) => {
    try {
      const res = await fetch(`/api/resultado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, fase: newFase })
      });
      if (res.ok) {
        setFollowups(prev => prev.map(f => f.id === id ? { ...f, fase: newFase } : f));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.licitacaoId || !newItem.proximaAcao) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/resultado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        setModalOpen(false);
        setNewItem({
          licitacaoId: licitacoes[0]?.id || '',
          tipo: 'PROPOSTA_AJUSTADA',
          fase: 'PENDENTE',
          proximaAcao: '',
          prazo: '',
          responsavel: '',
          observacoes: ''
        });
        fetchFollowups();
      } else {
        alert('Erro ao salvar item.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filtered = followups.filter(f => {
    if (!search) return true;
    const t = search.toLowerCase();
    return (
      f.licitacao?.orgaoNome?.toLowerCase().includes(t) ||
      f.licitacao?.numero?.toLowerCase().includes(t) ||
      f.responsavel?.toLowerCase().includes(t) ||
      f.proximaAcao?.toLowerCase().includes(t)
    );
  });

  const getItemsByColumn = (colId: string) => filtered.filter(f => f.fase === colId);

  const getNextPhase = (current: string) => {
    const idx = KANBAN_COLUMNS.findIndex(c => c.id === current);
    if (idx !== -1 && idx < KANBAN_COLUMNS.length - 1) {
      return KANBAN_COLUMNS[idx + 1].id;
    }
    return null;
  };

  const getPrevPhase = (current: string) => {
    const idx = KANBAN_COLUMNS.findIndex(c => c.id === current);
    if (idx > 0) {
      return KANBAN_COLUMNS[idx - 1].id;
    }
    return null;
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Kanban size={26} style={{ color: 'var(--color-primary)' }} />
            Acompanhamento de Resultado (Kanban Pós-Disputa)
          </h1>
          <p className="page-subtitle">
            Fluxo ágil pós-sessão pública: adequação de propostas, homologação e assinatura de contrato
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no Kanban..." 
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', width: '100%' }}
            />
          </div>

          <button 
            onClick={() => setModalOpen(true)}
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Nova Ação
          </button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando quadro Kanban...</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '18px',
          alignItems: 'start'
        }}>
          {KANBAN_COLUMNS.map((col) => {
            const items = getItemsByColumn(col.id);

            return (
              <div 
                key={col.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 220px)',
                  overflow: 'hidden'
                }}
              >
                {/* Column Header */}
                <div style={{ 
                  padding: '16px 18px', 
                  borderBottom: `2px solid ${col.color}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {col.title}
                    </h3>
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    padding: '2px 8px', 
                    borderRadius: 'var(--radius-full)', 
                    background: col.bg, 
                    color: col.color 
                  }}>
                    {items.length}
                  </span>
                </div>

                {/* Column Body */}
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
                  {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      Nenhum item nesta fase
                    </div>
                  ) : (
                    items.map((item) => {
                      const next = getNextPhase(item.fase);
                      const prev = getPrevPhase(item.fase);

                      return (
                        <div 
                          key={item.id}
                          className="kanban-item"
                          style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                              {item.tipo}
                            </span>
                            {item.prazo && (
                              <span style={{ fontSize: '0.72rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} /> {formatDate(new Date(item.prazo))}
                              </span>
                            )}
                          </div>

                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                            {item.licitacao?.orgaoNome}
                          </h4>

                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {item.proximaAcao}
                          </p>

                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            fontSize: '0.75rem', 
                            color: 'var(--text-muted)',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '8px',
                            marginTop: '4px'
                          }}>
                            <span>{item.responsavel || 'Equipe'}</span>

                            <div style={{ display: 'flex', gap: '4px' }}>
                              {prev && (
                                <button 
                                  onClick={() => updatePhase(item.id, prev)}
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                                  title="Mover para fase anterior"
                                >
                                  <ArrowLeft size={12} />
                                </button>
                              )}

                              {next && (
                                <button 
                                  onClick={() => updatePhase(item.id, next)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '2px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                                  title="Avançar para próxima fase"
                                >
                                  Avançar <ArrowRight size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova Ação */}
      {modalOpen && (
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
          <div className="card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Kanban size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Nova Ação Pós-Disputa</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFollowup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Licitação Vencedora / Alvo *</label>
                <select 
                  value={newItem.licitacaoId} 
                  onChange={(e) => setNewItem({ ...newItem, licitacaoId: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="">Selecione a licitação...</option>
                  {licitacoes.map(lic => (
                    <option key={lic.id} value={lic.id}>
                      {lic.orgaoNome} (Edital nº {lic.numero || 'S/N'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Ação</label>
                  <select 
                    value={newItem.tipo} 
                    onChange={(e) => setNewItem({ ...newItem, tipo: e.target.value })}
                    className="form-control"
                  >
                    <option value="PROPOSTA_AJUSTADA">Proposta Ajustada ao Lance</option>
                    <option value="HABILITACAO_DOCUMENTAL">Envio de Documentação</option>
                    <option value="HOMOLOGACAO">Acompanhar Homologação</option>
                    <option value="ASSINATURA_CONTRATO">Assinatura de Contrato</option>
                    <option value="CAUCAO_GARANTIA">Apresentar Caução/Garantia</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Coluna Inicial</label>
                  <select 
                    value={newItem.fase} 
                    onChange={(e) => setNewItem({ ...newItem, fase: e.target.value })}
                    className="form-control"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ELABORACAO">Em Elaboração</option>
                    <option value="PROTOCOLADO">Protocolado</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição da Próxima Ação *</label>
                <input 
                  value={newItem.proximaAcao} 
                  onChange={(e) => setNewItem({ ...newItem, proximaAcao: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Readequar planilha orçamentária para o lance vencedor"
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Prazo Limite</label>
                  <input 
                    type="datetime-local" 
                    value={newItem.prazo} 
                    onChange={(e) => setNewItem({ ...newItem, prazo: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Responsável</label>
                  <input 
                    value={newItem.responsavel} 
                    onChange={(e) => setNewItem({ ...newItem, responsavel: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Fernanda Lima" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Adicionar ao Kanban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .kanban-item:hover {
          border-color: rgba(232, 93, 93, 0.35) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
