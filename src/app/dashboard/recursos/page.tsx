"use client";

import React, { useState, useEffect } from 'react';
import { 
  Scale, Clock, Filter, Plus, Search, 
  FileText, CheckCircle2, AlertTriangle, 
  ChevronRight, Calendar, ArrowRight, Loader2, X, Save, Gavel
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function RecursosPage() {
  const [recursos, setRecursos] = useState<any[]>([]);
  const [licitacoes, setLicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [search, setSearch] = useState('');
  
  // Modal State
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
        alert('Erro ao salvar recurso');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
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
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRecursos = recursos.filter(r => {
    if (!search) return true;
    const termo = search.toLowerCase();
    return (
      r.licitacao?.orgaoNome?.toLowerCase().includes(termo) ||
      r.licitacao?.numero?.toLowerCase().includes(termo) ||
      r.resumo?.toLowerCase().includes(termo) ||
      r.responsavel?.toLowerCase().includes(termo)
    );
  });

  const prazosCriticos = recursos
    .filter(r => r.prazo && ['ABERTO', 'EM_ANDAMENTO'].includes(r.status))
    .map(r => ({ ...r, daysLeft: calculateDaysLeft(r.prazo) }))
    .sort((a, b) => (a.daysLeft || 999) - (b.daysLeft || 999))
    .slice(0, 3);

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
            Gestão estratégica de impugnações, pedidos de esclarecimento, recursos e contrarrazões
          </p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Novo Recurso / Peça
        </button>
      </div>

      {/* Radar de Prazos Críticos */}
      {prazosCriticos.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} /> Radar de Prazos Iminentes (Contagem Regressiva)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {prazosCriticos.map((p) => {
              const isOverdue = p.daysLeft !== null && p.daysLeft < 0;
              const isUrgent = p.daysLeft !== null && p.daysLeft <= 2;

              return (
                <div 
                  key={p.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(22,22,24,0.95) 0%, rgba(26,10,15,0.7) 100%)',
                    border: `1px solid ${isOverdue ? '#ef4444' : (isUrgent ? '#f59e0b' : 'var(--border-color)')}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: isUrgent ? '0 0 20px rgba(245, 158, 11, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(232, 93, 93, 0.15)',
                      color: 'var(--color-primary)'
                    }}>
                      {p.tipo}
                    </span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 800, 
                      color: isOverdue ? '#f87171' : (isUrgent ? '#fbbf24' : '#34d399')
                    }}>
                      {isOverdue ? `Vencido há ${Math.abs(p.daysLeft!)} dias` : (p.daysLeft === 0 ? 'Vence HOJE' : `Vence em ${p.daysLeft} dias`)}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {p.licitacao?.orgaoNome}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {p.resumo}
                    </p>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: 'auto' }}>
                    <span>Resp: {p.responsavel}</span>
                    <span>Setor: {p.setor}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="card" style={{ marginBottom: '28px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
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
            style={{ width: 'auto', height: '40px', minWidth: '180px' }}
          >
            <option value="">Tipo: Todos</option>
            <option value="IMPUGNACAO">Impugnação</option>
            <option value="ESCLARECIMENTO">Esclarecimento</option>
            <option value="INTENCAO_RECURSAL">Intenção Recursal</option>
            <option value="RECURSO">Recurso Administrativo</option>
            <option value="CONTRARRAZOES">Contrarrazões</option>
          </select>

          <select 
            value={filterSetor} 
            onChange={(e) => setFilterSetor(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '150px' }}
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
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Table of Recursos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando recursos e prazos...</p>
        </div>
      ) : filteredRecursos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Scale size={44} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Nenhum recurso encontrado</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Cadastre impugnações e peças recursais para manter o controle de prazos da Lei 14.133.
          </p>
          <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> Cadastrar Nova Peça
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Tipo & Posição</th>
                <th>Órgão Licitante</th>
                <th>Resumo do Caso</th>
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
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{r.resumo}</p>
                      {r.proximaAcao && (
                        <div style={{ fontSize: '0.76rem', color: '#60a5fa', marginTop: '4px' }}>
                          <strong>Ação:</strong> {r.proximaAcao}
                        </div>
                      )}
                    </td>

                    <td>
                      {r.prazo ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{formatDate(new Date(r.prazo))}</div>
                          <span style={{ fontSize: '0.72rem', color: days !== null && days <= 2 ? '#f87171' : 'var(--text-muted)' }}>
                            {days !== null ? (days < 0 ? `Vencido` : `${days}d restantes`) : ''}
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
                        background: r.status === 'CONCLUIDO' || r.status === 'JULGADO' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: r.status === 'CONCLUIDO' || r.status === 'JULGADO' ? '#34d399' : '#fbbf24'
                      }}>
                        {r.status}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {r.status !== 'CONCLUIDO' && (
                          <button 
                            onClick={() => updateStatus(r.id, 'CONCLUIDO')}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px', color: '#34d399', fontSize: '0.75rem' }}
                            title="Concluir"
                          >
                            ✓ Concluir
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

      {/* Modal Novo Recurso */}
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
          <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Nova Peça / Recurso Administrativo</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
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
                    <option key={lic.id} value={lic.id}>
                      {lic.orgaoNome} (Edital nº {lic.numero || 'S/N'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Peça *</label>
                  <select 
                    value={newRecurso.tipo} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, tipo: e.target.value })}
                    className="form-control"
                  >
                    <option value="ESCLARECIMENTO">Pedido de Esclarecimento</option>
                    <option value="IMPUGNACAO">Impugnação ao Edital</option>
                    <option value="INTENCAO_RECURSAL">Intenção Recursal</option>
                    <option value="RECURSO">Recurso Administrativo</option>
                    <option value="CONTRARRAZOES">Contrarrazões</option>
                    <option value="DILIGENCIA">Resposta a Diligência</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Posição / Autoria</label>
                  <select 
                    value={newRecurso.posicao} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, posicao: e.target.value })}
                    className="form-control"
                  >
                    <option value="NOSSA_EMPRESA">Nossa Empresa (Interponente)</option>
                    <option value="ADVERSARIO">Adversário / Concorrente</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resumo do Pleito / Controvérsia *</label>
                <input 
                  value={newRecurso.resumo} 
                  onChange={(e) => setNewRecurso({ ...newRecurso, resumo: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Impugnação da cláusula de visita técnica obrigatória restritiva"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fundamento Técnico e Legal</label>
                <textarea 
                  value={newRecurso.fundamento} 
                  onChange={(e) => setNewRecurso({ ...newRecurso, fundamento: e.target.value })}
                  className="form-control" 
                  rows={3}
                  placeholder="Ex: Art. 164 da Lei 14.133/2021 e Acórdão 1443/2023-TCU Plenário..." 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Prazo Fatal</label>
                  <input 
                    type="datetime-local" 
                    value={newRecurso.prazo} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, prazo: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Responsável</label>
                  <input 
                    value={newRecurso.responsavel} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, responsavel: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Dr. Carlos Mendes" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Setor Encarregado</label>
                  <select 
                    value={newRecurso.setor} 
                    onChange={(e) => setNewRecurso({ ...newRecurso, setor: e.target.value })}
                    className="form-control"
                  >
                    <option value="JURIDICO">Jurídico</option>
                    <option value="TECNICO">Técnico</option>
                    <option value="ORCAMENTO">Orçamento</option>
                    <option value="LICITACOES">Licitações</option>
                    <option value="DIRETORIA">Diretoria</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Próxima Ação Imediata</label>
                <input 
                  value={newRecurso.proximaAcao} 
                  onChange={(e) => setNewRecurso({ ...newRecurso, proximaAcao: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Protocolar minuta no portal Comprasnet até as 18h" 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Peça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
