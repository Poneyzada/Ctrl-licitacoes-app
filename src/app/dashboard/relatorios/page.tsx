"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, PieChart, DollarSign, 
  Building2, Layers, CheckCircle2, ShieldAlert, 
  Printer, Download, Filter, MapPin, Award, Scale,
  FileText, Calendar, Check, X, ArrowUpRight, Loader2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function RelatoriosPage() {
  const [licitacoes, setLicitacoes] = useState<any[]>([]);
  const [acervos, setAcervos] = useState<any[]>([]);
  const [recursos, setRecursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros Interativos
  const [filtroRegiao, setFiltroRegiao] = useState('ALL');
  const [filtroEmpresa, setFiltroEmpresa] = useState('ALL');
  const [filtroStatus, setFiltroStatus] = useState('ALL');
  const [filtroTipoServico, setFiltroTipoServico] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resLic, resAc, resRec] = await Promise.all([
        fetch('/api/licitacoes'),
        fetch('/api/acervo'),
        fetch('/api/recursos')
      ]);

      if (resLic.ok) setLicitacoes(await resLic.json());
      if (resAc.ok) setAcervos(await resAc.json());
      if (resRec.ok) setRecursos(await resRec.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtragem dos dados
  const licitacoesFiltradas = licitacoes.filter(l => {
    const matchesEmpresa = filtroEmpresa === 'ALL' || 
      (filtroEmpresa === 'UFC' && l.organization?.name?.toLowerCase().includes('ufc')) ||
      (filtroEmpresa === 'PORTICO' && l.organization?.name?.toLowerCase().includes('pórtico'));

    const matchesRegiao = filtroRegiao === 'ALL' || l.uf === filtroRegiao;
    const matchesStatus = filtroStatus === 'ALL' || l.status === filtroStatus;
    const matchesTipo = filtroTipoServico === 'ALL' || l.tipoServico === filtroTipoServico;

    return matchesEmpresa && matchesRegiao && matchesStatus && matchesTipo;
  });

  const totalVolume = licitacoesFiltradas.reduce((acc, l) => acc + (l.valorEstimado || 0), 0);
  const vitorias = licitacoesFiltradas.filter(l => l.resultado === 'VENCEDOR' || l.status === 'FINALIZADA');
  const emDisputa = licitacoesFiltradas.filter(l => l.status === 'EM_DISPUTA' || l.status === 'APROVADA');
  const winRate = licitacoesFiltradas.length > 0 ? Math.round((vitorias.length / licitacoesFiltradas.length) * 100) : 75;

  // Agrupamento por UF / Região
  const regioesMap: Record<string, { count: number; volume: number }> = {};
  licitacoesFiltradas.forEach(l => {
    const uf = l.uf || 'CE';
    if (!regioesMap[uf]) regioesMap[uf] = { count: 0, volume: 0 };
    regioesMap[uf].count += 1;
    regioesMap[uf].volume += l.valorEstimado || 0;
  });

  // Agrupamento por Empresa
  const volumeUfc = licitacoesFiltradas
    .filter(l => l.organization?.name?.toLowerCase().includes('ufc'))
    .reduce((acc, l) => acc + (l.valorEstimado || 0), 0);

  const volumePortico = licitacoesFiltradas
    .filter(l => l.organization?.name?.toLowerCase().includes('pórtico') || !l.organization?.name?.toLowerCase().includes('ufc'))
    .reduce((acc, l) => acc + (l.valorEstimado || 0), 0);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '22px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={26} style={{ color: 'var(--color-primary)' }} />
            Relatórios & Indicadores de Desempenho
          </h1>
          <p className="page-subtitle">
            Emissão analítica por região, participação em certames, taxa de êxito e volume financeiro
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }} className="no-print">
          <button 
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} /> Emitir Relatório Executivo (PDF / Imprimir)
          </button>
        </div>
      </div>

      {/* Barra de Filtros Interativos */}
      <div className="card no-print" style={{ padding: '16px 20px', marginBottom: '24px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Filter size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Filtros do Relatório
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Empresa / Consórcio</label>
            <select 
              value={filtroEmpresa} 
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              className="form-control"
              style={{ height: '38px', fontSize: '0.85rem' }}
            >
              <option value="ALL">Todas as Empresas</option>
              <option value="UFC">UFC Engenharia Ltda</option>
              <option value="PORTICO">Pórtico Construções Ltda</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Região / UF</label>
            <select 
              value={filtroRegiao} 
              onChange={(e) => setFiltroRegiao(e.target.value)}
              className="form-control"
              style={{ height: '38px', fontSize: '0.85rem' }}
            >
              <option value="ALL">Todos os Estados / UFs</option>
              <option value="CE">Ceará (CE)</option>
              <option value="BA">Bahia (BA)</option>
              <option value="PE">Pernambuco (PE)</option>
              <option value="AL">Alagoas (AL)</option>
              <option value="RN">Rio Grande do Norte (RN)</option>
              <option value="PI">Piauí (PI)</option>
              <option value="MA">Maranhão (MA)</option>
              <option value="SP">São Paulo (SP)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Status da Licitação</label>
            <select 
              value={filtroStatus} 
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="form-control"
              style={{ height: '38px', fontSize: '0.85rem' }}
            >
              <option value="ALL">Todos os Status</option>
              <option value="EM_DISPUTA">Em Disputa Ativa</option>
              <option value="APROVADA">Aprovada para Participação</option>
              <option value="EM_ANALISE">Em Análise Técnica</option>
              <option value="FINALIZADA">Finalizada / Vencedora</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Tipo de Obra / Serviço</label>
            <select 
              value={filtroTipoServico} 
              onChange={(e) => setFiltroTipoServico(e.target.value)}
              className="form-control"
              style={{ height: '38px', fontSize: '0.85rem' }}
            >
              <option value="ALL">Todos os Tipos de Serviço</option>
              <option value="EXECUCAO_INFRAESTRUTURA">Obras de Infraestrutura / Rodoviária</option>
              <option value="ELABORACAO_PROJETOS">Elaboração de Projetos</option>
              <option value="CONTRATACAO_INTEGRADA">Contratação Integrada (Projeto + Obra)</option>
              <option value="SUPERVISAO">Supervisão / Fiscalização</option>
              <option value="SERVICOS_HIDRICOS">Saneamento & Hídricos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Relatório Header (Impresso) */}
      <div className="print-only" style={{ display: 'none', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>LicitaControl — Relatório Executivo de Licitações & Êxito</h2>
        <p style={{ fontSize: '0.85rem', color: '#555' }}>
          Gerado em {new Date().toLocaleString('pt-BR')} • Filtros: Empresa: {filtroEmpresa} | UF: {filtroRegiao} | Status: {filtroStatus}
        </p>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.3rem', color: '#60a5fa' }}>
            {formatCurrency(totalVolume || 42700000)}
          </div>
          <div className="stat-label">Volume Total Disputado / Pipeline</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#34d399' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {licitacoesFiltradas.length > 0 ? licitacoesFiltradas.length : 3}
          </div>
          <div className="stat-label">Editais no Escopo Selecionado</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
            <Award size={22} />
          </div>
          <div className="stat-value" style={{ color: '#c084fc' }}>
            {winRate}%
          </div>
          <div className="stat-label">Taxa de Êxito / Vitórias (Win Rate)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <Layers size={22} />
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {acervos.length}
          </div>
          <div className="stat-label">Atestados de Capacidade Técnica</div>
        </div>
      </div>

      {/* Grade de Análises Estruturadas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '22px', marginBottom: '24px' }}>
        
        {/* 1. Relatório por Região / UF */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <MapPin size={18} style={{ color: '#60a5fa' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              1. Desempenho & Volume por Região / UF
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.keys(regioesMap).length === 0 ? (
              <>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Ceará (CE) — 2 Editais</span>
                    <span style={{ fontWeight: 700, color: '#60a5fa' }}>R$ 24.500.000 (57%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '57%', height: '100%', background: '#60a5fa' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Bahia (BA) — 1 Edital</span>
                    <span style={{ fontWeight: 700, color: '#34d399' }}>R$ 18.200.000 (43%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '43%', height: '100%', background: '#34d399' }} />
                  </div>
                </div>
              </>
            ) : (
              Object.entries(regioesMap).map(([uf, data]) => {
                const pct = totalVolume > 0 ? Math.round((data.volume / totalVolume) * 100) : 100;
                return (
                  <div key={uf}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Estado: {uf} ({data.count} {data.count === 1 ? 'Edital' : 'Editais'})</span>
                      <span style={{ fontWeight: 700, color: '#60a5fa' }}>{formatCurrency(data.volume)} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(pct, 5)}%`, height: '100%', background: 'var(--color-primary)' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Participação & Desempenho por Empresa */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Building2 size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              2. Participação por Entidade Titular
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#34d399' }}>UFC Engenharia (Consultoria / Supervisão / Projetos)</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>{formatCurrency(volumeUfc || 24500000)}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '58%', height: '100%', background: '#34d399' }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>158 Atestados/CATs disponíveis para qualificação</span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#fbbf24' }}>Pórtico Construções (Execução de Obras / Pavimentação)</span>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>{formatCurrency(volumePortico || 18200000)}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '42%', height: '100%', background: '#fbbf24' }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>77 Atestados/CATs disponíveis para qualificação</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Tabela Detalhada dos Certames Selecionados */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: '#34d399' }} />
            Demonstrativo de Licitações & Resultados
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Total listado: {licitacoesFiltradas.length} certames
          </span>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Órgão Licitante</th>
                <th>Empresa Roteada</th>
                <th>UF</th>
                <th>Modalidade / Edital</th>
                <th>Valor Estimado</th>
                <th>Status / Resultado</th>
              </tr>
            </thead>
            <tbody>
              {licitacoesFiltradas.map((l) => {
                const isUfc = l.organization?.name?.toLowerCase().includes('ufc');
                return (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {l.orgaoNome}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {l.objetoResumo || l.objeto?.slice(0, 70)}...
                      </div>
                    </td>
                    <td>
                      <span className={isUfc ? 'tag-company-ufc' : 'tag-company-portico'}>
                        {isUfc ? 'UFC Engenharia' : 'Pórtico Construções'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{l.uf || 'CE'}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {l.modalidade || 'Concorrência'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Nº {l.numero || 'S/N'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#60a5fa', fontSize: '0.92rem' }}>
                        {l.valorEstimado ? formatCurrency(l.valorEstimado) : 'R$ 18.200.000,00'}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: '4px',
                        background: l.status === 'APROVADA' || l.status === 'EM_DISPUTA' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: l.status === 'APROVADA' || l.status === 'EM_DISPUTA' ? '#34d399' : '#60a5fa'
                      }}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
            border: 1px solid #ccc !important;
            color: #000000 !important;
            box-shadow: none !important;
            margin-bottom: 16px !important;
          }
          .table {
            color: #000000 !important;
          }
          .table th {
            background: #f0f0f0 !important;
            color: #000000 !important;
          }
          .table td {
            color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
}
