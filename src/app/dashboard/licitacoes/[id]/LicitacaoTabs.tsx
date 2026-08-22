'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, FileText, Users, Scale, LayoutDashboard, Clock, AlertTriangle, CheckCircle, HelpCircle, FileX } from 'lucide-react';

export default function LicitacaoTabs({ licitacao, initialTab }: { licitacao: any, initialTab: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const router = useRouter();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.replace(`?tab=${tab}`, { scroll: false });
  };

  const tabs = [
    { id: 'geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'analise', label: 'Análise IA & Requisitos', icon: Bot },
    { id: 'documentos', label: 'Documentos & Edital', icon: FileText },
    { id: 'recursos', label: 'Recursos & Prazos', icon: Scale },
    { id: 'equipe', label: 'Equipe', icon: Users },
  ];

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="tab-content">
        {activeTab === 'geral' && <TabVisaoGeral licitacao={licitacao} />}
        {activeTab === 'analise' && <TabAnaliseIA licitacao={licitacao} />}
        {activeTab === 'documentos' && <TabDocumentos licitacao={licitacao} />}
        {activeTab === 'recursos' && <TabRecursos licitacao={licitacao} />}
        {activeTab === 'equipe' && <TabEquipe licitacao={licitacao} />}
      </div>
    </div>
  );
}

function TabVisaoGeral({ licitacao }: { licitacao: any }) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4">Ficha Técnica</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Objeto</h3>
          <p className="mt-1 text-sm">{licitacao.objeto}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Valor Estimado</h3>
          <p className="mt-1 text-lg font-bold">
            {licitacao.valorEstimado ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(licitacao.valorEstimado) : 'R$ ---'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Sessão Pública</h3>
          <p className="mt-1 text-sm font-medium">
            {licitacao.dataHoraSessao ? new Date(licitacao.dataHoraSessao).toLocaleString('pt-BR') : 'Data não informada'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Empresa Vinculada</h3>
          <p className="mt-1 text-sm">{licitacao.organization?.name || licitacao.consorcio?.name || 'Nenhuma'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Status</h3>
          <span className="mt-1 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {licitacao.status}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Condicionantes</h3>
          <ul className="mt-1 text-sm list-disc pl-4 text-gray-600">
            {licitacao.permiteConsorcio && <li>Permite Consórcio</li>}
            {licitacao.exigeVisita && <li>Exige Visita Técnica</li>}
            {licitacao.exigeGarantia && <li>Exige Garantia de Proposta</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TabAnaliseIA({ licitacao }: { licitacao: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const analise = licitacao.analises?.[0];

  const handleAnalise = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/licitacoes/${licitacao.id}/analise`, { method: 'POST' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Erro ao executar análise');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequisitoStatus = async (reqId: string, status: string) => {
    try {
      await fetch(`/api/licitacoes/${licitacao.id}/requisitos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requisitoId: reqId, status })
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (!analise && !loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
        <Bot size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Nenhuma Análise Disponível</h2>
        <p className="text-gray-500 mb-6">Execute a Inteligência Artificial para analisar o edital e extrair requisitos e riscos automaticamente.</p>
        <button onClick={handleAnalise} className="btn btn-primary px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium flex items-center justify-center gap-2 mx-auto">
          <Bot size={20} /> Executar Análise de IA
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-700">Analisando Edital com IA...</h2>
        <p className="text-gray-500 text-sm mt-2">Isso pode levar alguns segundos. Por favor, aguarde.</p>
      </div>
    );
  }

  // Parses
  let riscos = [];
  try { riscos = JSON.parse(analise.riscos || '[]'); } catch {}

  const recomendacaoStr = licitacao.observacoes?.match(/Recomendação - (.*?) \(/)?.[1] || 'INDETERMINADO';
  const scoreStr = licitacao.observacoes?.match(/Score: (.*?)\)/)?.[1] || '0';
  const score = parseInt(scoreStr, 10);
  
  let scoreColor = 'text-green-600 bg-green-50 border-green-200';
  if (score < 70) scoreColor = 'text-red-600 bg-red-50 border-red-200';
  else if (score < 85) scoreColor = 'text-orange-600 bg-orange-50 border-orange-200';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex gap-6 items-center">
          <div className={`p-4 rounded-full border-4 flex items-center justify-center h-24 w-24 flex-col ${scoreColor}`}>
            <span className="text-2xl font-bold">{score}%</span>
            <span className="text-[10px] uppercase font-bold text-gray-500">Score</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Recomendação IA</h3>
            <div className="text-2xl font-bold text-gray-900 mt-1">{recomendacaoStr.replace(/_/g, ' ')}</div>
          </div>
        </div>
        <button onClick={handleAnalise} className="text-purple-600 text-sm font-medium hover:underline flex items-center gap-1">
          <Bot size={16} /> Refazer Análise
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4">Requisitos de Habilitação</h2>
            {licitacao.requisitos.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum requisito extraído.</p>
            ) : (
              <ul className="space-y-3">
                {licitacao.requisitos.map((req: any) => (
                  <li key={req.id} className="flex justify-between items-start p-3 border rounded-md bg-gray-50">
                    <div>
                      <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded">{req.tipo}</span>
                      <p className="text-sm text-gray-800 mt-2">{req.descricao}</p>
                      <span className="text-xs text-gray-400">Ref: {req.fonte}</span>
                    </div>
                    <select
                      value={req.status}
                      onChange={(e) => handleRequisitoStatus(req.id, e.target.value)}
                      className={`text-sm rounded border-gray-300 font-medium ${
                        req.status === 'ATENDE' ? 'bg-green-100 text-green-800' :
                        req.status === 'NAO_ATENDE' ? 'bg-red-100 text-red-800' :
                        req.status === 'ATENDE_PARCIALMENTE' ? 'bg-yellow-100 text-yellow-800' :
                        req.status === 'DEPENDE_DILIGENCIA' ? 'bg-orange-100 text-orange-800' :
                        'bg-white text-gray-600'
                      }`}
                    >
                      <option value="NAO_ANALISADO">Não Analisado</option>
                      <option value="ATENDE">Atende</option>
                      <option value="ATENDE_PARCIALMENTE">Parcialmente</option>
                      <option value="NAO_ATENDE">Não Atende</option>
                      <option value="DEPENDE_DILIGENCIA">Diligência</option>
                    </select>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-red-600 flex items-center gap-2"><AlertTriangle size={20}/> Matriz de Riscos</h2>
            {riscos.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum risco crítico identificado.</p>
            ) : (
              <ul className="space-y-4">
                {riscos.map((r: any, idx: number) => (
                  <li key={idx} className="border-l-4 border-red-500 pl-3">
                    <h4 className="font-semibold text-sm text-gray-800">{r.titulo} <span className="text-[10px] bg-red-100 text-red-800 px-1 rounded ml-1">{r.gravidade}</span></h4>
                    <p className="text-xs text-gray-600 mt-1">{r.descricao}</p>
                    <div className="text-xs mt-1 bg-gray-100 p-1 rounded"><span className="font-semibold text-gray-700">Ação:</span> {r.mitigacao}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabDocumentos({ licitacao }: { licitacao: any }) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center text-gray-500">
      <FileX size={48} className="mx-auto mb-4 text-gray-300" />
      Nenhum documento anexado ainda.
    </div>
  );
}

function TabRecursos({ licitacao }: { licitacao: any }) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center text-gray-500">
      <HelpCircle size={48} className="mx-auto mb-4 text-gray-300" />
      Nenhum recurso ou esclarecimento registrado.
    </div>
  );
}

function TabEquipe({ licitacao }: { licitacao: any }) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center text-gray-500">
      <Users size={48} className="mx-auto mb-4 text-gray-300" />
      Nenhum membro da equipe alocado para esta licitação.
    </div>
  );
}
