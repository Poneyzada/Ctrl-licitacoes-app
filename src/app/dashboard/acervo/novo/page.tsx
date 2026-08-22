"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function NovoAcervoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    orgId: '',
    numeroAtestado: '',
    numeroCat: '',
    numeroContrato: '',
    emitente: '',
    objeto: '',
    tipoServico: '',
    areaTecnica: '',
    local: '',
    uf: '',
    periodoInicio: '',
    periodoFim: '',
    responsavelTecnico: '',
    palavrasChave: '',
    observacoes: '',
  });

  const [quantitativos, setQuantitativos] = useState([
    { descricao: '', quantidade: '', unidade: '' }
  ]);

  useEffect(() => {
    fetch('/api/empresas')
      .then(res => res.json())
      .then(data => {
        setOrganizations(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, orgId: data[0].id }));
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuantitativoChange = (index: number, field: string, value: string) => {
    const newQ = [...quantitativos];
    newQ[index] = { ...newQ[index], [field]: value };
    setQuantitativos(newQ);
  };

  const addQuantitativo = () => {
    setQuantitativos([...quantitativos, { descricao: '', quantidade: '', unidade: '' }]);
  };

  const removeQuantitativo = (index: number) => {
    setQuantitativos(quantitativos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validQuantitativos = quantitativos.filter(q => q.descricao || q.quantidade);

    try {
      const res = await fetch('/api/acervo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantitativos: JSON.stringify(validQuantitativos)
        })
      });

      if (res.ok) {
        router.push('/dashboard/acervo');
      } else {
        alert('Erro ao salvar acervo');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid animate-fade-in max-w-4xl">
      <div className="page-header flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/acervo" className="btn btn-ghost btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="page-title">Novo Atestado / CAT</h1>
            <p className="page-subtitle">Cadastrar novo documento de acervo técnico</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? <span className="animate-spin text-xl mr-2">⟳</span> : <Save size={16} className="mr-2" />}
          Salvar
        </button>
      </div>

      <form className="card p-6 flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label>Empresa Vinculada</label>
            <select name="orgId" value={formData.orgId} onChange={handleChange} className="input" required>
              <option value="">Selecione...</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Órgão Emitente</label>
            <input name="emitente" value={formData.emitente} onChange={handleChange} className="input" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label>Nº do Atestado</label>
            <input name="numeroAtestado" value={formData.numeroAtestado} onChange={handleChange} className="input" />
          </div>
          <div className="form-group">
            <label>Nº da CAT (CREA/CAU)</label>
            <input name="numeroCat" value={formData.numeroCat} onChange={handleChange} className="input" />
          </div>
          <div className="form-group">
            <label>Nº do Contrato Original</label>
            <input name="numeroContrato" value={formData.numeroContrato} onChange={handleChange} className="input" />
          </div>
        </div>

        <div className="form-group">
          <label>Objeto dos Serviços</label>
          <textarea 
            name="objeto" 
            value={formData.objeto} 
            onChange={handleChange} 
            className="input" 
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label>Tipo de Serviço</label>
            <select name="tipoServico" value={formData.tipoServico} onChange={handleChange} className="input">
              <option value="">Selecione...</option>
              <option value="EXECUCAO">Execução de Obras</option>
              <option value="EXECUCAO_INFRAESTRUTURA">Infraestrutura</option>
              <option value="ELABORACAO_PROJETOS">Projetos</option>
              <option value="GERENCIAMENTO">Gerenciamento</option>
            </select>
          </div>
          <div className="form-group">
            <label>Área Técnica Principal</label>
            <input name="areaTecnica" value={formData.areaTecnica} onChange={handleChange} className="input" placeholder="Ex: Saneamento, Pavimentação..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group col-span-2">
            <label>Local / Cidade</label>
            <input name="local" value={formData.local} onChange={handleChange} className="input" />
          </div>
          <div className="form-group">
            <label>UF</label>
            <input name="uf" value={formData.uf} onChange={handleChange} className="input" maxLength={2} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label>Período de Início</label>
            <input type="date" name="periodoInicio" value={formData.periodoInicio} onChange={handleChange} className="input" />
          </div>
          <div className="form-group">
            <label>Período de Fim (ou Previsto)</label>
            <input type="date" name="periodoFim" value={formData.periodoFim} onChange={handleChange} className="input" />
          </div>
        </div>

        <div className="border-t border-[var(--border-color)] pt-4 mt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Quantitativos Principais</h3>
            <button type="button" onClick={addQuantitativo} className="btn btn-secondary btn-sm">
              <Plus size={14} /> Adicionar Linha
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {quantitativos.map((q, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1">
                  <input 
                    placeholder="Descrição do serviço (ex: Pavimentação asfáltica)" 
                    value={q.descricao} 
                    onChange={(e) => handleQuantitativoChange(i, 'descricao', e.target.value)} 
                    className="input text-sm" 
                  />
                </div>
                <div className="w-32">
                  <input 
                    placeholder="Qtd (ex: 50.000)" 
                    value={q.quantidade} 
                    onChange={(e) => handleQuantitativoChange(i, 'quantidade', e.target.value)} 
                    className="input text-sm" 
                  />
                </div>
                <div className="w-24">
                  <input 
                    placeholder="Un (ex: m²)" 
                    value={q.unidade} 
                    onChange={(e) => handleQuantitativoChange(i, 'unidade', e.target.value)} 
                    className="input text-sm" 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => removeQuantitativo(i)}
                  className="btn btn-icon btn-ghost mt-1 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </form>
    </div>
  );
}
