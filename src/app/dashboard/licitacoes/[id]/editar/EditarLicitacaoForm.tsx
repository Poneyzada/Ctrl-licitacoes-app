'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Loader2, Gavel, Building2, 
  MapPin, Calendar, DollarSign, FileText, CheckCircle2,
  AlertTriangle, Trash2, Globe, Shield, Layers, Users
} from 'lucide-react';

interface EditarLicitacaoFormProps {
  licitacao: any;
  organizations: any[];
}

function formatDateForInput(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
}

export default function EditarLicitacaoForm({ licitacao, organizations }: EditarLicitacaoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    organizationId: licitacao.organizationId || (organizations[0]?.id || ''),
    formatoParticipacao: (licitacao.consorcioId || licitacao.consorcio) ? 'CONSORCIO' : (licitacao.organizationId || (organizations[0]?.id || '')),
    isConsorcio: Boolean(licitacao.consorcioId || licitacao.consorcio),
    consorcioNome: licitacao.consorcio?.name || '',
    consorcioComposicao: licitacao.consorcio?.notes || '',
    status: licitacao.status || 'EM_ANALISE',
    risco: licitacao.risco || 'BAIXO',
    orgaoNome: licitacao.orgaoNome || '',
    orgaoUasg: licitacao.orgaoUasg || '',
    municipio: licitacao.municipio || '',
    uf: licitacao.uf || 'CE',
    modalidade: licitacao.modalidade || 'CONCORRENCIA_ELETRONICA',
    numero: licitacao.numero || '',
    numeroProcesso: licitacao.numeroProcesso || '',
    plataforma: licitacao.plataforma || 'Compras.gov.br',
    plataformaUrl: licitacao.plataformaUrl || '',
    objeto: licitacao.objeto || '',
    objetoResumo: licitacao.objetoResumo || '',
    tipoServico: licitacao.tipoServico || 'PAVIMENTACAO_INFRAESTRUTURA',
    dataHoraSessao: formatDateForInput(licitacao.dataHoraSessao),
    dataImpugnacao: formatDateForInput(licitacao.dataImpugnacao),
    dataEsclarecimento: formatDateForInput(licitacao.dataEsclarecimento),
    valorEstimado: licitacao.valorEstimado !== null && licitacao.valorEstimado !== undefined ? String(licitacao.valorEstimado) : '',
    orcamentoSigiloso: Boolean(licitacao.orcamentoSigiloso),
    permiteConsorcio: Boolean(licitacao.permiteConsorcio),
    permiteSubcontrato: Boolean(licitacao.permiteSubcontrato),
    exigeVisita: Boolean(licitacao.exigeVisita),
    exigeGarantia: Boolean(licitacao.exigeGarantia),
    resultado: licitacao.resultado || '',
    vencedor: licitacao.vencedor || '',
    valorFinal: licitacao.valorFinal !== null && licitacao.valorFinal !== undefined ? String(licitacao.valorFinal) : '',
    observacoes: licitacao.observacoes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.isConsorcio) {
      if (!formData.organizationId) {
        setErrorMsg('Por favor, selecione qual empresa (UFC ou Pórtico) será a Representante/Líder do Consórcio.');
        return;
      }
      if (!formData.consorcioNome?.trim()) {
        setErrorMsg('Por favor, informe o Nome do Consórcio.');
        return;
      }
    } else if (!formData.organizationId) {
      setErrorMsg('Por favor, selecione a Empresa Concorrente.');
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/licitacoes/${licitacao.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccessMsg('Licitação atualizada com sucesso!');
        setTimeout(() => {
          router.push(`/dashboard/licitacoes/${licitacao.id}`);
          router.refresh();
        }, 800);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Erro ao atualizar licitação');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro de conexão ao salvar alterações');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deseja realmente arquivar/excluir esta licitação? Ela não aparecerá mais na listagem ativa.')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/licitacoes/${licitacao.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        router.push('/dashboard/licitacoes');
        router.refresh();
      } else {
        alert('Erro ao excluir licitação');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao excluir licitação');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={`/dashboard/licitacoes/${licitacao.id}`} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Edição de Certame
            </div>
            <h1 className="page-title" style={{ fontSize: '1.4rem' }}>
              Editar Licitação • {licitacao.numero || 'S/N'}
            </h1>
            <p className="page-subtitle">{licitacao.orgaoNome}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || loading}
            className="btn btn-secondary btn-sm"
            style={{ color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Arquivar
          </button>

          <button 
            type="button"
            onClick={handleSubmit} 
            disabled={loading || deleting} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.12)', 
          border: '1px solid rgba(34, 197, 94, 0.3)', 
          color: '#4ade80', 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.12)', 
          border: '1px solid rgba(239, 68, 68, 0.3)', 
          color: '#f87171', 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={18} />
          {errorMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Bloco 0: Status & Matriz de Risco */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: 'var(--color-primary)' }} />
            Status Operacional & Nível de Risco
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Status da Licitação *</label>
              <select name="status" value={formData.status} onChange={handleChange} className="form-control" required>
                <option value="PROSPECCAO">Prospecção / Nova Oportunidade</option>
                <option value="EM_ANALISE">Em Análise / Triagem</option>
                <option value="APROVADA">Aprovada para Disputa</option>
                <option value="EM_DISPUTA">Em Disputa (Sessão Ativa)</option>
                <option value="ATENCAO">Atenção / Pendência Crítica</option>
                <option value="ACOMPANHANDO_RESULTADO">Acompanhando Resultado (Pós-Disputa)</option>
                <option value="FINALIZADA">Finalizada / Concluída</option>
                <option value="PERDIDA">Perdida / Sem Êxito</option>
                <option value="DESCARTADA">Descartada / Inviável</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Classificação de Risco</label>
              <select name="risco" value={formData.risco} onChange={handleChange} className="form-control">
                <option value="BAIXO">Risco Baixo (Requisitos comuns e prazos confortáveis)</option>
                <option value="MEDIO">Risco Médio (Exige certidões ou quantitativos específicos)</option>
                <option value="ALTO">Risco Alto (Edital restritivo ou prazo muito apertado)</option>
                <option value="CRITICO">Risco Crítico (Possível impugnação necessária)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 1: Empresa & Órgão Licitante */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} style={{ color: 'var(--color-primary)' }} />
            1. Empresa Responsável & Órgão Licitante
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Formato de Participação / Concorrente *</label>
              <select 
                name="formatoParticipacao" 
                value={formData.formatoParticipacao} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'CONSORCIO') {
                    setFormData(prev => ({
                      ...prev,
                      formatoParticipacao: 'CONSORCIO',
                      isConsorcio: true,
                      permiteConsorcio: true,
                      organizationId: prev.organizationId || (organizations[0]?.id || '')
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      formatoParticipacao: val,
                      isConsorcio: false,
                      organizationId: val,
                      consorcioNome: '',
                      consorcioComposicao: ''
                    }));
                  }
                }} 
                className="form-control" 
                required
              >
                <option value="">Selecione a empresa ou consórcio...</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.tradeName || org.name}</option>
                ))}
                <option value="CONSORCIO">🤝 Consórcio de Empresas</option>
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

            {formData.isConsorcio && (
              <div 
                style={{ 
                  gridColumn: '1 / -1',
                  background: 'rgba(225, 29, 72, 0.05)', 
                  border: '1px solid rgba(225, 29, 72, 0.3)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  marginTop: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      Configurações do Consórcio Firmado
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(225, 29, 72, 0.15)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                    DISPUTA EM CONSÓRCIO
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      Empresa Representante / Líder do Consórcio *
                    </label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      {organizations.map(org => {
                        const isSelected = formData.organizationId === org.id;
                        return (
                          <label 
                            key={org.id} 
                            style={{ 
                              flex: 1, 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              padding: '10px 14px', 
                              borderRadius: 'var(--radius-md)', 
                              border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--border-color)', 
                              background: isSelected ? 'rgba(225, 29, 72, 0.12)' : 'var(--bg-card)', 
                              cursor: 'pointer',
                              fontWeight: isSelected ? 600 : 400,
                              fontSize: '0.85rem'
                            }}
                          >
                            <input 
                              type="radio" 
                              name="consorcioLider" 
                              value={org.id} 
                              checked={isSelected}
                              onChange={() => setFormData(prev => ({ ...prev, organizationId: org.id }))}
                              style={{ accentColor: 'var(--color-primary)' }}
                            />
                            {org.tradeName || org.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nome do Consórcio *</label>
                    <input 
                      name="consorcioNome" 
                      value={formData.consorcioNome} 
                      onChange={handleChange} 
                      className="form-control" 
                      placeholder="Ex: Consórcio UFC - Construtora Bahia" 
                      required={formData.isConsorcio}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Composição / Demais Empresas Consorciadas (Opcional)</label>
                    <input 
                      name="consorcioComposicao" 
                      value={formData.consorcioComposicao} 
                      onChange={handleChange} 
                      className="form-control" 
                      placeholder="Ex: UFC Engenharia (Líder - 60%), Empresa Parceira Ltda (40%)" 
                    />
                  </div>
                </div>
              </div>
            )}
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
              <label className="form-label">Plataforma / Portal</label>
              <input name="plataforma" value={formData.plataforma} onChange={handleChange} className="form-control" placeholder="Compras.gov.br, BLL..." />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Link Direto da Licitação no Portal</label>
            <div style={{ position: 'relative' }}>
              <input 
                name="plataformaUrl" 
                value={formData.plataformaUrl} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="https://cnetmobile.estaleiro.serpro.gov.br/..." 
                style={{ paddingLeft: '36px' }}
              />
              <Globe size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        {/* Bloco 2: Modalidade & Processo */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gavel size={18} style={{ color: 'var(--color-primary)' }} />
            2. Modalidade & Identificação do Processo
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Modalidade</label>
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
              <label className="form-label">Tipo de Serviço / Obra</label>
              <select name="tipoServico" value={formData.tipoServico} onChange={handleChange} className="form-control">
                <option value="PAVIMENTACAO_INFRAESTRUTURA">Pavimentação e Execução de Infraestrutura</option>
                <option value="EXECUCAO_EDIFICACOES">Execução e Projetos de Edificações / Obras Civis</option>
                <option value="OBRAS_RODOVIARIAS">Obras de Infraestrutura Rodoviária</option>
                <option value="ELABORACAO_PROJETOS">Elaboração de Projetos e Contratação Integrada</option>
                <option value="SUPERVISAO_FISCALIZACAO">Fiscalização e Supervisão de Obras</option>
                <option value="ASSESSORAMENTO_GERENCIAMENTO">Assessoramento e Gerenciamento</option>
                <option value="SERVICOS_HIDRICOS">Serviços Hídricos e Saneamento Básico</option>
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
              rows={4} 
              placeholder="Texto integral do objeto da licitação..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Resumo Executivo do Objeto (exibido nos cards)</label>
            <input 
              name="objetoResumo" 
              value={formData.objetoResumo} 
              onChange={handleChange} 
              className="form-control" 
              placeholder="Ex: Pavimentação asfáltica (85.000 m²) e drenagem de águas pluviais" 
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
                placeholder="Ex: 15400000.00" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Valor Final Homologado (R$) - se concluída</label>
              <input 
                type="number" 
                step="0.01" 
                name="valorFinal" 
                value={formData.valorFinal} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Ex: 14850000.00" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vencedor Homologado</label>
              <input 
                name="vencedor" 
                value={formData.vencedor} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Nome da empresa vencedora..." 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <input type="checkbox" name="orcamentoSigiloso" checked={formData.orcamentoSigiloso} onChange={handleChange} />
              Orçamento Sigiloso (Art. 24 da Lei 14.133)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <input type="checkbox" name="permiteConsorcio" checked={formData.permiteConsorcio} onChange={handleChange} />
              Permite Consórcio
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <input type="checkbox" name="permiteSubcontrato" checked={formData.permiteSubcontrato} onChange={handleChange} />
              Permite Subcontratação
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <input type="checkbox" name="exigeVisita" checked={formData.exigeVisita} onChange={handleChange} />
              Exige Visita Técnica / Declaração
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <input type="checkbox" name="exigeGarantia" checked={formData.exigeGarantia} onChange={handleChange} />
              Exige Garantia de Proposta
            </label>
          </div>
        </div>

        {/* Bloco 6: Observações */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--color-primary)' }} />
            6. Observações & Estratégia Interna
          </h3>

          <div className="form-group">
            <label className="form-label">Notas do Operador / Recomendações da Diretoria</label>
            <textarea 
              name="observacoes" 
              value={formData.observacoes} 
              onChange={handleChange} 
              className="form-control" 
              rows={3} 
              placeholder="Anotações sobre concorrentes, estratégia de lances, contato com parceiros..." 
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <Link href={`/dashboard/licitacoes/${licitacao.id}`} className="btn btn-secondary">
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={loading || deleting} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px', justifyContent: 'center' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
