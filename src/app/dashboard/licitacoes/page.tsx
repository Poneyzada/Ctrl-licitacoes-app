import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Search, Gavel, AlertTriangle, CheckCircle, Clock, Eye, Activity } from 'lucide-react';

export const metadata = { title: 'Licitações - LicitaControl' };

export default async function LicitacoesPage({ searchParams }: { searchParams: Promise<any> }) {
  await auth();
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams.status || 'ALL';
  const q = resolvedSearchParams.q || '';

  const whereClause: any = { deletedAt: null };
  if (status !== 'ALL') whereClause.status = status;
  if (q) {
    whereClause.OR = [
      { objeto: { contains: q, mode: 'insensitive' } },
      { orgaoNome: { contains: q, mode: 'insensitive' } },
      { numero: { contains: q, mode: 'insensitive' } },
    ];
  }

  const licitacoes = await prisma.licitacao.findMany({
    where: whereClause,
    include: {
      organization: true,
      consorcio: true,
      analises: { take: 1, orderBy: { createdAt: 'desc' } }
    },
    orderBy: { dataHoraSessao: 'asc' }
  });

  const totalAtivas = licitacoes.length;
  const emAtencao = licitacoes.filter((l) => l.risco === 'ALTO' || l.risco === 'CRITICO').length;
  const emAnalise = licitacoes.filter((l) => l.status === 'EM_ANALISE').length;
  const aprovadas = licitacoes.filter((l) => l.status === 'APROVADA' || l.status === 'EM_DISPUTA').length;

  return (
    <div className="animate-fade-in p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
            <Gavel size={28} /> Licitações
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie oportunidades, editais e disputas</p>
        </div>
        <Link href="/dashboard/licitacoes/novo" className="btn btn-primary flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus size={18} /> Nova Licitação
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-gray-500 text-sm font-medium">Total Ativas</div>
          <div className="text-2xl font-bold mt-1 text-gray-800">{totalAtivas}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-gray-500 text-sm font-medium flex items-center gap-1"><AlertTriangle size={14} className="text-orange-500"/> Em Atenção</div>
          <div className="text-2xl font-bold mt-1 text-orange-600">{emAtencao}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-gray-500 text-sm font-medium flex items-center gap-1"><Activity size={14} className="text-blue-500"/> Em Análise</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{emAnalise}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-gray-500 text-sm font-medium flex items-center gap-1"><CheckCircle size={14} className="text-green-500"/> Aprovadas / Disputa</div>
          <div className="text-2xl font-bold mt-1 text-green-600">{aprovadas}</div>
        </div>
      </div>

      <form className="flex flex-wrap gap-3 mb-6" action="/dashboard/licitacoes" method="GET">
        <div className="relative flex-grow max-w-md">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input type="text" name="q" defaultValue={q} placeholder="Buscar por objeto, órgão, número..." className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <select name="status" defaultValue={status} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="ALL">Status: Todos</option>
          <option value="PROSPECCAO">Prospecção</option>
          <option value="EM_ANALISE">Em Análise</option>
          <option value="APROVADA">Aprovada</option>
          <option value="EM_DISPUTA">Em Disputa</option>
          <option value="FINALIZADA">Finalizada</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 text-sm font-medium">Filtrar</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {licitacoes.map((lic) => (
          <div key={lic.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-5 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {lic.organization?.name || lic.consorcio?.name || 'Sem Empresa'}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${lic.risco === 'ALTO' || lic.risco === 'CRITICO' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                Risco: {lic.risco || 'N/A'}
              </span>
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{lic.orgaoNome} {lic.uf ? `- ${lic.uf}` : ''}</h3>
            <p className="text-sm font-medium text-gray-600 mb-3">{lic.modalidade || 'Modalidade N/A'} nº {lic.numero || 'S/N'}</p>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">{lic.objetoResumo || lic.objeto}</p>
            
            <div className="flex justify-between items-center text-sm mb-4">
              <div className="text-gray-700 font-medium">
                {lic.valorEstimado ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lic.valorEstimado) : 'Valor não informado'}
              </div>
              {lic.dataHoraSessao && (
                <div className="flex items-center text-orange-600 gap-1" title={new Date(lic.dataHoraSessao).toLocaleString('pt-BR')}>
                  <Clock size={14} /> 
                  {Math.max(0, Math.ceil((new Date(lic.dataHoraSessao).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} dias
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-auto border-t pt-4">
              <Link href={`/dashboard/licitacoes/${lic.id}`} className="flex-1 flex justify-center items-center gap-1 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded text-sm font-medium text-gray-700">
                <Eye size={16} /> Detalhes
              </Link>
              {lic.analises?.length > 0 ? (
                <Link href={`/dashboard/licitacoes/${lic.id}?tab=analise`} className="flex-1 flex justify-center items-center gap-1 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded text-sm font-medium text-purple-700">
                  <Activity size={16} /> IA Pronta
                </Link>
              ) : (
                <Link href={`/dashboard/licitacoes/${lic.id}?tab=analise`} className="flex-1 flex justify-center items-center gap-1 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-sm font-medium text-blue-700">
                  <Activity size={16} /> Análise IA
                </Link>
              )}
            </div>
          </div>
        ))}
        {licitacoes.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            Nenhuma licitação encontrada com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
}