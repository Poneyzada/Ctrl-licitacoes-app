import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { 
  Plus, Search, Gavel, AlertTriangle, CheckCircle2, 
  Clock, Eye, Sparkles, Building2, MapPin, 
  Layers, ShieldAlert, ArrowUpRight, Filter
} from 'lucide-react';

export const metadata = { title: 'Licitações | LicitaControl' };

export default async function LicitacoesPage({ searchParams }: { searchParams: Promise<any> }) {
  await auth();
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams.status || 'ALL';
  const empresa = resolvedSearchParams.empresa || 'ALL';
  const risco = resolvedSearchParams.risco || 'ALL';
  const q = resolvedSearchParams.q || '';

  const whereClause: any = { deletedAt: null };
  if (status !== 'ALL') whereClause.status = status;
  if (risco !== 'ALL') whereClause.risco = risco;
  if (empresa !== 'ALL') whereClause.organizationId = empresa;
  if (q) {
    whereClause.OR = [
      { objeto: { contains: q, mode: 'insensitive' } },
      { orgaoNome: { contains: q, mode: 'insensitive' } },
      { numero: { contains: q, mode: 'insensitive' } },
      { municipio: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [licitacoes, organizations] = await Promise.all([
    prisma.licitacao.findMany({
      where: whereClause,
      include: {
        organization: true,
        consorcio: true,
        requisitos: true,
        analises: { take: 1, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { dataHoraSessao: 'asc' }
    }),
    prisma.organization.findMany({
      where: { deletedAt: null, active: true },
      select: { id: true, name: true, tradeName: true }
    })
  ]);

  const totalAtivas = licitacoes.length;
  const emAtencao = licitacoes.filter((l) => l.risco === 'ALTO' || l.risco === 'CRITICO').length;
  const emAnalise = licitacoes.filter((l) => l.status === 'EM_ANALISE').length;
  const emDisputa = licitacoes.filter((l) => l.status === 'EM_DISPUTA' || l.status === 'APROVADA').length;
  const totalVolume = licitacoes.reduce((acc, l) => acc + (l.valorEstimado || 0), 0);

  const getRiscoBadge = (r: string | null) => {
    switch (r) {
      case 'CRITICO':
        return { label: 'Risco Crítico', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'ALTO':
        return { label: 'Risco Alto', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'MEDIO':
        return { label: 'Risco Médio', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      default:
        return { label: 'Risco Baixo', bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' };
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'EM_DISPUTA':
        return { label: 'Em Disputa', bg: 'rgba(232, 93, 93, 0.18)', color: '#e85d5d' };
      case 'APROVADA':
        return { label: 'Aprovada', bg: 'rgba(34, 197, 94, 0.18)', color: '#22c55e' };
      case 'EM_ANALISE':
        return { label: 'Em Análise', bg: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa' };
      case 'ATENCAO':
        return { label: 'Atenção', bg: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b' };
      case 'FINALIZADA':
        return { label: 'Finalizada', bg: 'rgba(168, 85, 247, 0.18)', color: '#c084fc' };
      default:
        return { label: s, bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' };
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gavel size={26} style={{ color: 'var(--color-primary)' }} />
            Licitações & Editais
          </h1>
          <p className="page-subtitle">
            Gestão centralizada de oportunidades, triagem com IA e controle de disputas
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/dashboard/licitacoes/novo" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            Nova Licitação
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(232, 93, 93, 0.12)', color: 'var(--color-primary)' }}>
            <Gavel size={22} />
          </div>
          <div className="stat-value">{totalAtivas}</div>
          <div className="stat-label">Licitações Monitoradas</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <Sparkles size={22} />
          </div>
          <div className="stat-value">{emAnalise}</div>
          <div className="stat-label">Em Análise Editalícia</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-value">{emDisputa}</div>
          <div className="stat-label">Aprovadas / Em Disputa</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <ShieldAlert size={22} />
          </div>
          <div className="stat-value">{emAtencao}</div>
          <div className="stat-label">Riscos em Atenção</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ marginBottom: '28px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <form method="GET" action="/dashboard/licitacoes" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              name="q" 
              defaultValue={q} 
              placeholder="Buscar por objeto, órgão, número do edital, cidade..." 
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', width: '100%' }}
            />
          </div>

          <select name="status" defaultValue={status} className="form-control" style={{ width: 'auto', height: '40px', minWidth: '150px' }}>
            <option value="ALL">Status: Todos</option>
            <option value="PROSPECCAO">Prospecção</option>
            <option value="EM_ANALISE">Em Análise</option>
            <option value="APROVADA">Aprovada</option>
            <option value="EM_DISPUTA">Em Disputa</option>
            <option value="FINALIZADA">Finalizada</option>
          </select>

          <select name="empresa" defaultValue={empresa} className="form-control" style={{ width: 'auto', height: '40px', minWidth: '170px' }}>
            <option value="ALL">Empresa: Todas</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.tradeName || org.name}</option>
            ))}
          </select>

          <select name="risco" defaultValue={risco} className="form-control" style={{ width: 'auto', height: '40px', minWidth: '140px' }}>
            <option value="ALL">Risco: Todos</option>
            <option value="BAIXO">Baixo</option>
            <option value="MEDIO">Médio</option>
            <option value="ALTO">Alto</option>
            <option value="CRITICO">Crítico</option>
          </select>

          <button type="submit" className="btn btn-secondary btn-sm" style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} />
            Filtrar
          </button>

          {(q || status !== 'ALL' || empresa !== 'ALL' || risco !== 'ALL') && (
            <Link href="/dashboard/licitacoes" className="btn btn-ghost btn-sm" style={{ height: '40px' }}>
              Limpar Filtros
            </Link>
          )}
        </form>
      </div>

      {/* Tenders Grid */}
      {licitacoes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Gavel size={44} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Nenhuma licitação encontrada</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Tente ajustar os termos de pesquisa ou cadastre uma nova oportunidade.
          </p>
          <Link href="/dashboard/licitacoes/novo" className="btn btn-primary btn-sm">
            <Plus size={16} /> Cadastrar Licitação
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {licitacoes.map((lic) => {
            const riskStyle = getRiscoBadge(lic.risco);
            const statusStyle = getStatusBadge(lic.status);
            const hasAi = lic.analises && lic.analises.length > 0;
            const sessionDate = lic.dataHoraSessao ? new Date(lic.dataHoraSessao) : null;
            const daysToSession = sessionDate ? Math.ceil((sessionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <div 
                key={lic.id} 
                className="licitacao-card"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  transition: 'all var(--transition-base)',
                  position: 'relative',
                }}
              >
                {/* Card Top Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        padding: '3px 8px', 
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(232, 93, 93, 0.12)',
                        color: 'var(--color-primary)',
                        border: '1px solid rgba(232, 93, 93, 0.25)'
                      }}
                    >
                      {lic.organization?.tradeName || lic.organization?.name || lic.consorcio?.name || 'Sem Empresa'}
                    </span>

                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        padding: '3px 8px', 
                        borderRadius: 'var(--radius-sm)',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                      }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  <span 
                    style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 600, 
                      padding: '3px 8px', 
                      borderRadius: 'var(--radius-sm)',
                      background: riskStyle.bg,
                      color: riskStyle.color,
                      border: `1px solid ${riskStyle.border}`
                    }}
                  >
                    {riskStyle.label}
                  </span>
                </div>

                {/* Organ & Identification */}
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '4px' }}>
                    {lic.orgaoNome}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{lic.modalidade || 'Edital'} nº {lic.numero || 'S/N'}</span>
                    {lic.uf && (
                      <span className="tag-location">
                        <MapPin size={12} /> {lic.municipio ? `${lic.municipio} - ` : ''}{lic.uf}
                      </span>
                    )}
                  </div>
                </div>

                {/* Objeto */}
                <p 
                  style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '3.8em'
                  }}
                >
                  {lic.objetoResumo || lic.objeto}
                </p>

                {/* Values & Session Timeline */}
                <div style={{ 
                  background: 'var(--bg-elevated)', 
                  padding: '12px 14px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      Valor Estimado
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>
                      {lic.valorEstimado ? formatCurrency(lic.valorEstimado) : 'Sigiloso / Não Inf.'}
                    </div>
                  </div>

                  {sessionDate && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                        Data da Sessão
                      </div>
                      <div style={{ 
                        fontSize: '0.82rem', 
                        fontWeight: 600, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        color: daysToSession !== null && daysToSession <= 5 ? '#f87171' : 'var(--text-primary)'
                      }}>
                        <Clock size={13} />
                        {formatDate(sessionDate)}
                        {daysToSession !== null && (
                          <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>({daysToSession}d)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI & Features Tag Bar */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {hasAi ? (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: '#a855f7', 
                      background: 'rgba(168, 85, 247, 0.12)', 
                      padding: '3px 8px', 
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600 
                    }}>
                      <Sparkles size={13} /> Análise IA Concluída
                    </span>
                  ) : (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: 'var(--text-muted)', 
                      background: 'rgba(255,255,255,0.04)', 
                      padding: '3px 8px', 
                      borderRadius: 'var(--radius-sm)' 
                    }}>
                      <Sparkles size={13} /> Aguardando IA
                    </span>
                  )}

                  {lic.requisitos && lic.requisitos.length > 0 && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: '#34d399', 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      padding: '3px 8px', 
                      borderRadius: 'var(--radius-sm)' 
                    }}>
                      <Layers size={13} /> {lic.requisitos.length} requisitos
                    </span>
                  )}
                </div>

                {/* Actions Footer */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <Link 
                    href={`/dashboard/licitacoes/${lic.id}`} 
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={15} /> Ver Ficha
                  </Link>

                  <Link 
                    href={`/dashboard/licitacoes/${lic.id}?tab=analise`} 
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Sparkles size={15} /> Análise IA
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Component Styles */}
      <style>{`
        .licitacao-card:hover {
          transform: translateY(-2px);
          border-color: rgba(232, 93, 93, 0.4) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}