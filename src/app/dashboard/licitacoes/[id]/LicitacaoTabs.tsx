'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, FileText, Users, Scale, LayoutDashboard, Clock, 
  AlertTriangle, CheckCircle2, XCircle, HelpCircle, FileX, 
  Sparkles, Loader2, Calendar, ShieldAlert, ArrowUpRight, 
  MapPin, Building2, Check, RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function LicitacaoTabs({ licitacao, initialTab }: { licitacao: any, initialTab: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const router = useRouter();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.replace(`?tab=${tab}`, { scroll: false });
  };

  const tabs = [
    { id: 'geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'analise', label: 'Análise LICIT.AI & Acervo', icon: Sparkles },
    { id: 'documentos', label: 'Documentos & Edital', icon: FileText },
    { id: 'recursos', label: 'Recursos & Prazos', icon: Scale },
    { id: 'equipe', label: 'Equipe Técnica', icon: Users },
  ];

  return (
    <div>
      {/* Navigation Tab Bar */}
      <div style={{ 
        borderBottom: '1px solid var(--border-color)', 
        marginBottom: '24px', 
        display: 'flex', 
        gap: '4px',
        overflowX: 'auto'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={17} style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-muted)' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="tab-content">
        {activeTab === 'geral' && <TabVisaoGeral licitacao={licitacao} />}
        {activeTab === 'analise' && <TabAnaliseIA licitacao={licitacao} />}
        {activeTab === 'documentos' && <TabDocumentos licitacao={licitacao} />}
        {activeTab === 'recursos' && <TabRecursos licitacao={licitacao} />}
        {activeTab === 'equipe' && <TabEquipe licitacao={licitacao} />}
      </div>
    </div>
  );
}

// ─── TAB 1: VISÃO GERAL ───────────────────────────────────────────
function TabVisaoGeral({ licitacao }: { licitacao: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          Ficha Técnica do Certame
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div>
            <div className="form-label">Objeto da Licitação</div>
            <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {licitacao.objeto}
            </p>
          </div>

          <div>
            <div className="form-label">Valor Estimado do Contrato</div>
            <div style={{ marginTop: '4px', fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }}>
              {licitacao.valorEstimado ? formatCurrency(licitacao.valorEstimado) : 'Sigiloso / Não informado'}
            </div>
            {licitacao.orcamentoSigiloso && (
              <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>* Orçamento sigiloso pela Lei 14.133</span>
            )}
          </div>

          <div>
            <div className="form-label">Sessão Pública de Disputa</div>
            <div style={{ marginTop: '4px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} style={{ color: 'var(--color-primary)' }} />
              {licitacao.dataHoraSessao ? new Date(licitacao.dataHoraSessao).toLocaleString('pt-BR') : 'Data a definir'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <div>
            <div className="form-label">Modalidade</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{licitacao.modalidade || 'Edital'}</div>
          </div>

          <div>
            <div className="form-label">Processo Administrativo</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{licitacao.numeroProcesso || 'Não informado'}</div>
          </div>

          <div>
            <div className="form-label">Plataforma / Portal</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {licitacao.plataformaUrl ? (
                <a href={licitacao.plataformaUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {licitacao.plataforma || 'Acessar Portal'} <ArrowUpRight size={14} />
                </a>
              ) : (
                licitacao.plataforma || 'Não informada'
              )}
            </div>
          </div>

          <div>
            <div className="form-label">Condicionantes de Habilitação</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: 'var(--radius-sm)', background: licitacao.permiteConsorcio ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: licitacao.permiteConsorcio ? '#34d399' : '#f87171' }}>
                {licitacao.permiteConsorcio ? '✓ Permite Consórcio' : '✕ Vedado Consórcio'}
              </span>
              <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: 'var(--radius-sm)', background: licitacao.exigeVisita ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', color: licitacao.exigeVisita ? '#fbbf24' : 'var(--text-secondary)' }}>
                {licitacao.exigeVisita ? '⚠ Visita Obrigatória' : 'Visita Facultativa'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: ANÁLISE LICIT.AI & REQUISITOS ─────────────────────────
function TabAnaliseIA({ licitacao }: { licitacao: any }) {
  const [analisando, setAnalisando] = useState(false);
  const [analiseData, setAnaliseData] = useState<any>(
    licitacao.analises && licitacao.analises.length > 0 ? licitacao.analises[0] : null
  );
  const [requisitos, setRequisitos] = useState<any[]>(licitacao.requisitos || []);

  const handleRunAnalysis = async () => {
    setAnalisando(true);
    try {
      const res = await fetch(`/api/licitacoes/${licitacao.id}/analise`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setAnaliseData(data);
        if (data.requisitos) {
          setRequisitos(data.requisitos);
        }
        window.location.reload();
      } else {
        alert('Erro ao executar análise');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao executar análise');
    } finally {
      setAnalisando(false);
    }
  };

  const updateRequisitoStatus = async (requisitoId: string, status: string) => {
    try {
      const res = await fetch(`/api/licitacoes/${licitacao.id}/requisitos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requisitoId, status }),
      });
      if (res.ok) {
        setRequisitos((prev) =>
          prev.map((r) => (r.id === requisitoId ? { ...r, status } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const parseJson = (str: any) => {
    if (!str) return [];
    if (typeof str !== 'string') return str;
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const riscos = parseJson(analiseData?.riscos);
  const proximosPassos = parseJson(analiseData?.proximosPassos);
  const timelineVoo = parseJson(analiseData?.timelineVoo);

  const isUfc = licitacao.organization?.name?.toLowerCase().includes('ufc');
  const empresaRoteada = isUfc ? 'UFC Engenharia' : 'Pórtico Construções';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={22} style={{ color: '#a855f7' }} />
            Agente LICIT.AI — Análise Editalícia & Qualificação Técnica
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Especialista na Lei 14.133/2021, jurisprudência do TCU e roteamento empresarial
          </p>
        </div>

        <button 
          onClick={handleRunAnalysis} 
          disabled={analisando}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {analisando ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Executando LICIT.AI...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Reanalisar Edital com IA
            </>
          )}
        </button>
      </div>

      {/* Roteamento Empresarial Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(107, 26, 42, 0.25) 0%, rgba(22, 22, 24, 0.9) 100%)', 
        border: '1px solid var(--border-color-accent)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)', fontWeight: 700 }}>
              Roteamento Empresarial Obrigatório
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              Natureza do Objeto: <span style={{ color: 'var(--text-secondary)' }}>{licitacao.tipoServico || 'Engenharia'}</span> ➔ Acervo Técnico Selecionado: <span style={{ color: '#4ade80' }}>{empresaRoteada}</span>
            </div>
          </div>
        </div>

        <span style={{ 
          fontSize: '0.78rem', 
          background: 'rgba(34, 197, 94, 0.15)', 
          color: '#34d399', 
          border: '1px solid rgba(34, 197, 94, 0.3)',
          padding: '4px 10px', 
          borderRadius: 'var(--radius-sm)',
          fontWeight: 600
        }}>
          Acervo Isolado e Rastreável
        </span>
      </div>

      {/* Decision Card & Executive Summary */}
      {analiseData && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          {/* Decision Box */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '28px 20px', gap: '10px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>
              Parecer Decisório LICIT.AI
            </div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 900, 
              color: '#34d399',
              background: 'rgba(34, 197, 94, 0.12)',
              padding: '6px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              GO
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Participação recomendável. Sem bloqueios críticos identificados.
            </p>
          </div>

          {/* Executive Summary */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>
              Resumo Executivo do Certame
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {analiseData.resumoExecutivo || 'Análise técnica concluída com sucesso.'}
            </p>
          </div>
        </div>
      )}

      {/* Timeline de Voo */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: '#fbbf24' }} />
          Timeline de Voo — Prazos Críticos do Certame (Lei 14.133/2021)
        </h3>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Evento do Certame</th>
                <th>Data Limite</th>
                <th>Horário</th>
                <th>Fundamento Legal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Limite para Pedido de Esclarecimento</td>
                <td><span style={{ color: '#fbbf24', fontWeight: 600 }}>3 dias úteis anteriores</span></td>
                <td>18:00</td>
                <td>Art. 164 da Lei 14.133/2021</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Limite para Impugnação do Edital</td>
                <td><span style={{ color: '#f87171', fontWeight: 600 }}>3 dias úteis anteriores</span></td>
                <td>18:00</td>
                <td>Art. 164 da Lei 14.133/2021</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Abertura da Sessão Pública de Disputa</td>
                <td><span style={{ color: '#60a5fa', fontWeight: 700 }}>{licitacao.dataHoraSessao ? formatDate(new Date(licitacao.dataHoraSessao)) : 'A definir'}</span></td>
                <td>{licitacao.dataHoraSessao ? new Date(licitacao.dataHoraSessao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                <td>Preâmbulo do Edital</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Matriz de Riscos Prioritários */}
      {riscos.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: '#f87171' }} />
            Matriz de Riscos Prioritários
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {riscos.map((r: any, idx: number) => (
              <div key={idx} style={{ 
                background: 'var(--bg-elevated)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                    {r.titulo || r.descricao}
                  </span>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 700, 
                    padding: '2px 8px', 
                    borderRadius: 'var(--radius-sm)',
                    background: r.gravidade === 'CRITICO' || r.severidade === 'CRITICO' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: r.gravidade === 'CRITICO' || r.severidade === 'CRITICO' ? '#f87171' : '#fbbf24'
                  }}>
                    {r.gravidade || r.severidade || 'ALTO'}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {r.descricao || r.impacto}
                </p>
                {(r.mitigacao || r.providencia) && (
                  <div style={{ fontSize: '0.8rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <strong>Ação Recomendada:</strong> {r.mitigacao || r.providencia}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requisitos Extraídos & Habilitação */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} style={{ color: '#34d399' }} />
          Requisitos de Habilitação & Checklist de Conformidade
        </h3>

        {requisitos.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Nenhum requisito extraído ainda. Clique em &quot;Reanalisar Edital com IA&quot; para extrair automaticamente.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descrição do Requisito</th>
                  <th>Fonte / Item</th>
                  <th>Status de Atendimento</th>
                  <th>Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {requisitos.map((req: any) => (
                  <tr key={req.id || req.descricao}>
                    <td>
                      <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                        {req.tipo}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: '400px' }}>
                      {req.descricao}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {req.fonte || 'Edital'}
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: 'var(--radius-sm)',
                        background: req.status === 'ATENDE' ? 'rgba(34, 197, 94, 0.15)' : (req.status === 'NAO_ATENDE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                        color: req.status === 'ATENDE' ? '#34d399' : (req.status === 'NAO_ATENDE' ? '#f87171' : '#fbbf24')
                      }}>
                        {req.status || 'NAO_ANALISADO'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => updateRequisitoStatus(req.id, 'ATENDE')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: '#34d399', fontSize: '0.75rem' }}
                          title="Marcar como Atende"
                        >
                          ✓ Atende
                        </button>
                        <button 
                          onClick={() => updateRequisitoStatus(req.id, 'DEPENDE_DILIGENCIA')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: '#fbbf24', fontSize: '0.75rem' }}
                          title="Depende de Diligência"
                        >
                          ? Diligência
                        </button>
                        <button 
                          onClick={() => updateRequisitoStatus(req.id, 'NAO_ATENDE')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: '#f87171', fontSize: '0.75rem' }}
                          title="Não Atende"
                        >
                          ✕ Gap
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB 3: DOCUMENTOS & EDITAL ──────────────────────────────────
function TabDocumentos({ licitacao }: { licitacao: any }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
        Documentos do Certame & Versões do Edital
      </h3>
      {licitacao.documentos?.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Nenhum arquivo anexado a esta licitação.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {licitacao.documentos?.map((doc: any) => (
            <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.nome}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.categoria} • {doc.status}</div>
              </div>
              <button className="btn btn-secondary btn-sm">Baixar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB 4: RECURSOS & PRAZOS ────────────────────────────────────
function TabRecursos({ licitacao }: { licitacao: any }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
        Casos de Recursos, Impugnações & Esclarecimentos
      </h3>
      {licitacao.recursosCasos?.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Nenhum recurso ou esclarecimento cadastrado para este certame.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {licitacao.recursosCasos?.map((r: any) => (
            <div key={r.id} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.tipo}: {r.resumo}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24' }}>Status: {r.status}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{r.fundamento}</p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Próxima Ação: {r.proximaAcao} • Responsável: {r.responsavel}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB 5: EQUIPE TÉCNICA ────────────────────────────────────────
function TabEquipe({ licitacao }: { licitacao: any }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
        Equipe Técnica e Profissionais Alocados
      </h3>
      {licitacao.equipe?.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Nenhum profissional vinculado a esta licitação.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {licitacao.equipe?.map((eq: any) => (
            <div key={eq.id} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{eq.professional?.nome}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{eq.funcaoProposta || eq.professional?.funcao}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {eq.professional?.conselho} nº {eq.professional?.numeroConselho}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
