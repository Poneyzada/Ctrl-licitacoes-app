import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { 
  Inbox, Sparkles, Building2, ExternalLink, Check, 
  X, ArrowRight, Filter, Search, Clock, MapPin, Layers
} from 'lucide-react';

export const metadata = { title: 'Entrada AXXIA & PNCP | LicitaControl' };

export default async function AxxiaPage() {
  await auth();

  // Fetch captured opportunities from PNCP / AXXIA
  const oportunidades = await prisma.pncpOportunidade.findMany({
    orderBy: { captadoEm: 'desc' }
  });

  const totalNovas = oportunidades.filter(o => o.status === 'NOVA').length;
  const recomendadasUfc = oportunidades.filter(o => o.recomendacao === 'UFC').length;
  const recomendadasPortico = oportunidades.filter(o => o.recomendacao === 'PORTICO').length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Inbox size={26} style={{ color: 'var(--color-primary)' }} />
            Entrada de Oportunidades AXXIA & PNCP
          </h1>
          <p className="page-subtitle">
            Triagem automatizada de editais captados com roteamento inteligente para UFC e Pórtico
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(232, 93, 93, 0.12)', color: 'var(--color-primary)' }}>
            <Inbox size={22} />
          </div>
          <div className="stat-value">{oportunidades.length}</div>
          <div className="stat-label">Total de Oportunidades Captadas</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <Sparkles size={22} />
          </div>
          <div className="stat-value">{totalNovas}</div>
          <div className="stat-label">Aguardando Triagem</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#34d399' }}>
            <Building2 size={22} />
          </div>
          <div className="stat-value">{recomendadasUfc}</div>
          <div className="stat-label">Alvo: UFC Engenharia</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <Building2 size={22} />
          </div>
          <div className="stat-value">{recomendadasPortico}</div>
          <div className="stat-label">Alvo: Pórtico Construções</div>
        </div>
      </div>

      {/* Oportunidades List */}
      {oportunidades.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Inbox size={44} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Fila de Entrada Atualizada</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Não há novos editais pendentes na fila AXXIA no momento.
          </p>
          <Link href="/dashboard/licitacoes/novo" className="btn btn-primary btn-sm">
            Cadastrar Manualmente
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {oportunidades.map((op) => (
            <div 
              key={op.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '22px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 700, 
                  padding: '3px 8px', 
                  borderRadius: 'var(--radius-sm)',
                  background: op.recomendacao === 'UFC' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: op.recomendacao === 'UFC' ? '#34d399' : '#fbbf24'
                }}>
                  ➔ Alvo Recomendado: {op.recomendacao === 'UFC' ? 'UFC Engenharia' : 'Pórtico Construções'}
                </span>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Captado {formatDate(new Date(op.captadoEm))}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                  {op.orgao}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{op.modalidade || 'Edital'}</span>
                  {op.uf && (
                    <>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <MapPin size={12} /> {op.municipio ? `${op.municipio} - ` : ''}{op.uf}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {op.objeto}
              </p>

              <div style={{ background: 'var(--bg-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Valor Estimado</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>
                    {op.valorEstimado ? formatCurrency(op.valorEstimado) : 'Não informado'}
                  </div>
                </div>

                {op.dataHoraSessao && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Abertura</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatDate(new Date(op.dataHoraSessao))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: 'auto' }}>
                <a 
                  href={op.pncpUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={14} /> Ver no PNCP
                </a>

                <Link 
                  href={`/dashboard/licitacoes/novo`}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Check size={14} /> Importar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
