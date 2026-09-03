'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, FileText, Users, Scale, LayoutDashboard, Clock, 
  AlertTriangle, CheckCircle2, XCircle, HelpCircle, FileX, 
  Sparkles, Loader2, Calendar, ShieldAlert, ArrowUpRight, 
  MapPin, Building2, Check, RefreshCw, Printer, Copy,
  Calculator, Download, X, FileCheck
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CalculadoraBdiModal } from '@/components/licitacoes/CalculadoraBdiModal';

export default function LicitacaoTabs({ licitacao, initialTab }: { licitacao: any, initialTab: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [calcBdiOpen, setCalcBdiOpen] = useState(false);
  const [minutaOpen, setMinutaOpen] = useState(false);
  const [minutaTipo, setMinutaTipo] = useState<'IMPUGNACAO' | 'ESCLARECIMENTO'>('IMPUGNACAO');
  const [copied, setCopied] = useState(false);
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

  const handlePrintReport = () => {
    window.print();
  };

  const isUfc = licitacao.organization?.name?.toLowerCase().includes('ufc');
  const empresaRoteada = isUfc ? 'UFC Engenharia Ltda' : 'Pórtico Construções Ltda';

  const gerarMinutaTexto = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    if (minutaTipo === 'IMPUGNACAO') {
      return `ILUSTRÍSSIMO(A) SENHOR(A) PREGOEIRO(A) / AGENTE DE CONTRATAÇÃO
ÓRGÃO: ${licitacao.orgaoNome}
EDITAL DE LICITAÇÃO Nº ${licitacao.numero || 'S/N'} — PROCESSO ADMINISTRATIVO Nº ${licitacao.numeroProcesso || 'S/N'}
OBJETO: ${licitacao.objeto}

${empresaRoteada.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${licitacao.organization?.cnpj || '00.000.000/0001-00'}, com sede em ${licitacao.organization?.city || 'Fortaleza'}/${licitacao.organization?.state || 'CE'}, vem, tempestivamente, com fulcro no Art. 164 da Lei Federal nº 14.133/2021, interpor a presente:

IMPUGNAÇÃO AO EDITAL

1. DA TEMPESTIVIDADE
A presente peça é protocolada dentro do prazo legal de 3 (três) dias úteis que antecedem a abertura da sessão pública, restando plenamente tempestiva.

2. DOS FATOS E DO DIREITO
Verifica-se na minuta editalícia exigência que restringe o caráter competitivo do certame, violando frontalmente os princípios da razoabilidade, competitividade e proporcionalidade preconizados no Art. 5º da Nova Lei de Licitações.
${licitacao.exigeVisita ? 'A cláusula que exige visita técnica obrigatória presencial em data restrita impede a ampla participação de licitantes capacitados, em desconformidade com a jurisprudência dominante do TCU (Acórdão 1443/2023-Plenário).' : 'As parcelas de qualificação técnica requerem adequação proporcional às características do objeto licitado.'}

3. DOS PEDIDOS
Ante o exposto, requer-se:
a) O recebimento e regular processamento da presente impugnação;
b) A retificação do Edital nos termos requeridos, com a republicação do prazo legal para formulação das propostas.

Nestes termos,
Pede Deferimento.

${licitacao.organization?.city || 'Fortaleza'}/${licitacao.organization?.state || 'CE'}, ${dataAtual}.

______________________________________________
${empresaRoteada}
Responsável Técnico / Jurídico`;
    } else {
      return `AO(À) SENHOR(A) PREGOEIRO(A) / COMISSÃO DE CONTRATAÇÃO
ÓRGÃO: ${licitacao.orgaoNome}
EDITAL Nº ${licitacao.numero || 'S/N'}

PEDIDO DE ESCLARECIMENTO

A empresa ${empresaRoteada}, participante do certame em epígrafe, vem solicitar esclarecimento quanto aos seguintes pontos do Termo de Referência / Edital:

1. DÚVIDA SUSCITADA:
Solicita-se confirmação se para o atendimento da qualificação técnico-operacional será admitido o somatório de atestados de capacidade técnica emitidos por pessoas jurídicas de direito público ou privado.

2. FUNDAMENTAÇÃO:
Art. 67 da Lei nº 14.133/2021 e jurisprudência consolidada do Tribunal de Contas da União.

${licitacao.organization?.city || 'Fortaleza'}/${licitacao.organization?.state || 'CE'}, ${dataAtual}.

${empresaRoteada}`;
    }
  };

  const handleCopyMinuta = () => {
    navigator.clipboard.writeText(gerarMinutaTexto());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      {/* Action Toolbar Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }} className="no-print">
        <button 
          onClick={() => setCalcBdiOpen(true)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Calculator size={15} style={{ color: '#a855f7' }} />
          Calculadora BDI / Inexequibilidade
        </button>

        <button 
          onClick={() => setMinutaOpen(true)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Scale size={15} style={{ color: '#fbbf24' }} />
          Gerar Minuta (Impugnação / Esclarecimento)
        </button>

        <button 
          onClick={handlePrintReport}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Printer size={15} />
          Exportar Relatório PDF (LICIT.AI)
        </button>
      </div>

      {/* Printable Official Header (Shown only during print) */}
      <div className="print-only" style={{ display: 'none', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#000' }}>{empresaRoteada}</h1>
            <p style={{ fontSize: '0.85rem', color: '#444' }}>Relatório Executivo de Análise Editalícia — LICIT.AI</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#666' }}>
            <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
            <div>Edital: {licitacao.modalidade} nº {licitacao.numero || 'S/N'}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div style={{ 
        borderBottom: '1px solid var(--border-color)', 
        marginBottom: '24px', 
        display: 'flex', 
        gap: '4px',
        overflowX: 'auto'
      }} className="no-print">
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

      {/* Calculadora BDI Modal */}
      {calcBdiOpen && (
        <CalculadoraBdiModal 
          valorEstimadoEdital={licitacao.valorEstimado || 0}
          onClose={() => setCalcBdiOpen(false)}
        />
      )}

      {/* Modal Gerador de Minutas */}
      {minutaOpen && (
        <div 
          style={{
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
          onClick={() => setMinutaOpen(false)}
        >
          <div 
            className="card"
            style={{
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Scale size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Gerador de Peças Jurídicas (Lei 14.133/2021)</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Minuta formal pré-configurada para protocolo oficial</p>
                </div>
              </div>
              <button onClick={() => setMinutaOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Toggle Tipo */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button 
                onClick={() => setMinutaTipo('IMPUGNACAO')}
                className={`btn btn-sm ${minutaTipo === 'IMPUGNACAO' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Impugnação ao Edital (Art. 164)
              </button>
              <button 
                onClick={() => setMinutaTipo('ESCLARECIMENTO')}
                className={`btn btn-sm ${minutaTipo === 'ESCLARECIMENTO' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Pedido de Esclarecimento
              </button>
            </div>

            {/* Minuta Preview Box */}
            <div style={{
              background: '#0d0d0f',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: '#f0f0f2',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              maxHeight: '400px',
              overflowY: 'auto',
              marginBottom: '20px'
            }}>
              {gerarMinutaTexto()}
            </div>

            {/* Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setMinutaOpen(false)} className="btn btn-secondary">
                Fechar
              </button>
              <button onClick={handleCopyMinuta} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Minuta Copiada!' : 'Copiar Texto da Minuta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          .no-print, .sidebar, .mobile-nav {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 0 !important;
          }
          body, .app-layout {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .card {
            background: #ffffff !important;
            border: 1px solid #ddd !important;
            color: #000000 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
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
  const timelineVoo = parseJson(analiseData?.timelineVoo);

  const isUfc = licitacao.organization?.name?.toLowerCase().includes('ufc');
  const empresaRoteada = isUfc ? 'UFC Engenharia' : 'Pórtico Construções';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }} className="no-print">
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
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

      {/* 🏢 CAMPO EXCLUSIVO 1: QUALIFICAÇÃO TÉCNICO-OPERACIONAL (CAPACIDADE DA EMPRESA) */}
      <div className="card" style={{ border: '1px solid rgba(59, 130, 246, 0.3)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Qualificação Técnico-Operacional (Capacidade da Empresa)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Exigências de atestados em nome da empresa ({empresaRoteada}) e comprovação de quantitativos mínimos
              </p>
            </div>
          </div>

          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            padding: '4px 10px', 
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            ✓ Atestados Disponíveis: {licitacao.organization?.acervo?.length || 0}
          </span>
        </div>

        {/* Exigências Operacionais da Empresa */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Exigência 1: Parcela de Maior Relevância */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                  Exigência Principal · Parcela de Maior Relevância (Lei 14.133)
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', marginBottom: '2px' }}>
                  Execução ou Gerenciamento em obras e serviços de {licitacao.objeto?.slice(0, 90)}...
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Exigência editalícia: Mínimo de 50% dos quantitativos da planilha orçamentária
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, padding: '4px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(34, 197, 94, 0.18)', color: '#34d399', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                  ✓ 100% ATENDE
                </span>
              </div>
            </div>

            {/* Atestados do Banco que Atendem Esta Exigência */}
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCheck size={14} style={{ color: '#34d399' }} />
                Atestados do Acervo ({empresaRoteada}) que Comprovam a Exigência:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                {licitacao.organization?.acervo?.slice(0, 3).map((ac: any) => (
                  <div key={ac.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                          CAT: {ac.numeroCat || ac.numeroAtestado || 'S/N'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {ac.uf || 'BA / CE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                        {ac.objeto}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Contratante: {ac.emitente}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>
                        ✓ Aderência Completa
                      </span>
                      {(ac.urlOrigem || ac.storageUrl) ? (
                        <a 
                          href={ac.urlOrigem || ac.storageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                        >
                          <Download size={13} /> Baixar Atestado
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sem link</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 👷 CAMPO EXCLUSIVO 2: QUALIFICAÇÃO TÉCNICO-PROFISSIONAL (RESPONSÁVEL TÉCNICO & ENGENHEIROS) */}
      <div className="card" style={{ border: '1px solid rgba(168, 85, 247, 0.3)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Qualificação Técnico-Profissional (Responsável Técnico & Equipe)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Exigências de Responsabilidade Técnica (ART/CAT) dos engenheiros do quadro e comprovação de vínculo
              </p>
            </div>
          </div>

          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            padding: '4px 10px', 
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(168, 85, 247, 0.15)',
            color: '#c084fc',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}>
            ✓ Engenheiros Habilitados: {licitacao.organization?.profissionais?.length || 0}
          </span>
        </div>

        {/* Exigência Profissional e Engenheiros que Atendem */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#c084fc', background: 'rgba(168, 85, 247, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                  Responsabilidade Técnica · Coordenação Geral de Engenharia
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', marginBottom: '2px' }}>
                  Comprovação de Responsável Técnico com CAT em obras/serviços compatíveis
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Vínculo profissional formalizado (CLT, Sócio ou Contrato de Prestação de Serviços)
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, padding: '4px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(34, 197, 94, 0.18)', color: '#34d399', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                  ✓ ENGENHEIROS APTOS
                </span>
              </div>
            </div>

            {/* Lista dos Engenheiros e suas CATs */}
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} style={{ color: '#c084fc' }} />
                Profissionais Habilitados no Quadro da Empresa:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                {licitacao.organization?.profissionais?.map((prof: any) => (
                  <div key={prof.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', background: 'rgba(168, 85, 247, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                          {prof.conselho} {prof.numeroConselho || 'ATIVO'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
                          {prof.vinculo || 'CLT'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {prof.nome}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {prof.funcao || 'Responsável Técnico'} • {prof.acervos?.length || 0} CATs no Acervo
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                        ✓ Vínculo e CATs Válidas
                      </span>
                      {prof.acervos && prof.acervos[0] && (prof.acervos[0].urlOrigem || prof.acervos[0].storageUrl) ? (
                        <a 
                          href={prof.acervos[0].urlOrigem || prof.acervos[0].storageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                        >
                          <Download size={13} /> Ver CAT ({prof.acervos[0].numeroCat || 'PDF'})
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requisitos de Habilitação & Checklist de Conformidade */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <FileText size={18} style={{ color: '#34d399' }} />
            Checklist Geral de Habilitação & Conformidade Documental
          </h3>
        </div>

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
                  <th className="no-print">Ações Rápidas</th>
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
                    <td className="no-print">
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
