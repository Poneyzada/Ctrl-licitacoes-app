"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, PieChart, DollarSign, 
  Building2, Layers, CheckCircle2, ShieldAlert, 
  Printer, Download, Filter, MapPin, Award, Scale,
  FileText, Calendar, Check, X, ArrowUpRight, Loader2, Globe
} from 'lucide-react';
import { formatCurrency, formatDate, getTipoServicoLabel, TIPOS_SERVICO_OPTIONS } from '@/lib/utils';

interface RegiaoInfo {
  nome: string;
  estados: string[];
  cor: string;
}

const REGIOES_BRASIL: Record<string, RegiaoInfo> = {
  'NORDESTE': {
    nome: 'Nordeste',
    estados: ['CE', 'BA', 'PE', 'RN', 'PB', 'MA', 'PI', 'AL', 'SE'],
    cor: 'var(--color-primary)'
  },
  'SUDESTE': {
    nome: 'Sudeste',
    estados: ['SP', 'RJ', 'MG', 'ES'],
    cor: '#3b82f6'
  },
  'SUL': {
    nome: 'Sul',
    estados: ['PR', 'SC', 'RS'],
    cor: '#10b981'
  },
  'CENTRO_OESTE': {
    nome: 'Centro-Oeste',
    estados: ['DF', 'GO', 'MT', 'MS'],
    cor: '#f59e0b'
  },
  'NORTE': {
    nome: 'Norte',
    estados: ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'],
    cor: '#8b5cf6'
  }
};

export default function RelatoriosPage() {
  const [licitacoes, setLicitacoes] = useState<any[]>([]);
  const [acervos, setAcervos] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros Interativos
  const [filtroMacroRegiao, setFiltroMacroRegiao] = useState('ALL');
  const [filtroEstado, setFiltroEstado] = useState('ALL');
  const [filtroEmpresa, setFiltroEmpresa] = useState('ALL');
  const [filtroStatus, setFiltroStatus] = useState('ALL');
  const [filtroTipoServico, setFiltroTipoServico] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resLic, resAc, resEmp] = await Promise.all([
        fetch('/api/licitacoes'),
        fetch('/api/acervo'),
        fetch('/api/empresas')
      ]);

      if (resLic.ok) setLicitacoes(await resLic.json());
      if (resAc.ok) setAcervos(await resAc.json());
      if (resEmp.ok) setEmpresas(await resEmp.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper para identificar a macrorregião a partir da UF
  const getRegiaoByUf = (uf: string): string => {
    for (const [regId, regInfo] of Object.entries(REGIOES_BRASIL)) {
      if (regInfo.estados.includes(uf)) return regId;
    }
    return 'NORDESTE';
  };

  // Filtragem dos dados
  const licitacoesFiltradas = licitacoes.filter(l => {
    const uf = l.uf || 'CE';
    const regiao = getRegiaoByUf(uf);

    const matchesMacro = filtroMacroRegiao === 'ALL' || regiao === filtroMacroRegiao;
    const matchesEstado = filtroEstado === 'ALL' || uf === filtroEstado;
    const matchesEmpresa = filtroEmpresa === 'ALL' || 
      (filtroEmpresa === 'UFC' && l.organization?.name?.toLowerCase().includes('ufc')) ||
      (filtroEmpresa === 'PORTICO' && (l.organization?.name?.toLowerCase().includes('pórtico') || l.organization?.name?.toLowerCase().includes('portico'))) ||
      (l.organizationId === filtroEmpresa);
    const matchesStatus = filtroStatus === 'ALL' || l.status === filtroStatus;
    const matchesTipo = filtroTipoServico === 'ALL' || l.tipoServico === filtroTipoServico;

    return matchesMacro && matchesEstado && matchesEmpresa && matchesStatus && matchesTipo;
  });

  const totalVolume = licitacoesFiltradas.reduce((acc, l) => acc + (l.valorEstimado || 0), 0);
  const vitorias = licitacoesFiltradas.filter(l => l.resultado === 'VENCEDOR' || l.status === 'FINALIZADA');
  const emDisputa = licitacoesFiltradas.filter(l => l.status === 'EM_DISPUTA' || l.status === 'APROVADA');
  const winRate = licitacoesFiltradas.length > 0 ? Math.round((vitorias.length / licitacoesFiltradas.length) * 100) : 80;

  // Agrupamento por Estado (UF)
  const estadosMap: Record<string, { count: number; volume: number; vitorias: number }> = {};
  licitacoesFiltradas.forEach(l => {
    const uf = l.uf || 'CE';
    if (!estadosMap[uf]) estadosMap[uf] = { count: 0, volume: 0, vitorias: 0 };
    estadosMap[uf].count += 1;
    estadosMap[uf].volume += l.valorEstimado || 0;
    if (l.resultado === 'VENCEDOR' || l.status === 'FINALIZADA') {
      estadosMap[uf].vitorias += 1;
    }
  });

  // Agrupamento por Região
  const regioesStats: Record<string, { count: number; volume: number; vitorias: number }> = {
    'NORDESTE': { count: 0, volume: 0, vitorias: 0 },
    'SUDESTE': { count: 0, volume: 0, vitorias: 0 },
    'SUL': { count: 0, volume: 0, vitorias: 0 },
    'CENTRO_OESTE': { count: 0, volume: 0, vitorias: 0 },
    'NORTE': { count: 0, volume: 0, vitorias: 0 },
  };

  licitacoes.forEach(l => {
    const reg = getRegiaoByUf(l.uf || 'CE');
    if (regioesStats[reg]) {
      regioesStats[reg].count += 1;
      regioesStats[reg].volume += l.valorEstimado || 0;
      if (l.resultado === 'VENCEDOR' || l.status === 'FINALIZADA') {
        regioesStats[reg].vitorias += 1;
      }
    }
  });

  // Função para exportar CSV formatado
  const exportCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(';')].concat(rows.map(r => r.join(';'))).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Download Relatório de Licitações por Região
  const handleDownloadLicitacoesRegiao = () => {
    const headers = ['ID', 'Orgao', 'Numero', 'UF', 'Regiao', 'Empresa', 'Tipo_Servico', 'Valor_Estimado_BRL', 'Status', 'Sessao'];
    const rows = licitacoesFiltradas.map(l => [
      l.id,
      `"${(l.orgaoNome || '').replace(/"/g, '""')}"`,
      `"${l.numero || 'S/N'}"`,
      l.uf || 'CE',
      REGIOES_BRASIL[getRegiaoByUf(l.uf || 'CE')]?.nome || 'Nordeste',
      `"${(l.organization?.tradeName || l.organization?.name || 'UFC').replace(/"/g, '""')}"`,
      getTipoServicoLabel(l.tipoServico),
      (l.valorEstimado || 0).toFixed(2),
      l.status,
      l.dataHoraSessao ? new Date(l.dataHoraSessao).toLocaleDateString('pt-BR') : '-'
    ]);
    exportCsv('relatorio_licitacoes_por_regiao', headers, rows);
  };

  // 2. Download Relatório de Parceiros por Região
  const handleDownloadParceirosRegiao = () => {
    const headers = ['Empresa', 'Nome_Fantasia', 'CNPJ', 'Tipo', 'UF', 'Cidade', 'Regiao', 'Atestados_Total'];
    const rows = empresas.map(e => [
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${(e.tradeName || '').replace(/"/g, '""')}"`,
      e.cnpj || '',
      e.type,
      e.state || 'CE',
      e.city || 'Fortaleza',
      REGIOES_BRASIL[getRegiaoByUf(e.state || 'CE')]?.nome || 'Nordeste',
      e._count?.acervo || 0
    ]);
    exportCsv('relatorio_parceiros_por_regiao', headers, rows);
  };

  // 3. Download Relatório de Êxito por Região
  const handleDownloadExitoRegiao = () => {
    const headers = ['Regiao', 'Total_Disputadas', 'Vitorias_Exito', 'Volume_Total_BRL', 'Taxa_Exito_Pct'];
    const rows = Object.entries(regioesStats).map(([regId, stat]) => {
      const taxa = stat.count > 0 ? Math.round((stat.vitorias / stat.count) * 100) : 0;
      return [
        REGIOES_BRASIL[regId]?.nome || regId,
        stat.count,
        stat.vitorias,
        stat.volume.toFixed(2),
        `${taxa}%`
      ];
    });
    exportCsv('relatorio_taxa_exito_por_regiao', headers, rows);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '22px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={26} style={{ color: 'var(--color-primary)' }} />
            Relatórios Regionais & Inteligência de Disputas
          </h1>
          <p className="page-subtitle">
            Mapeamento nacional de certames, parceiros por região, taxas de êxito e exportações para coordenadores
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} className="no-print">
          <button 
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Central de Downloads Segmentados por Região */}
      <div className="card no-print" style={{ padding: '18px 20px', marginBottom: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-color-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Download size={18} style={{ color: '#34d399' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Exportação de Relatórios Segmentados (CSV / Excel para Coordenação Regional)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <button 
            onClick={handleDownloadLicitacoesRegiao}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', fontSize: '0.85rem' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: '#60a5fa' }} />
              1. Licitações por Região
            </span>
            <Download size={14} />
          </button>

          <button 
            onClick={handleDownloadParceirosRegiao}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', fontSize: '0.85rem' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} style={{ color: '#fbbf24' }} />
              2. Parceiros & Empresas por Região
            </span>
            <Download size={14} />
          </button>

          <button 
            onClick={handleDownloadExitoRegiao}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', fontSize: '0.85rem' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={16} style={{ color: '#34d399' }} />
              3. Taxa de Êxito (Disputadas vs Vencidas)
            </span>
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MAPA INTERATIVO NACIONAL DO BRASIL (VETORIAL SVG PURO)     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '22px', marginBottom: '24px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={20} style={{ color: 'var(--color-primary)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Mapa de Atuação Nacional & Distribuição Regional
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Clique em uma região ou estado para filtrar todos os indicadores analíticos do painel
              </p>
            </div>
          </div>

          {(filtroMacroRegiao !== 'ALL' || filtroEstado !== 'ALL') && (
            <button 
              onClick={() => { setFiltroMacroRegiao('ALL'); setFiltroEstado('ALL'); }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              Resetar Filtro do Mapa (Ver Brasil Todo)
            </button>
          )}
        </div>

        {/* Seletor Rápido de Macrorregiões */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {Object.entries(REGIOES_BRASIL).map(([regId, reg]) => {
            const stat = regioesStats[regId] || { count: 0, volume: 0 };
            const isActive = filtroMacroRegiao === regId;
            return (
              <div 
                key={regId}
                onClick={() => {
                  if (filtroMacroRegiao === regId) {
                    setFiltroMacroRegiao('ALL');
                    setFiltroEstado('ALL');
                  } else {
                    setFiltroMacroRegiao(regId);
                    setFiltroEstado('ALL');
                  }
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(232, 93, 93, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem', color: isActive ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                    Região {reg.nome}
                  </strong>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: reg.cor }}>
                    {stat.count} {stat.count === 1 ? 'edital' : 'editais'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600, marginTop: '4px' }}>
                  {formatCurrency(stat.volume)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {reg.estados.join(', ')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Visualizador de Estados Ativos */}
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.2)', 
          padding: '16px', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginRight: '6px' }}>Estados com atuação:</span>
          {['CE', 'BA', 'PE', 'RN', 'PB', 'PI', 'MA', 'SP', 'RJ', 'MG', 'DF', 'GO', 'AM', 'PA', 'PR', 'SC', 'RS'].map(uf => {
            const hasData = estadosMap[uf];
            const isSelected = filtroEstado === uf;
            return (
              <button
                key={uf}
                onClick={() => setFiltroEstado(isSelected ? 'ALL' : uf)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--color-primary)' : hasData ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)',
                  background: isSelected ? 'var(--color-primary)' : hasData ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  color: isSelected ? '#fff' : hasData ? '#60a5fa' : 'var(--text-muted)'
                }}
              >
                {uf} {hasData ? `(${hasData.count})` : ''}
              </button>
            );
          })}
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
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
              {empresas.filter(e => !e.name.toLowerCase().includes('ufc') && !e.name.toLowerCase().includes('pórtico')).map(e => (
                <option key={e.id} value={e.id}>{e.tradeName || e.name}</option>
              ))}
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
              <option value="EM_DISPUTA">Em Disputa</option>
              <option value="APROVADA">Aprovadas para Participação</option>
              <option value="EM_ANALISE">Em Análise Técnica</option>
              <option value="FINALIZADA">Finalizadas Vencedoras</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Tipo de Serviço / Obra</label>
            <select 
              value={filtroTipoServico} 
              onChange={(e) => setFiltroTipoServico(e.target.value)}
              className="form-control"
              style={{ height: '38px', fontSize: '0.85rem' }}
            >
              <option value="ALL">Todas as Categorias</option>
              {TIPOS_SERVICO_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
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
            {licitacoesFiltradas.length}
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
          <div className="stat-label">Taxa de Êxito Histórico</div>
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

      {/* Tabela Detalhada dos Certames Selecionados */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: '#34d399' }} />
            Demonstrativo das Licitações Filtradas
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Total listado: {licitacoesFiltradas.length} certames
          </span>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Órgão Licitante</th>
                <th>Empresa Roteada</th>
                <th>UF / Região</th>
                <th>Objeto & Tipo</th>
                <th>Valor Estimado</th>
                <th>Sessão</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {licitacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Nenhuma licitação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                licitacoesFiltradas.map((lic) => {
                  const reg = REGIOES_BRASIL[getRegiaoByUf(lic.uf || 'CE')]?.nome || 'Nordeste';
                  return (
                    <tr key={lic.id}>
                      <td>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block' }}>
                          {lic.orgaoNome}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Edital nº {lic.numero || 'S/N'}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          padding: '2px 8px', 
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)'
                        }}>
                          {lic.organization?.tradeName || lic.organization?.name || 'UFC'}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#60a5fa' }}>
                          <MapPin size={12} /> {lic.uf || 'CE'} ({reg})
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lic.objetoResumo || lic.objeto}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {getTipoServicoLabel(lic.tipoServico)}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.85rem', color: '#60a5fa' }}>
                          {formatCurrency(lic.valorEstimado || 0)}
                        </strong>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {lic.dataHoraSessao ? formatDate(lic.dataHoraSessao) : 'A definir'}
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '3px 8px', 
                          borderRadius: 'var(--radius-sm)',
                          background: lic.status === 'EM_DISPUTA' ? 'rgba(232, 93, 93, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: lic.status === 'EM_DISPUTA' ? 'var(--color-primary)' : '#34d399'
                        }}>
                          {lic.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
