"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, Search, Filter, Plus, FileText, 
  MapPin, Calendar, FileCheck, ArrowRight, Loader2,
  Sparkles, CheckCircle2, XCircle, AlertCircle, Eye,
  Layers, X
} from 'lucide-react';

export default function AcervoPage() {
  const [acervos, setAcervos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [ufFilter, setUfFilter] = useState('');
  
  // Simulador Modal State
  const [simuladorOpen, setSimuladorOpen] = useState(false);
  const [simLicitacoes, setSimLicitacoes] = useState<any[]>([]);
  const [selectedLicitacao, setSelectedLicitacao] = useState('');
  const [simResults, setSimResults] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    ufc: 0,
    portico: 0,
    areas: 0
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
        
        if (!search && !orgFilter && !ufFilter) {
          const ufcCount = data.filter((d: any) => d.organization?.name?.toLowerCase().includes('ufc')).length;
          const porticoCount = data.filter((d: any) => d.organization?.name?.toLowerCase().includes('pórtico') || d.organization?.name?.toLowerCase().includes('portico')).length;
          const areasSet = new Set(data.map((d: any) => d.areaTecnica).filter(Boolean));
          
          setStats({
            total: data.length,
            ufc: ufcCount,
            portico: porticoCount,
            areas: areasSet.size
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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

  const parseQuantitativos = (qStr: string) => {
    if (!qStr) return [];
    try {
      return JSON.parse(qStr);
    } catch {
      return [];
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={26} style={{ color: 'var(--color-primary)' }} />
            Acervo Técnico & CATs
          </h1>
          <p className="page-subtitle">
            Gestão de atestados técnicos, certidões de acervo (CREA/CAU) e simulação de compatibilidade
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={openSimulador}
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Sparkles size={16} style={{ color: '#a855f7' }} />
            Simulador de Compatibilidade
          </button>
          <Link href="/dashboard/acervo/novo" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            Novo Atestado / CAT
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <FileText size={22} />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total de Atestados / CATs</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#34d399' }}>
            <Building2 size={22} />
          </div>
          <div className="stat-value">{stats.ufc}</div>
          <div className="stat-label">UFC Engenharia</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <Building2 size={22} />
          </div>
          <div className="stat-value">{stats.portico}</div>
          <div className="stat-label">Pórtico Construções</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
            <Layers size={22} />
          </div>
          <div className="stat-value">{stats.areas}</div>
          <div className="stat-label">Áreas Técnicas Distintas</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ marginBottom: '28px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por objeto, órgão emitente, CAT, palavras-chave..." 
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
            value={ufFilter} 
            onChange={(e) => setUfFilter(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '120px' }}
          >
            <option value="">UF: Todas</option>
            <option value="CE">Ceará (CE)</option>
            <option value="SP">São Paulo (SP)</option>
            <option value="PE">Pernambuco (PE)</option>
            <option value="RN">Rio Grande do Norte (RN)</option>
            <option value="BA">Bahia (BA)</option>
          </select>

          {(search || orgFilter || ufFilter) && (
            <button 
              onClick={() => { setSearch(''); setOrgFilter(''); setUfFilter(''); }}
              className="btn btn-ghost btn-sm" 
              style={{ height: '40px' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid of Acervos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando acervo técnico...</p>
        </div>
      ) : acervos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FileText size={44} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Nenhum atestado encontrado</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Cadastre os atestados e CATs das empresas para habilitar o simulador e compatibilidade automática.
          </p>
          <Link href="/dashboard/acervo/novo" className="btn btn-primary btn-sm">
            <Plus size={16} /> Cadastrar Primeiro Atestado
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {acervos.map((item) => {
            const quants = parseQuantitativos(item.quantitativos);
            const isUfc = item.organization?.name?.toLowerCase().includes('ufc');

            return (
              <div 
                key={item.id}
                className="acervo-card"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                  transition: 'all var(--transition-base)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        padding: '3px 8px', 
                        borderRadius: 'var(--radius-sm)',
                        background: isUfc ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: isUfc ? '#34d399' : '#fbbf24',
                        border: `1px solid ${isUfc ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                        display: 'inline-block',
                        marginBottom: '6px'
                      }}
                    >
                      {item.organization?.tradeName || item.organization?.name}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {item.numeroCat ? `CAT nº ${item.numeroCat}` : (item.numeroAtestado ? `Atestado ${item.numeroAtestado}` : 'Atestado Técnico')}
                    </h3>
                  </div>

                  {item.areaTecnica && (
                    <span style={{ 
                      fontSize: '0.72rem', 
                      background: 'rgba(255,255,255,0.06)', 
                      padding: '3px 8px', 
                      borderRadius: 'var(--radius-sm)', 
                      color: 'var(--text-secondary)' 
                    }}>
                      {item.areaTecnica}
                    </span>
                  )}
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
                  fontSize: '0.76rem', 
                  color: 'var(--text-muted)',
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} /> {item.local ? `${item.local} - ` : ''}{item.uf || 'Brasil'}
                  </div>

                  {item.responsavelTecnico && (
                    <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.responsavelTecnico}>
                      {item.responsavelTecnico}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
          <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: '#a855f7' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Simulador de Compatibilidade Técnica</h3>
              </div>
              <button onClick={() => setSimuladorOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
              Selecione uma licitação em monitoramento para cruzar os requisitos do edital com os atestados e CATs de UFC Engenharia e Pórtico Construções.
            </p>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Selecione a Licitação</label>
              <select 
                value={selectedLicitacao} 
                onChange={(e) => setSelectedLicitacao(e.target.value)}
                className="form-control"
                style={{ width: '100%', height: '42px' }}
              >
                <option value="">Selecione...</option>
                {simLicitacoes.map(lic => (
                  <option key={lic.id} value={lic.id}>
                    {lic.orgaoNome} ({lic.modalidade || 'Edital'} nº {lic.numero})
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={runSimulacao}
              disabled={!selectedLicitacao || simLoading}
              className="btn btn-primary"
              style={{ width: '100%', height: '44px', marginBottom: '24px', justifyContent: 'center' }}
            >
              {simLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Calculando Aderência...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Calcular Compatibilidade
                </>
              )}
            </button>

            {simResults && (
              <div style={{ background: 'var(--bg-elevated)', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Resultado do Cruzamento</span>
                  <span style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 800, 
                    color: simResults.score >= 80 ? '#34d399' : (simResults.score >= 50 ? '#fbbf24' : '#f87171') 
                  }}>
                    {simResults.score}% Aderência
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {simResults.matches?.map((m: any, idx: number) => (
                    <div key={idx} style={{ 
                      padding: '10px 12px', 
                      borderRadius: 'var(--radius-md)', 
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.82rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {m.compatibilidade === 'ATENDE' ? (
                          <CheckCircle2 size={15} color="#34d399" />
                        ) : (
                          <AlertCircle size={15} color="#fbbf24" />
                        )}
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.requisito}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{m.justificativa}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .acervo-card:hover {
          transform: translateY(-2px);
          border-color: rgba(232, 93, 93, 0.4) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
