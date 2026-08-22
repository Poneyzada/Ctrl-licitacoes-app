"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, Trash2, FileText, CheckCircle2, Loader2 } from 'lucide-react';
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
    uf: 'CE',
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
    if (!formData.orgId || !formData.emitente || !formData.objeto) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

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
        alert('Erro ao salvar acervo.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/dashboard/acervo" className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.4rem' }}>Novo Atestado / CAT</h1>
            <p className="page-subtitle">Cadastrar documento de capacitação técnico-operacional</p>
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar Atestado
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Empresa & Órgão */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            1. Dados da Entidade e Contratante
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Empresa Titular do Acervo *</label>
              <select name="orgId" value={formData.orgId} onChange={handleChange} className="form-control" required>
                <option value="">Selecione a empresa...</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.tradeName || org.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Órgão / Cliente Emitente *</label>
              <input 
                name="emitente" 
                value={formData.emitente} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Ex: CAGECE, SOP/CE, Prefeitura..."
                required 
              />
            </div>
          </div>
        </div>

        {/* Section 2: Identificação do Documento */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            2. Identificação e Registros
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nº do Atestado</label>
              <input 
                name="numeroAtestado" 
                value={formData.numeroAtestado} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Ex: AT-2024/042"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nº da CAT (CREA/CAU)</label>
              <input 
                name="numeroCat" 
                value={formData.numeroCat} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Ex: CAT-CE-2024-00142"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nº do Contrato Originário</label>
              <input 
                name="numeroContrato" 
                value={formData.numeroContrato} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Ex: CT-089/2022"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Objeto dos Serviços */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            3. Descrição do Objeto & Classificação
          </h3>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Objeto Completo dos Serviços *</label>
            <textarea 
              name="objeto" 
              value={formData.objeto} 
              onChange={handleChange} 
              className="form-control" 
              rows={4}
              placeholder="Descreva detalhadamente o escopo dos serviços executados conforme atestado..."
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Tipo de Serviço</label>
              <select name="tipoServico" value={formData.tipoServico} onChange={handleChange} className="form-control">
                <option value="">Selecione...</option>
                <option value="EXECUCAO">Execução de Obras Civis</option>
                <option value="EXECUCAO_INFRAESTRUTURA">Obras de Infraestrutura / Rodoviária</option>
                <option value="SERVICOS_HIDRICOS">Saneamento / Recursos Hídricos</option>
                <option value="ELABORACAO_PROJETOS">Elaboração de Projetos</option>
                <option value="GERENCIAMENTO">Gerenciamento / Supervisão</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Área Técnica</label>
              <input 
                name="areaTecnica" 
                value={formData.areaTecnica} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Ex: Adutoras, Pavimentação CBUQ, Edificações..." 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Responsável Técnico</label>
              <input 
                name="responsavelTecnico" 
                value={formData.responsavelTecnico} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Ex: Eng. Roberto Silva — CREA 45892-D"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Local e Datas */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            4. Localização & Vigência
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Município / Local</label>
              <input 
                name="local" 
                value={formData.local} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Ex: Fortaleza, Sobral..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">UF</label>
              <input 
                name="uf" 
                value={formData.uf} 
                onChange={handleChange} 
                className="form-control" 
                maxLength={2}
                placeholder="CE"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Início da Execução</label>
              <input 
                type="date" 
                name="periodoInicio" 
                value={formData.periodoInicio} 
                onChange={handleChange} 
                className="form-control" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fim / Conclusão</label>
              <input 
                type="date" 
                name="periodoFim" 
                value={formData.periodoFim} 
                onChange={handleChange} 
                className="form-control" 
              />
            </div>
          </div>
        </div>

        {/* Section 5: Quantitativos Builder */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              5. Quantitativos Físicos Comprovados
            </h3>
            <button type="button" onClick={addQuantitativo} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Adicionar Linha
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {quantitativos.map((q, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 3fr) minmax(100px, 1fr) minmax(90px, 1fr) auto', gap: '10px', alignItems: 'center', background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <input 
                    placeholder="Descrição do serviço (ex: Assentamento tubulação PEAD 400mm)" 
                    value={q.descricao} 
                    onChange={(e) => handleQuantitativoChange(i, 'descricao', e.target.value)} 
                    className="form-control" 
                  />
                </div>
                <div>
                  <input 
                    placeholder="Quantidade (ex: 65.400)" 
                    value={q.quantidade} 
                    onChange={(e) => handleQuantitativoChange(i, 'quantidade', e.target.value)} 
                    className="form-control" 
                  />
                </div>
                <div>
                  <input 
                    placeholder="Unidade (m, m², ton)" 
                    value={q.unidade} 
                    onChange={(e) => handleQuantitativoChange(i, 'unidade', e.target.value)} 
                    className="form-control" 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => removeQuantitativo(i)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#f87171', padding: '6px' }}
                  title="Remover linha"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <Link href="/dashboard/acervo" className="btn btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Atestado
          </button>
        </div>
      </form>
    </div>
  );
}
