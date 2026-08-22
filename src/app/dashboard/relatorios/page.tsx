import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { 
  BarChart3, TrendingUp, PieChart, DollarSign, 
  Building2, Layers, CheckCircle2, ShieldAlert
} from 'lucide-react';

export const metadata = { title: 'Relatórios & Inteligência | LicitaControl' };

export default async function RelatoriosPage() {
  await auth();

  const [licitacoes, acervos, docs] = await Promise.all([
    prisma.licitacao.findMany({ where: { deletedAt: null } }),
    prisma.acervoTecnico.findMany({ where: { deletedAt: null } }),
    prisma.complianceDocument.findMany({ where: { deletedAt: null } }),
  ]);

  const totalVolume = licitacoes.reduce((acc, l) => acc + (l.valorEstimado || 0), 0);
  const emDisputaCount = licitacoes.filter(l => l.status === 'EM_DISPUTA' || l.status === 'APROVADA').length;
  const emAnaliseCount = licitacoes.filter(l => l.status === 'EM_ANALISE').length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={26} style={{ color: 'var(--color-primary)' }} />
            Relatórios & Indicadores Gerenciais
          </h1>
          <p className="page-subtitle">
            Métricas de desempenho de participação, volume financeiro disputado e acervo técnico
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.25rem', color: '#60a5fa' }}>
            {formatCurrency(totalVolume)}
          </div>
          <div className="stat-label">Pipeline Financeiro Monitorado</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#34d399' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>{emDisputaCount}</div>
          <div className="stat-label">Em Fase Ativa de Disputa</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
            <Layers size={22} />
          </div>
          <div className="stat-value">{acervos.length}</div>
          <div className="stat-label">Atestados / CATs Registrados</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-value">{docs.length}</div>
          <div className="stat-label">Certidões no Radar</div>
        </div>
      </div>

      {/* Structured Analytics Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>
            Distribuição por Modalidade de Licitação
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Concorrência Eletrônica (Lei 14.133)</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>75%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: '75%', height: '100%', background: 'var(--color-primary)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Pregão Eletrônico</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>25%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: '25%', height: '100%', background: '#60a5fa' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>
            Distribuição de Volume por Empresa
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>UFC Engenharia (Projetos / Hídricos / Supervisão)</span>
              <span style={{ fontWeight: 700, color: '#34d399' }}>R$ 24.500.000 (57%)</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: '57%', height: '100%', background: '#34d399' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Pórtico Construções (Obras / Pavimentação)</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>R$ 18.200.000 (43%)</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: '43%', height: '100%', background: '#fbbf24' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
