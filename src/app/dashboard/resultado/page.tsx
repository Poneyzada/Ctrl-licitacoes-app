"use client";

import React, { useState, useEffect } from 'react';
import { 
  Kanban, Plus, Clock, AlertCircle, CheckCircle2, 
  ArrowRight, ArrowLeft, Search, Loader2, X, Save, Building2, DollarSign,
  FileText, ShieldCheck, Award, Layers
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

// Fases de Status do Kanban
const KANBAN_PHASES = [
  { id: 'PENDENTE', title: 'Pendente', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
  { id: 'EM_ELABORACAO', title: 'Em Elaboração', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' },
  { id: 'PROTOCOLADO', title: 'Protocolado / Em Análise', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)' },
  { id: 'CONCLUIDO', title: 'Concluído com Êxito', color: '#34d399', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)' },
];

// Tipos de Etapas Pós-Disputa
const WORKFLOW_STEPS: Record<string, { label: string; desc: string }> = {
  'PROPOSTA_AJUSTADA': { label: '1. Proposta Ajustada ao Lance', desc: 'Readequação de planilhas e composição de BDI' },
  'DOCUMENTACAO_HABILITACAO': { label: '2. Envio de Habilitação', desc: 'Envio de certidões, balanço e atestados no sistema' },
  'ANALISE_PRECO': { label: '3. Avaliação de Proposta & Preço', desc: 'Acompanhamento do julgamento da comissão / pregoeiro' },
  'RECURSOS_CONTRARRAZOES': { label: '4. Recursos & Contrarrazões', desc: 'Fase recursal da sessão de disputa' },
  'HOMOLOGACAO_ADJUDICACAO': { label: '5. Homologação & Adjudicação', desc: 'Ato oficial declaratório do vencedor' },
  'ASSINATURA_CONTRATO': { label: '6. Assinatura do Contrato', desc: 'Convocação para termo contratual e garantias' },
};

export default function ResultadoPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [licitacoes, setLicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStep, setFilterStep] = useState('ALL');

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
        alert('Ação registrada com sucesso!');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const filteredFollowups = followups.filter(item => {
    const matchesStep = filterStep === 'ALL' || item.tipo === filterStep;
    const q = search.toLowerCase();
    const matchesSearch = !search || 
      (item.licitacao?.orgaoNome && item.licitacao.orgaoNome.toLowerCase().includes(q)) ||
      (item.proximaAcao && item.proximaAcao.toLowerCase().includes(q)) ||
      (item.responsavel && item.responsavel.toLowerCase().includes(q));
    return matchesStep && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '22px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Kanban size={26} style={{ color: 'var(--color-primary)' }} />
            Acompanhamento de Resultados & Pós-Disputa
          </h1>
          <p className="page-subtitle">
            Fluxo operacional pós-sessão: propostas ajustadas, envio de habilitação, recursos e homologação
          </p>
        </div>

        <button 
          onClick={() => setModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Registrar Nova Ação Pós-Sessão
        </button>
      </div>

      {/* Seletor Rápido de Etapas do Fluxo */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setFilterStep('ALL')}
          className={`btn btn-sm ${filterStep === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Todas as Etapas ({followups.length})
        </button>
        {Object.entries(WORKFLOW_STEPS).map(([key, step]) => (
          <button
            key={key}
            onClick={() => setFilterStep(key)}
            className={`btn btn-sm ${filterStep === key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: '22px', background: 'var(--bg-surface)' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por órgão, próxima ação ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          Carregando fluxos pós-sessão...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {KANBAN_PHASES.map((phase, idx) => {
            const phaseItems = filteredFollowups.filter(f => f.fase === phase.id);
            return (
              <div 
                key={phase.id}
                className="card"
                style={{ 
                  padding: '16px', 
                  background: 'var(--bg-surface)', 
                  borderTop: `3px solid ${phase.color}`,
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Coluna Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {phase.title}
                  </strong>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    padding: '2px 8px', 
                    borderRadius: 'var(--radius-full)',
                    background: phase.bg,
                    color: phase.color
                  }}>
                    {phaseItems.length}
                  </span>
                </div>

                {/* Cards da Coluna */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {phaseItems.length === 0 ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      Nenhuma ação nesta fase
                    </div>
                  ) : (
                    phaseItems.map(item => {
                      const stepInfo = WORKFLOW_STEPS[item.tipo] || { label: item.tipo || 'Acompanhamento', desc: '' };
                      return (
                        <div 
                          key={item.id}
                          style={{
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-md)',
                            padding: '14px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 700, 
                              color: '#60a5fa',
                              background: 'rgba(59, 130, 246, 0.12)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)'
                            }}>
                              {stepInfo.label}
                            </span>
                            {item.prazo && (
                              <span style={{ fontSize: '0.7rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} /> {formatDate(item.prazo)}
                              </span>
                            )}
                          </div>

                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {item.licitacao?.orgaoNome || 'Órgão Licitante'}
                          </strong>

                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {item.proximaAcao}
                          </p>

                          {item.responsavel && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Resp: {item.responsavel}
                            </span>
                          )}

                          {/* Ações de Avanço e Retrocesso */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                            {idx > 0 ? (
                              <button 
                                onClick={() => updatePhase(item.id, KANBAN_PHASES[idx - 1].id)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                title="Voltar fase anterior"
                              >
                                <ArrowLeft size={12} /> Voltar
                              </button>
                            ) : <div />}

                            {idx < KANBAN_PHASES.length - 1 ? (
                              <button 
                                onClick={() => updatePhase(item.id, KANBAN_PHASES[idx + 1].id)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Avançar para próxima etapa"
                              >
                                Avançar <ArrowRight size={12} />
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={12} /> Concluído
                              </span>
                            )}
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

      {/* MODAL: REGISTRAR NOVA AÇÃO */}
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
              maxWidth: '560px', 
              width: '100%', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Registrar Ação Pós-Disputa</h3>
              <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateFollowup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Licitação Vencedora / Disputada *</label>
                <select 
                  value={newItem.licitacaoId} 
                  onChange={(e) => setNewItem({ ...newItem, licitacaoId: e.target.value })}
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

              <div className="form-group">
                <label className="form-label">Etapa do Fluxo Pós-Sessão *</label>
                <select 
                  value={newItem.tipo} 
                  onChange={(e) => setNewItem({ ...newItem, tipo: e.target.value })}
                  className="form-control"
                >
                  {Object.entries(WORKFLOW_STEPS).map(([key, step]) => (
                    <option key={key} value={key}>{step.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Prazo Limite</label>
                  <input 
                    type="date"
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
                    placeholder="Ex: Tosta / Equipe Técnica"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Próxima Ação Imediata *</label>
                <textarea 
                  value={newItem.proximaAcao} 
                  onChange={(e) => setNewItem({ ...newItem, proximaAcao: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Ex: Reajustar planilha de preços conforme último lance e anexar via comprasnet..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Ação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
