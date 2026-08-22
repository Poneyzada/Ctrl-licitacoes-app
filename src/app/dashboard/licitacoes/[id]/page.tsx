import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LicitacaoTabs from './LicitacaoTabs';
import { ArrowLeft } from 'lucide-react';

export default async function LicitacaoDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<any> }) {
  await auth();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const tab = resolvedSearchParams.tab || 'geral';

  const licitacao = await prisma.licitacao.findUnique({
    where: { id },
    include: {
      organization: true,
      consorcio: true,
      requisitos: true,
      equipe: { include: { professional: true } },
      documentos: true,
      editalVersions: true,
      analises: { orderBy: { createdAt: 'desc' } },
      recursosCasos: true,
      followups: true,
    }
  });

  if (!licitacao) notFound();

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/licitacoes" className="btn btn-ghost p-2 rounded-full hover:bg-gray-200">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{licitacao.orgaoNome}</h1>
          <p className="text-sm text-gray-500">
            {licitacao.modalidade} nº {licitacao.numero} • Status: <span className="font-semibold text-blue-600">{licitacao.status}</span>
          </p>
        </div>
      </div>
      
      <LicitacaoTabs licitacao={licitacao} initialTab={tab} />
    </div>
  );
}