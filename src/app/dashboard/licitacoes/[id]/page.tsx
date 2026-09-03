import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LicitacaoTabs from './LicitacaoTabs';
import { ArrowLeft, Gavel, MapPin, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default async function LicitacaoDetailsPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<any> 
}) {
  await auth();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const tab = resolvedSearchParams.tab || 'geral';

  const licitacao = await prisma.licitacao.findUnique({
    where: { id },
    include: {
      organization: {
        include: {
          acervo: { where: { deletedAt: null } },
          profissionais: { 
            where: { deletedAt: null },
            include: { acervos: { where: { deletedAt: null } } } 
          }
        }
      },
      consorcio: true,
      requisitos: { orderBy: { createdAt: 'asc' } },
      equipe: { include: { professional: { include: { acervos: { where: { deletedAt: null } } } } } },
      documentos: true,
      editalVersions: true,
      analises: { orderBy: { createdAt: 'desc' } },
      recursosCasos: { orderBy: { prazo: 'asc' } },
      followups: true,
      acervoMatches: { include: { acervo: true } }
    }
  });

  if (!licitacao) notFound();

  return (
    <div className="animate-fade-in">
      {/* Detail Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/dashboard/licitacoes" className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                padding: '3px 8px', 
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(232, 93, 93, 0.15)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(232, 93, 93, 0.3)'
              }}>
                {licitacao.organization?.tradeName || licitacao.organization?.name || 'Sem Empresa'}
              </span>

              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                padding: '3px 8px', 
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
              }}>
                {licitacao.status}
              </span>
            </div>
            <h1 className="page-title" style={{ fontSize: '1.4rem', lineHeight: 1.25 }}>
              {licitacao.orgaoNome}
            </h1>
            <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{licitacao.modalidade || 'Edital'} nº {licitacao.numero || 'S/N'}</span>
              {licitacao.uf && (
                <>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={13} /> {licitacao.municipio ? `${licitacao.municipio} - ` : ''}{licitacao.uf}
                  </span>
                </>
              )}
              {licitacao.valorEstimado && (
                <>
                  <span>•</span>
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>{formatCurrency(licitacao.valorEstimado)}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
      
      <LicitacaoTabs licitacao={licitacao} initialTab={tab} />
    </div>
  );
}