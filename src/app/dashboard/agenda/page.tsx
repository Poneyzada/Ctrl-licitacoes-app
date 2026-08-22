import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { 
  CalendarClock, Clock, AlertTriangle, CheckCircle2, 
  MapPin, Gavel, FileText, Plus, Bell, ShieldAlert
} from 'lucide-react';

export const metadata = { title: 'Agenda & Alertas | LicitaControl' };

export default async function AgendaPage() {
  await auth();

  const [licitacoesComSessao, recursosComPrazo, docsVencendo] = await Promise.all([
    prisma.licitacao.findMany({
      where: { deletedAt: null, dataHoraSessao: { not: null } },
      orderBy: { dataHoraSessao: 'asc' },
      take: 10
    }),
    prisma.recursoCaso.findMany({
      where: { prazo: { not: null }, status: { in: ['ABERTO', 'EM_ANDAMENTO'] } },
      include: { licitacao: true },
      orderBy: { prazo: 'asc' },
      take: 10
    }),
    prisma.complianceDocument.findMany({
      where: { deletedAt: null, vencimento: { not: null } },
      include: { organization: true },
      orderBy: { vencimento: 'asc' },
      take: 10
    })
  ]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarClock size={26} style={{ color: 'var(--color-primary)' }} />
            Agenda & Alertas em Tempo Real
          </h1>
          <p className="page-subtitle">
            Calendário integrado de sessões públicas de disputa, prazos recursais e vencimentos de habilitação
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        
        {/* Coluna 1: Sessões Públicas de Disputa */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gavel size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Sessões de Disputa</h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(232, 93, 93, 0.15)', color: 'var(--color-primary)' }}>
              {licitacoesComSessao.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {licitacoesComSessao.map((lic) => (
              <div key={lic.id} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60a5fa' }}>
                    {lic.dataHoraSessao ? new Date(lic.dataHoraSessao).toLocaleDateString('pt-BR') : ''} às {lic.dataHoraSessao ? new Date(lic.dataHoraSessao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                    {lic.modalidade || 'Edital'}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {lic.orgaoNome}
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Nº {lic.numero || 'S/N'} • {lic.plataforma || 'Portal Oficial'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 2: Prazos Fatais e Recursos */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: '#fbbf24' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Prazos Recursais & Impugnações</h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              {recursosComPrazo.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recursosComPrazo.map((r) => (
              <div key={r.id} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171' }}>
                    Limite: {r.prazo ? new Date(r.prazo).toLocaleString('pt-BR') : ''}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                    {r.tipo}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {r.licitacao?.orgaoNome}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {r.resumo}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 3: Alertas de Vencimento de Certidões */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ color: '#34d399' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Vencimento de Habilitação</h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(34, 197, 94, 0.15)', color: '#34d399' }}>
              {docsVencendo.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {docsVencendo.map((doc) => (
              <div key={doc.id} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {doc.nome}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: 'rgba(34, 197, 94, 0.12)', color: '#34d399' }}>
                    {doc.organization?.tradeName || 'Empresa'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {doc.emissor}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '4px', fontWeight: 600 }}>
                  Vencimento: {doc.vencimento ? formatDate(new Date(doc.vencimento)) : 'Indeterminado'}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
