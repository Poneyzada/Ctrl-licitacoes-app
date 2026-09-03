'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Loader2, Gavel, Building2, 
  MapPin, Calendar, DollarSign, FileText, Sparkles, 
  UploadCloud, CheckCircle2, FileUp, FileCheck, X
} from 'lucide-react';
import Link from 'next/link';

export default function NovaLicitacaoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processPdfFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processPdfFile(e.dataTransfer.files[0]);
    }
  };

  const processPdfFile = async (file: File) => {
    setExtracting(true);
    try {
      const payload = new FormData();
      payload.append('file', file);

      const res = await fetch('/api/licitacoes/extract-pdf', {
        method: 'POST',
        body: payload
      });

      if (res.ok) {
        const data = await res.json();
        if (data.extractedData) {
          setFormData(prev => ({
            ...prev,
            ...data.extractedData,
            organizationId: data.extractedData.organizationId || prev.organizationId || (organizations[0]?.id || '')
          }));
          setUploadedFileMeta(data.fileMeta);
        }
      } else {
        const err = await res.json();
        alert(`Falha ao ler PDF: ${err.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar o PDF para extração.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orgaoNome || !formData.objeto) {
      alert('Por favor, preencha os campos obrigatórios (Órgão Licitante e Objeto).');
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
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept=".pdf,.txt,.docx" 
        style={{ display: 'none' }} 
      />

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

      {/* IA Extraction Banner / Real PDF Dropzone */}
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          background: dragActive ? 'rgba(232, 93, 93, 0.15)' : 'linear-gradient(135deg, rgba(107, 26, 42, 0.2) 0%, rgba(22, 22, 24, 0.95) 100%)',
          border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--border-color-accent)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '22px 26px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Extração Automática com LICIT.AI
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Selecione ou arraste qualquer PDF de Edital/TR para preencher os dados reais instantaneamente
            </p>
            {uploadedFileMeta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileCheck size={13} /> {uploadedFileMeta.name} ({uploadedFileMeta.totalPages} páginas)
                </span>
              </div>
            )}
          </div>
        </div>

        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={extracting}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', padding: '10px 18px', border: '1px solid var(--border-color-accent)' }}
        >
          {extracting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Lendo PDF com LICIT.AI...
            </>
          ) : (
            <>
              <FileUp size={18} style={{ color: 'var(--color-primary)' }} />
              Carregar Edital em PDF
            </>
          )}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '16px' }}>
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
              <select name="uf" value={formData.uf} onChange={handleChange} className="form-control">
                {['CE', 'BA', 'PE', 'RN', 'PB', 'PI', 'MA', 'AL', 'SE', 'SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS', 'DF', 'GO', 'MT', 'MS', 'AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Plataforma</label>
              <input name="plataforma" value={formData.plataforma} onChange={handleChange} className="form-control" placeholder="Compras.gov.br, BLL..." />
            </div>
          </div>
        </div>

        {/* Bloco 2: Modalidade & Números do Processo */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gavel size={18} style={{ color: 'var(--color-primary)' }} />
            2. Modalidade & Números do Processo
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Modalidade de Licitação</label>
              <select name="modalidade" value={formData.modalidade} onChange={handleChange} className="form-control">
                <option value="CONCORRENCIA_ELETRONICA">Concorrência Eletrônica</option>
                <option value="PREGAO_ELETRONICO">Pregão Eletrônico</option>
                <option value="CHAMAMENTO">Chamamento Público</option>
                <option value="DISPENSA">Dispensa Eletrônica</option>
                <option value="LICITACAO_PRESENCIAL">Licitação Presencial</option>
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
                <option value="ELABORACAO_PROJETOS">Elaboração de Projetos</option>
                <option value="CONTRATACAO_INTEGRADA">Contratação Integrada (Projeto + Obra)</option>
                <option value="SUPERVISAO">Supervisão de Obras</option>
                <option value="FISCALIZACAO">Fiscalização</option>
                <option value="GERENCIAMENTO">Gerenciamento</option>
                <option value="MANUTENCAO">Manutenção Predial / Infra</option>
                <option value="SERVICOS_HIDRICOS">Saneamento e Hídricos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 3: Objeto & Escopo */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
            3. Objeto & Escopo Editalício
          </h3>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Objeto Completo (conforme Edital) *</label>
            <textarea 
              name="objeto" 
              value={formData.objeto} 
              onChange={handleChange} 
              className="form-control" 
              rows={3} 
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

        {/* Bloco 4: Prazos & Sessão Pública */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
            4. Prazos & Sessão Pública
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Data e Hora da Sessão de Disputa</label>
              <input 
                type="datetime-local" 
                name="dataHoraSessao" 
                value={formData.dataHoraSessao} 
                onChange={handleChange} 
                className="form-control" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Limite para Pedido de Esclarecimento</label>
              <input 
                type="datetime-local" 
                name="dataEsclarecimento" 
                value={formData.dataEsclarecimento} 
                onChange={handleChange} 
                className="form-control" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Limite para Impugnação do Edital</label>
              <input 
                type="datetime-local" 
                name="dataImpugnacao" 
                value={formData.dataImpugnacao} 
                onChange={handleChange} 
                className="form-control" 
              />
            </div>
          </div>
        </div>

        {/* Bloco 5: Valores & Condicionantes */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} style={{ color: 'var(--color-primary)' }} />
            5. Orçamento & Condicionantes
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Valor Estimado Total (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                name="valorEstimado" 
                value={formData.valorEstimado} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Ex: 18200000.00" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Link da Disputa / Portal</label>
              <input 
                name="plataformaUrl" 
                value={formData.plataformaUrl} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="https://www.gov.br/compras/pt-br/..." 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '20px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" name="orcamentoSigiloso" checked={formData.orcamentoSigiloso} onChange={handleChange} />
              <span>Orçamento Sigiloso</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" name="permiteConsorcio" checked={formData.permiteConsorcio} onChange={handleChange} />
              <span>Permite Consórcio</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" name="exigeVisita" checked={formData.exigeVisita} onChange={handleChange} />
              <span>Visita Técnica Obrigatória</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" name="exigeGarantia" checked={formData.exigeGarantia} onChange={handleChange} />
              <span>Exige Garantia de Proposta</span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <Link href="/dashboard/licitacoes" className="btn btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Cadastrar Licitação
          </button>
        </div>

      </form>
    </div>
  );
}