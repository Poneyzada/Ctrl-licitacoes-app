import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  CheckCircle2, Trophy, XCircle, FileText, 
  MapPin, Building2, TrendingUp, Filter, Search 
} from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Licitações Finalizadas | LicitaControl' };

export default async function FinalizadasPage() {
  await auth();

  const finalizadas = await prisma.licitacao.findMany({
    where: { 
      deletedAt: null,
      OR: [
        { status: 'FINALIZADA' },
        { status: 'ENCERRADA' },
        { resultado: { not: null } }
      ]
    },
    include: { organization: true },
    orderBy: { updatedAt: 'desc' }
  });

  const total = finalizadas.length;
  const ganhas = finalizadas.filter(f => f.resultado === 'VENCEDOR' || f.status === 'FINALIZADA').length;
  const volumeGanho = finalizadas
    .filter(f => f.resultado === 'VENCEDOR' || f.status === 'FINALIZADA')
    .reduce((acc, f) => acc + (f.valorFinal || f.valorEstimado || 0), 0);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={26} style={{ color: '#34d399' }} />
            Licitações Finalizadas & Histórico
          </h1>
          <p className="page-subtitle">
            Histórico completo de certames adjudicados, homologados e encerrados
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <FileText size={22} />
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">Certames Concluídos</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#34d399' }}>
            <Trophy size={22} />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>{ganhas}</div>
          <div className="stat-label">Licitações Vencidas</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.35rem', color: '#c084fc' }}>
            {formatCurrency(volumeGanho)}
          </div>
          <div className="stat-label">Volume Total Adjudicado</div>
        </div>
      </div>

      {/* List of Finalized Tenders */}
      {finalizadas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CheckCircle2 size={44} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Nenhum certame finalizado</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Os certames encerrados e homologados serão listados automaticamente nesta seção.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
          {finalizadas.map((lic) => (
            <div key={lic.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(34, 197, 94, 0.15)', color: '#34d399' }}>
                  ✓ {lic.resultado || 'HOMOLOGADO'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lic.updatedAt ? formatDate(new Date(lic.updatedAt)) : ''}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {lic.orgaoNome}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {lic.objetoResumo || lic.objeto}
              </p>

              <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valor Final Adjudicado</span>
                <span style={{ fontWeight: 800, color: '#34d399', fontSize: '1rem' }}>
                  {formatCurrency(lic.valorFinal || lic.valorEstimado || 0)}
                </span>
              </div>

              <Link href={`/dashboard/licitacoes/${lic.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
                Ver Detalhes do Certame
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
