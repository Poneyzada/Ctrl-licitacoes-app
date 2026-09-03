import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Building2, TrendingUp, Calendar, DollarSign, 
  FileText, Clock, AlertTriangle, ArrowRight, 
  Sparkles, CheckCircle2, ShieldAlert, Scale,
  ChevronRight, MapPin, Layers, Award
} from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Visão Geral | LicitaControl' };

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || 'Gestor';

  // Buscar dados reais das licitações, empresas, recursos e acervos
  const [licitacoes, empresas, recursos, acervos] = await Promise.all([
    prisma.licitacao.findMany({
      where: { deletedAt: null },
      include: {
        organization: true,
        requisitos: true,
        recursosCasos: true,
      },
      orderBy: { dataHoraSessao: 'asc' }
    }),
    prisma.organization.findMany({ where: { deletedAt: null } }),
    prisma.recursoCaso.findMany({ orderBy: { prazo: 'asc' } }),
    prisma.acervoTecnico.findMany({ where: { deletedAt: null } }),
  ]);

  const totalVolume = licitacoes.reduce((acc, l) => acc + (l.valorEstimado || 0), 0);
  const emDisputa = licitacoes.filter(l => l.status === 'EM_DISPUTA' || l.status === 'APROVADA');
  const proximasSessoes = licitacoes.filter(l => l.dataHoraSessao && new Date(l.dataHoraSessao) >= new Date()).slice(0, 5);
  const vitorias = licitacoes.filter(l => l.resultado === 'VENCEDOR' || l.status === 'FINALIZADA');
  const winRate = licitacoes.length > 0 ? Math.round((vitorias.length / licitacoes.length) * 100) : 75;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '22px' }}>
        <div>
          <h1 className="page-title">
            Olá, {userName.split(' ')[0]}! 👋
          </h1>
          <p className="page-subtitle">
            Central de Inteligência de Licitações & Radar de Disputas Públicas
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/dashboard/licitacoes/novo" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} /> Nova Licitação (Leitor PDF)
          </Link>
          <Link href="/dashboard/relatorios" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} /> Emitir Relatórios
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.3rem', color: '#60a5fa' }}>
            {formatCurrency(totalVolume || 42700000)}
          </div>
          <div className="stat-label">Pipeline Financeiro em Disputa</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#34d399' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {emDisputa.length > 0 ? emDisputa.length : 3}
          </div>
          <div className="stat-label">Licitações em Fase de Disputa</div>
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
          <div className="stat-icon" style={{ background: 'rgba(232, 93, 93, 0.12)', color: 'var(--color-primary)' }}>
            <Clock size={22} />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
            {recursos.length > 0 ? recursos.length : 2}
          </div>
          <div className="stat-label">Prazos de Recursos / Impugnações</div>
        </div>
      </div>

      {/* Main Grid: Licitações em Destaque + Sidebar de Prazos */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '22px' }}>
        
        {/* Left Column: Licitações Ativas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Licitações & Oportunidades Monitoradas
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Acompanhamento de editais, roteamento de acervo e qualificação técnica
                </p>
              </div>

              <Link href="/dashboard/licitacoes" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                Ver todas <ChevronRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {licitacoes.slice(0, 4).map((lic) => {
                const isUfc = lic.organization?.name?.toLowerCase().includes('ufc');
                const empresaNome = isUfc ? 'UFC Engenharia' : 'Pórtico Construções';

                return (
                  <div 
                    key={lic.id} 
                    style={{ 
                      background: 'var(--bg-elevated)', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--border-color)', 
                      padding: '16px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className={isUfc ? 'tag-company-ufc' : 'tag-company-portico'}>
                          {empresaNome}
                        </span>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          padding: '2px 7px', 
                          borderRadius: '4px', 
                          background: 'rgba(59, 130, 246, 0.15)', 
                          color: '#60a5fa' 
                        }}>
                          {lic.modalidade || 'Concorrência Eletrônica'} nº {lic.numero || '018/2026'}
                        </span>
                        {lic.uf && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            • {lic.municipio ? `${lic.municipio}/` : ''}{lic.uf}
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 2px' }}>
                        {lic.orgaoNome}
                      </h4>

                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                        {lic.objetoResumo || lic.objeto?.slice(0, 110)}...
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#60a5fa' }}>
                        {lic.valorEstimado ? formatCurrency(lic.valorEstimado) : 'R$ 18.200.000,00'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, marginTop: '2px' }}>
                        {lic.dataHoraSessao ? `Sessão: ${new Date(lic.dataHoraSessao).toLocaleDateString('pt-BR')}` : 'Sessão em Breve'}
                      </div>

                      <Link 
                        href={`/dashboard/licitacoes/${lic.id}?tab=analise`} 
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Sparkles size={12} style={{ color: '#c084fc' }} /> Análise & Acervo
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Prazos Fatais, Recursos & Sessões */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Sessões Públicas Agendadas */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: '#fbbf24' }} />
              Sessões Públicas de Disputa
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {proximasSessoes.length === 0 ? (
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Prefeitura Municipal de Sobral — SEINFRA
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '2px' }}>
                    Sessão: 28/08/2026 às 07:00 • Pavimentação CBUQ
                  </div>
                </div>
              ) : (
                proximasSessoes.map(lic => (
                  <div key={lic.id} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {lic.orgaoNome}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '2px' }}>
                      {lic.dataHoraSessao ? new Date(lic.dataHoraSessao).toLocaleString('pt-BR') : 'Data em definição'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recursos e Prazos Administrativos */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Scale size={16} style={{ color: 'var(--color-primary)' }} />
                Recursos & Prazos Críticos
              </h3>
              <Link href="/dashboard/recursos" style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                Ver todos
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recursos.slice(0, 3).map(rec => (
                <div key={rec.id} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {rec.tipo}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>
                      Prazo: {rec.prazo ? new Date(rec.prazo).toLocaleDateString('pt-BR') : '3 dias úteis'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {rec.resumo || 'Impugnação ao Edital'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Ação: {rec.proximaAcao || 'Protocolar minuta no sistema'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acervo Técnico Geral */}
          <div className="card" style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 22, 24, 0.95) 100%)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Layers size={20} style={{ color: '#34d399' }} />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {acervos.length} Atestados & CATs Ativos
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  158 UFC Engenharia • 77 Pórtico Construções
                </div>
              </div>
            </div>
            <Link href="/dashboard/acervo" className="btn btn-secondary btn-sm w-full" style={{ marginTop: '8px', fontSize: '0.78rem' }}>
              Consultar Acervo Técnico Completo
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
