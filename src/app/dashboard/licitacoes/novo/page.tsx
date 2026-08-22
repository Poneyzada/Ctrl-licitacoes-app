'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Gavel, Building2, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';

export default function NovaLicitacaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    organizationId: '',
    orgaoNome: '',
    orgaoUasg: '',
    municipio: '',
    uf: 'CE',
    modalidade: 'CONCORRENCIA_ELETRONICA',
    numero: '',
    numeroProcesso: '',
    plataforma: 'Compras.gov.br',
    plataformaUrl: '',
    objeto: '',
    objetoResumo: '',
    tipoServico: 'EXECUCAO_INFRAESTRUTURA',
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

  useEffect(() => {
    fetch('/api/empresas')
      .then(res => res.json())
      .then(data => {
        setOrganizations(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, organizationId: data[0].id }));
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orgaoNome || !formData.objeto) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

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
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/dashboard/licitacoes" className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.4rem' }}>Nova Licitação</h1>
            <p className="page-subtitle">Cadastrar nova oportunidade de edital ou disputa</p>
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={loading} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar Licitação
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Bloco 1: Empresa Titular & Órgão */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} style={{ color: 'var(--color-primary)' }} />
            1. Empresa Responsável & Órgão Licitante
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Empresa Concorrente *</label>
              <select name="organizationId" value={formData.organizationId} onChange={handleChange} className="form-control" required>
                <option value="">Selecione a empresa...</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.tradeName || org.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nome do Órgão Licitante *</label>
              <input 
                name="orgaoNome" 
                value={formData.orgaoNome} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Ex: SEINFRA/CE, SOP/CE, Prefeitura de Sobral..." 
                required 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '14px' }}>
            <div className="form-group">
              <label className="form-label">Código UASG / Unidade</label>
              <input name="orgaoUasg" value={formData.orgaoUasg} onChange={handleChange} className="form-control" placeholder="Ex: 925142" />
            </div>

            <div className="form-group">
              <label className="form-label">Município</label>
              <input name="municipio" value={formData.municipio} onChange={handleChange} className="form-control" placeholder="Ex: Fortaleza" />
            </div>

            <div className="form-group">
              <label className="form-label">UF</label>
              <input name="uf" value={formData.uf} onChange={handleChange} className="form-control" maxLength={2} placeholder="CE" />
            </div>

            <div className="form-group">
              <label className="form-label">Plataforma</label>
              <input name="plataforma" value={formData.plataforma} onChange={handleChange} className="form-control" placeholder="Ex: Compras.gov.br" />
            </div>
          </div>
        </div>

        {/* Bloco 2: Modalidade & Identificação do Edital */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gavel size={18} style={{ color: '#60a5fa' }} />
            2. Modalidade & Números do Processo
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Modalidade de Licitação</label>
              <select name="modalidade" value={formData.modalidade} onChange={handleChange} className="form-control">
                <option value="CONCORRENCIA_ELETRONICA">Concorrência Eletrônica</option>
                <option value="PREGAO_ELETRONICO">Pregão Eletrônico</option>
                <option value="LICITACAO_PRESENCIAL">Licitação Presencial</option>
                <option value="CHAMAMENTO">Chamamento Público</option>
                <option value="DISPENSA">Dispensa Eletrônica</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nº do Edital / Licitação</label>
              <input name="numero" value={formData.numero} onChange={handleChange} className="form-control" placeholder="Ex: 042/2026" />
            </div>

            <div className="form-group">
              <label className="form-label">Nº do Processo Administrativo</label>
              <input name="numeroProcesso" value={formData.numeroProcesso} onChange={handleChange} className="form-control" placeholder="Ex: 2026/00142-CE" />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Serviço</label>
              <select name="tipoServico" value={formData.tipoServico} onChange={handleChange} className="form-control">
                <option value="EXECUCAO_INFRAESTRUTURA">Obras de Infraestrutura</option>
                <option value="SERVICOS_HIDRICOS">Saneamento & Recursos Hídricos</option>
                <option value="EXECUCAO">Construção Civil & Edificações</option>
                <option value="ELABORACAO_PROJETOS">Elaboração de Projetos</option>
                <option value="GERENCIAMENTO">Gerenciamento e Fiscalização</option>
                <option value="MANUTENCAO">Manutenção Predial / Preventiva</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 3: Objeto */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: '#34d399' }} />
            3. Objeto & Escopo Editalício
          </h3>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Objeto Completo (conforme Edital) *</label>
            <textarea 
              name="objeto" 
              value={formData.objeto} 
              onChange={handleChange} 
              className="form-control" 
              rows={4}
              placeholder="Cole o texto integral do objeto do edital..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Resumo do Objeto (para visualização rápida nos cards)</label>
            <input 
              name="objetoResumo" 
              value={formData.objetoResumo} 
              onChange={handleChange} 
              className="form-control" 
              placeholder="Ex: Pavimentação CBUQ (120.000 m²) e drenagem pluvial (14 km)"
            />
          </div>
        </div>

        {/* Bloco 4: Prazos e Sessão Pública */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: '#fbbf24' }} />
            4. Prazos & Sessão Pública
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Data e Hora da Sessão de Disputa</label>
              <input type="datetime-local" name="dataHoraSessao" value={formData.dataHoraSessao} onChange={handleChange} className="form-control" />
            </div>

            <div className="form-group">
              <label className="form-label">Limite para Pedido de Esclarecimento</label>
              <input type="datetime-local" name="dataEsclarecimento" value={formData.dataEsclarecimento} onChange={handleChange} className="form-control" />
            </div>

            <div className="form-group">
              <label className="form-label">Limite para Impugnação do Edital</label>
              <input type="datetime-local" name="dataImpugnacao" value={formData.dataImpugnacao} onChange={handleChange} className="form-control" />
            </div>
          </div>
        </div>

        {/* Bloco 5: Valores & Condicionantes */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} style={{ color: '#a855f7' }} />
            5. Orçamento & Condicionantes
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Valor Estimado Total (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                name="valorEstimado" 
                value={formData.valorEstimado} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Ex: 24500000.00" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Link da Disputa / Portal</label>
              <input 
                type="url" 
                name="plataformaUrl" 
                value={formData.plataformaUrl} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="https://..." 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <input type="checkbox" name="orcamentoSigiloso" checked={formData.orcamentoSigiloso} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
              Orçamento Sigiloso
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <input type="checkbox" name="permiteConsorcio" checked={formData.permiteConsorcio} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
              Permite Consórcio
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <input type="checkbox" name="exigeVisita" checked={formData.exigeVisita} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
              Visita Técnica Obrigatória
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <input type="checkbox" name="exigeGarantia" checked={formData.exigeGarantia} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
              Exige Garantia de Proposta
            </label>
          </div>
        </div>

        {/* Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <Link href="/dashboard/licitacoes" className="btn btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Cadastrar Licitação
          </button>
        </div>
      </form>
    </div>
  );
}