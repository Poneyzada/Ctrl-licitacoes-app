'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NovaLicitacaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationId: '',
    orgaoNome: '',
    orgaoUasg: '',
    municipio: '',
    uf: '',
    modalidade: '',
    numero: '',
    numeroProcesso: '',
    plataforma: '',
    plataformaUrl: '',
    objeto: '',
    objetoResumo: '',
    tipoServico: '',
    dataHoraSessao: '',
    dataImpugnacao: '',
    dataEsclarecimento: '',
    valorEstimado: '',
    orcamentoSigiloso: false,
    permiteConsorcio: false,
    permiteSubcontrato: false,
    exigeVisita: false,
    exigeGarantia: false,
    observacoes: '',
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/licitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/licitacoes/${data.id}`);
      } else {
        alert('Erro ao criar licitação');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao conectar com servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/licitacoes" className="btn btn-ghost p-2 rounded-full hover:bg-gray-200">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Licitação</h1>
          <p className="text-sm text-gray-500">Cadastre uma nova oportunidade de negócio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-8">
        
        {/* Bloco 1: Empresa Responsável */}
        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Empresa Responsável</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Empresa</label>
              <select name="organizationId" value={formData.organizationId} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500" required>
                <option value="">Selecione a empresa</option>
                {/* Normally dynamically fetched, statically listed for prompt */}
                <option value="UFC">UFC Engenharia</option>
                <option value="PORTICO">Pórtico Construções</option>
                <option value="CONSORCIO">Nova parceria (Consórcio)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Bloco 2: Órgão e Localização */}
        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Órgão e Localização</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-1">Órgão Contratante</label>
              <input type="text" name="orgaoNome" value={formData.orgaoNome} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">UASG</label>
              <input type="text" name="orgaoUasg" value={formData.orgaoUasg} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Município/UF</label>
              <div className="flex gap-2">
                <input type="text" name="municipio" placeholder="Cidade" value={formData.municipio} onChange={handleChange} className="w-2/3 border rounded-md px-3 py-2 text-sm" required />
                <input type="text" name="uf" placeholder="UF" maxLength={2} value={formData.uf} onChange={handleChange} className="w-1/3 border rounded-md px-3 py-2 text-sm" required />
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 3: Dados do Edital */}
        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Dados do Edital</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Modalidade</label>
              <select name="modalidade" value={formData.modalidade} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                <option value="CONCORRENCIA_ELETRONICA">Concorrência Eletrônica</option>
                <option value="PREGAO_ELETRONICO">Pregão Eletrônico</option>
                <option value="RDC">RDC</option>
                <option value="TOMADA_PRECOS">Tomada de Preços</option>
                <option value="DISPENSA">Dispensa</option>
                <option value="INEXIGIBILIDADE">Inexigibilidade</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Número do Edital</label>
              <input type="text" name="numero" value={formData.numero} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Processo Adm.</label>
              <input type="text" name="numeroProcesso" value={formData.numeroProcesso} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plataforma</label>
              <select name="plataforma" value={formData.plataforma} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                <option value="COMPRAS_GOV">Compras.gov.br</option>
                <option value="PORTAL_COMPRAS_PUBLICAS">Portal de Compras Públicas</option>
                <option value="LICITACOES_E">Licitações-e (BB)</option>
                <option value="BLL">BLL Compras</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL do Edital</label>
              <input type="url" name="plataformaUrl" value={formData.plataformaUrl} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="https://" />
            </div>
          </div>
        </section>

        {/* Bloco 4: Objeto e Escopo */}
        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Objeto e Escopo</h2>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Objeto Completo</label>
              <textarea name="objeto" rows={3} value={formData.objeto} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resumo Executivo</label>
              <input type="text" name="objetoResumo" value={formData.objetoResumo} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Breve descrição em 1 linha" />
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium mb-1">Tipo de Serviço</label>
            <select name="tipoServico" value={formData.tipoServico} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">Selecione...</option>
              <option value="OBRA">Execução de Obras</option>
              <option value="PROJETO">Elaboração de Projetos</option>
              <option value="SUPERVISAO">Supervisão/Gerenciamento</option>
              <option value="MANUTENCAO">Manutenção Predial</option>
              <option value="TECNOLOGIA">Tecnologia da Informação</option>
              <option value="OUTROS">Outros</option>
            </select>
          </div>
        </section>

        {/* Bloco 5: Prazos e Valores */}
        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Prazos e Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data/Hora Sessão</label>
              <input type="datetime-local" name="dataHoraSessao" value={formData.dataHoraSessao} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Limite Esclarecimentos</label>
              <input type="date" name="dataEsclarecimento" value={formData.dataEsclarecimento} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Limite Impugnação</label>
              <input type="date" name="dataImpugnacao" value={formData.dataImpugnacao} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor Estimado (R$)</label>
              <input type="number" step="0.01" name="valorEstimado" value={formData.valorEstimado} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Ex: 150000.00" />
            </div>
            <div className="flex items-end mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="orcamentoSigiloso" checked={formData.orcamentoSigiloso} onChange={handleChange} className="rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium">Orçamento Sigiloso</span>
              </label>
            </div>
          </div>
        </section>

        {/* Bloco 6: Condicionantes */}
        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Condicionantes e Exigências</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="permiteConsorcio" checked={formData.permiteConsorcio} onChange={handleChange} className="rounded text-blue-600" />
              <span className="text-sm">Permite Consórcio</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="permiteSubcontrato" checked={formData.permiteSubcontrato} onChange={handleChange} className="rounded text-blue-600" />
              <span className="text-sm">Permite Subcontratação</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="exigeVisita" checked={formData.exigeVisita} onChange={handleChange} className="rounded text-blue-600" />
              <span className="text-sm">Exige Visita Técnica</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="exigeGarantia" checked={formData.exigeGarantia} onChange={handleChange} className="rounded text-blue-600" />
              <span className="text-sm">Garantia de Proposta</span>
            </label>
          </div>
        </section>

        {/* Bloco 7: Observações */}
        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Observações Internas</h2>
          <textarea name="observacoes" rows={3} value={formData.observacoes} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Anotações para a equipe..." />
        </section>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link href="/dashboard/licitacoes" className="px-5 py-2 border rounded-md text-gray-700 font-medium hover:bg-gray-50">Cancelar</Link>
          <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Licitação'}
          </button>
        </div>
      </form>
    </div>
  );
}