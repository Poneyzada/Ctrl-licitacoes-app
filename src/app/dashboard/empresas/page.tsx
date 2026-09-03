"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, Briefcase, Plus, 
  Phone, Mail, MapPin, ShieldCheck, Loader2, X, Save, Layers,
  Download, Edit3, Trash2, Calendar, CheckCircle2, AlertTriangle,
  ExternalLink, Search, Check, Shield, UserPlus, FileUp
} from 'lucide-react';

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Nova Empresa
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEmpresa, setNewEmpresa] = useState({
    name: '',
    tradeName: '',
    cnpj: '',
    type: 'PROPRIA',
    email: '',
    phone: '',
    address: '',
    city: 'Fortaleza',
    state: 'CE',
    notes: ''
  });

  // Modal Detalhes & Gestão Completa da Empresa
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyTab, setCompanyTab] = useState<'dados' | 'acervos' | 'profissionais' | 'certidoes'>('acervos');
  const [loadingCompanyDetails, setLoadingCompanyDetails] = useState(false);

  // Form Edição da Empresa
  const [editCompanyData, setEditCompanyData] = useState<any>({});
  const [savingEditCompany, setSavingEditCompany] = useState(false);

  // Modal Nova CAT / Atestado para a Empresa
  const [modalCatOpen, setModalCatOpen] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [newCatData, setNewCatData] = useState({
    numeroCat: '',
    numeroAtestado: '',
    emitente: '',
    objeto: '',
    tipoServico: 'EXECUCAO_INFRAESTRUTURA',
    areaTecnica: 'Infraestrutura Urbana / Rodoviária',
    local: 'Fortaleza / CE',
    uf: 'CE',
    urlOrigem: '',
    responsavelTecnico: ''
  });

  // Modal Editar CAT Individual
  const [modalEditCatOpen, setModalEditCatOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [savingEditCat, setSavingEditCat] = useState(false);

  // Modal Novo Profissional / Parceiro para a Empresa
  const [modalProfOpen, setModalProfOpen] = useState(false);
  const [savingProf, setSavingProf] = useState(false);
  const [newProfData, setNewProfData] = useState({
    nome: '',
    funcao: 'Engenheiro Civil Sênior',
    vinculo: 'CLT',
    conselho: 'CREA',
    numeroConselho: '',
    situacaoConselho: 'ATIVO',
    formacao: 'Engenharia Civil'
  });

  // Modal Nova Certidão de Habilitação
  const [modalCertidaoOpen, setModalCertidaoOpen] = useState(false);
  const [savingCertidao, setSavingCertidao] = useState(false);
  const [newCertidaoData, setNewCertidaoData] = useState({
    nome: 'Certidão Negativa de Débitos Federais (PGFN)',
    tipo: 'CND_FEDERAL',
    numero: '',
    emissor: 'Receita Federal / PGFN',
    vencimento: '',
    storageUrl: '',
    status: 'VIGENTE'
  });

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/empresas');
      if (res.ok) {
        const data = await res.json();
        setEmpresas(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCompanyManagement = async (empresa: any, defaultTab: 'dados' | 'acervos' | 'profissionais' | 'certidoes' = 'acervos') => {
    setCompanyTab(defaultTab);
    setSelectedEmpresa(empresa);
    setEditCompanyData({
      name: empresa.name || '',
      tradeName: empresa.tradeName || '',
      cnpj: empresa.cnpj || '',
      type: empresa.type || 'PROPRIA',
      email: empresa.email || '',
      phone: empresa.phone || '',
      address: empresa.address || '',
      city: empresa.city || 'Fortaleza',
      state: empresa.state || 'CE',
      notes: empresa.notes || ''
    });
    setCompanyModalOpen(true);

    // Carregar detalhes completos da empresa (acervos, profissionais, certidões)
    setLoadingCompanyDetails(true);
    try {
      const res = await fetch(`/api/empresas/${empresa.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setSelectedEmpresa(fullData);
        setEditCompanyData({
          name: fullData.name || '',
          tradeName: fullData.tradeName || '',
          cnpj: fullData.cnpj || '',
          type: fullData.type || 'PROPRIA',
          email: fullData.email || '',
          phone: fullData.phone || '',
          address: fullData.address || '',
          city: fullData.city || 'Fortaleza',
          state: fullData.state || 'CE',
          notes: fullData.notes || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCompanyDetails(false);
    }
  };

  const handleSaveCompanyData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa) return;

    setSavingEditCompany(true);
    try {
      const res = await fetch(`/api/empresas/${selectedEmpresa.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCompanyData)
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedEmpresa((prev: any) => ({ ...prev, ...updated }));
        fetchEmpresas();
        alert('Dados da empresa atualizados com sucesso!');
      } else {
        alert('Erro ao atualizar empresa');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar');
    } finally {
      setSavingEditCompany(false);
    }
  };

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpresa.name) {
      alert('Nome da empresa é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmpresa)
      });
      if (res.ok) {
        setModalOpen(false);
        setNewEmpresa({
          name: '',
          tradeName: '',
          cnpj: '',
          type: 'PROPRIA',
          email: '',
          phone: '',
          address: '',
          city: 'Fortaleza',
          state: 'CE',
          notes: ''
        });
        fetchEmpresas();
      } else {
        alert('Erro ao salvar empresa');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // --- Gestão de CATs da Empresa ---
  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa || !newCatData.emitente || !newCatData.objeto) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setSavingCat(true);
    try {
      const res = await fetch('/api/acervo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCatData,
          orgId: selectedEmpresa.id,
          quantitativos: '[]'
        })
      });

      if (res.ok) {
        setModalCatOpen(false);
        setNewCatData({
          numeroCat: '',
          numeroAtestado: '',
          emitente: '',
          objeto: '',
          tipoServico: 'EXECUCAO_INFRAESTRUTURA',
          areaTecnica: 'Infraestrutura Urbana / Rodoviária',
          local: 'Fortaleza / CE',
          uf: 'CE',
          urlOrigem: '',
          responsavelTecnico: ''
        });
        openCompanyManagement(selectedEmpresa, 'acervos');
        fetchEmpresas();
      } else {
        alert('Erro ao cadastrar atestado/CAT');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCat(false);
    }
  };

  const handleSaveEditCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;

    setSavingEditCat(true);
    try {
      const res = await fetch(`/api/acervo/${editingCat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCat)
      });

      if (res.ok) {
        setModalEditCatOpen(false);
        openCompanyManagement(selectedEmpresa, 'acervos');
        fetchEmpresas();
      } else {
        alert('Erro ao atualizar atestado');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEditCat(false);
    }
  };

  // --- Gestão de Profissionais da Empresa ---
  const handleCreateProf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa || !newProfData.nome) {
      alert('Nome do profissional é obrigatório');
      return;
    }

    setSavingProf(true);
    try {
      const res = await fetch('/api/profissionais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProfData,
          orgId: selectedEmpresa.id
        })
      });

      if (res.ok) {
        setModalProfOpen(false);
        setNewProfData({
          nome: '',
          funcao: 'Engenheiro Civil Sênior',
          vinculo: 'CLT',
          conselho: 'CREA',
          numeroConselho: '',
          situacaoConselho: 'ATIVO',
          formacao: 'Engenharia Civil'
        });
        openCompanyManagement(selectedEmpresa, 'profissionais');
        fetchEmpresas();
      } else {
        alert('Erro ao vincular profissional');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProf(false);
    }
  };

  // --- Gestão de Certidões ---
  const handleCreateCertidao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa || !newCertidaoData.nome) {
      alert('Nome da certidão é obrigatório');
      return;
    }

    setSavingCertidao(true);
    try {
      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCertidaoData,
          orgId: selectedEmpresa.id,
          vencimento: newCertidaoData.vencimento ? new Date(newCertidaoData.vencimento).toISOString() : null
        })
      });

      if (res.ok) {
        setModalCertidaoOpen(false);
        openCompanyManagement(selectedEmpresa, 'certidoes');
        fetchEmpresas();
      } else {
        alert('Erro ao cadastrar certidão');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCertidao(false);
    }
  };

  const filteredEmpresas = empresas.filter(e => 
    !searchQuery || 
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.tradeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.cnpj?.includes(searchQuery)
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={26} style={{ color: 'var(--color-primary)' }} />
            Empresas, Acervos & Habilitação Corporativa
          </h1>
          <p className="page-subtitle">
            Gestão das entidades titulares (UFC Engenharia e Pórtico Construções), parceiras, acervos técnicos e certidões
          </p>
        </div>

        <button 
          onClick={() => setModalOpen(true)}
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Nova Empresa / Parceira
        </button>
      </div>

      {/* Busca */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por Razão Social, Nome Fantasia ou CNPJ..." 
          className="form-control"
          style={{ width: '100%', height: '38px' }}
        />
      </div>

      {/* Grid of Corporate Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando dados corporativos...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '22px' }}>
          {filteredEmpresas.map((emp) => {
            const isUfc = emp.name.toLowerCase().includes('ufc');

            return (
              <div 
                key={emp.id} 
                className="card"
                style={{
                  padding: '0',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  transition: 'all var(--transition-base)'
                }}
              >
                {/* Header Banner */}
                <div style={{ 
                  padding: '20px 24px', 
                  borderBottom: '1px solid var(--border-color)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.2) 100%)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: 'var(--radius-md)', 
                      background: isUfc ? 'rgba(34, 197, 94, 0.12)' : 'rgba(232, 93, 93, 0.12)',
                      color: isUfc ? '#34d399' : 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Building2 size={22} />
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 700, 
                        padding: '3px 9px', 
                        borderRadius: 'var(--radius-sm)',
                        background: emp.type === 'PROPRIA' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: emp.type === 'PROPRIA' ? '#34d399' : '#fbbf24',
                        border: `1px solid ${emp.type === 'PROPRIA' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                      }}>
                        {emp.type === 'PROPRIA' ? 'EMPRESA PRÓPRIA' : emp.type}
                      </span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {emp.tradeName || emp.name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {emp.name}
                  </div>
                  {emp.cnpj && (
                    <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                      CNPJ: {emp.cnpj}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  {emp.city && emp.state && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{emp.address ? `${emp.address} — ` : ''}{emp.city} / {emp.state}</span>
                    </div>
                  )}

                  {emp.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{emp.phone}</span>
                    </div>
                  )}

                  {emp.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{emp.email}</span>
                    </div>
                  )}
                </div>

                {/* Quick Action Footer */}
                <div style={{ 
                  marginTop: 'auto', 
                  background: 'var(--bg-elevated)', 
                  borderTop: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  padding: '12px 16px',
                  textAlign: 'center',
                  gap: '4px'
                }}>
                  <button 
                    onClick={() => openCompanyManagement(emp, 'acervos')}
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px' }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Acervos</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>{emp._count?.acervo || 0}</span>
                  </button>

                  <button 
                    onClick={() => openCompanyManagement(emp, 'profissionais')}
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Parceiros / RT</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>{emp._count?.licitacoes || 2}</span>
                  </button>

                  <button 
                    onClick={() => openCompanyManagement(emp, 'certidoes')}
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px' }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Certidões</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>{emp._count?.complianceDocs || 0}</span>
                  </button>
                </div>

                {/* Direct Management Button */}
                <div style={{ padding: '10px 16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)' }}>
                  <button 
                    onClick={() => openCompanyManagement(emp, 'acervos')}
                    className="btn btn-primary w-full btn-sm"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Layers size={14} />
                    Gerenciar Acervo, CATs & Habilitação
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL GESTÃO COMPLETA DA EMPRESA (ACERVOS, PARCEIROS, DOCS) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {companyModalOpen && selectedEmpresa && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={() => setCompanyModalOpen(false)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '1000px', 
              width: '100%', 
              maxHeight: '92vh', 
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {selectedEmpresa.tradeName || selectedEmpresa.name}
                    </h2>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#34d399' }}>
                      {selectedEmpresa.type}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    {selectedEmpresa.name} • CNPJ: {selectedEmpresa.cnpj || 'S/N'}
                  </p>
                </div>
              </div>

              <button onClick={() => setCompanyModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={22} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setCompanyTab('acervos')}
                className={`btn btn-sm ${companyTab === 'acervos' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileText size={15} />
                Acervo Técnico & CATs ({selectedEmpresa.acervo?.length || 0})
              </button>

              <button 
                onClick={() => setCompanyTab('profissionais')}
                className={`btn btn-sm ${companyTab === 'profissionais' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Users size={15} />
                Parceiros Profissionais & RT ({selectedEmpresa.profissionais?.length || 0})
              </button>

              <button 
                onClick={() => setCompanyTab('certidoes')}
                className={`btn btn-sm ${companyTab === 'certidoes' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ShieldCheck size={15} />
                Certidões & Habilitação ({selectedEmpresa.complianceDocs?.length || 0})
              </button>

              <button 
                onClick={() => setCompanyTab('dados')}
                className={`btn btn-sm ${companyTab === 'dados' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={15} />
                Editar Dados da Empresa
              </button>
            </div>

            {/* Content per Tab */}
            {loadingCompanyDetails ? (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 10px', color: 'var(--color-primary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Carregando dados completos...</p>
              </div>
            ) : (
              <div>
                {/* ─── ABA ACERVOS ─── */}
                {companyTab === 'acervos' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Atestados de Capacidade Técnica da Empresa</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Documentos comprobatórios para qualificação técnico-operacional</p>
                      </div>

                      <button 
                        onClick={() => setModalCatOpen(true)}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={15} /> Registrar Novo Atestado / CAT
                      </button>
                    </div>

                    {(!selectedEmpresa.acervo || selectedEmpresa.acervo.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                        <FileText size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Nenhum atestado cadastrado para esta empresa.</p>
                        <button onClick={() => setModalCatOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}>
                          <Plus size={14} /> Cadastrar Primeiro Atestado
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto' }}>
                        {selectedEmpresa.acervo.map((cat: any) => (
                          <div 
                            key={cat.id} 
                            style={{ 
                              background: 'var(--bg-elevated)', 
                              padding: '14px 18px', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '14px'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                                  CAT: {cat.numeroCat || cat.numeroAtestado || 'S/N'}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {cat.uf || 'CE/BA'} • {cat.tipoServico || 'Execução'}
                                </span>
                              </div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.35 }}>
                                {cat.objeto}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                                Contratante: {cat.emitente} {cat.responsavelTecnico ? `• RT: ${cat.responsavelTecnico}` : ''}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                              <button 
                                onClick={() => { setEditingCat(cat); setModalEditCatOpen(true); }}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Edit3 size={13} /> Editar
                              </button>

                              {(cat.urlOrigem || cat.storageUrl) ? (
                                <a 
                                  href={cat.urlOrigem || cat.storageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                                >
                                  <Download size={14} /> Baixar PDF
                                </a>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '6px' }}>Sem link</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── ABA PROFISSIONAIS / PARCEIROS ─── */}
                {companyTab === 'profissionais' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Parceiros Profissionais & Responsáveis Técnicos</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Engenheiros e arquitetos vinculados à empresa para qualificação técnico-profissional</p>
                      </div>

                      <button 
                        onClick={() => setModalProfOpen(true)}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <UserPlus size={15} /> Vincular Novo Parceiro / RT
                      </button>
                    </div>

                    {(!selectedEmpresa.profissionais || selectedEmpresa.profissionais.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                        <Users size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Nenhum profissional vinculado a esta empresa.</p>
                        <button onClick={() => setModalProfOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}>
                          <UserPlus size={14} /> Vincular Profissional
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                        {selectedEmpresa.profissionais.map((prof: any) => (
                          <div key={prof.id} style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c084fc', background: 'rgba(168, 85, 247, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {prof.conselho} {prof.numeroConselho || 'ATIVO'}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
                                  {prof.vinculo}
                                </span>
                              </div>
                              <h5 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 2px' }}>
                                {prof.nome}
                              </h5>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {prof.funcao}
                              </div>
                              {prof.formacao && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  Formação: {prof.formacao}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600 }}>
                                {prof.acervos?.length || 0} CATs no Acervo
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── ABA CERTIDÕES & COMPLIANCE ─── */}
                {companyTab === 'certidoes' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Certidões Negativas & Habilitação Jurídica/Fiscal</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Documentos de regularidade fiscal, trabalhista e jurídica da empresa</p>
                      </div>

                      <button 
                        onClick={() => setModalCertidaoOpen(true)}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={15} /> Registrar Nova Certidão
                      </button>
                    </div>

                    {(!selectedEmpresa.complianceDocs || selectedEmpresa.complianceDocs.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                        <ShieldCheck size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Nenhuma certidão registrada para esta empresa.</p>
                        <button onClick={() => setModalCertidaoOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}>
                          <Plus size={14} /> Cadastrar Certidão
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedEmpresa.complianceDocs.map((doc: any) => (
                          <div 
                            key={doc.id} 
                            style={{ 
                              background: 'var(--bg-elevated)', 
                              padding: '14px 18px', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '14px'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                                  {doc.tipo}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>
                                  {doc.vencimento ? `Vencimento: ${new Date(doc.vencimento).toLocaleDateString('pt-BR')}` : 'Sem Vencimento'}
                                </span>
                              </div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                {doc.nome}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Emissor: {doc.emissor || 'Órgão Competente'} {doc.numero ? `• Nº: ${doc.numero}` : ''}
                              </div>
                            </div>

                            <div>
                              {(doc.storageUrl) ? (
                                <a 
                                  href={doc.storageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                                >
                                  <Download size={14} /> Baixar Certidão
                                </a>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vigente</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── ABA DADOS CADASTRAIS (EDIÇÃO) ─── */}
                {companyTab === 'dados' && (
                  <form onSubmit={handleSaveCompanyData} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label">Razão Social *</label>
                        <input 
                          value={editCompanyData.name} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, name: e.target.value })}
                          className="form-control" 
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Nome Fantasia</label>
                        <input 
                          value={editCompanyData.tradeName} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, tradeName: e.target.value })}
                          className="form-control" 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label">CNPJ</label>
                        <input 
                          value={editCompanyData.cnpj} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, cnpj: e.target.value })}
                          className="form-control" 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Tipo de Entidade</label>
                        <select 
                          value={editCompanyData.type} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, type: e.target.value })}
                          className="form-control"
                        >
                          <option value="PROPRIA">Empresa Própria</option>
                          <option value="PARCEIRA">Empresa Parceira</option>
                          <option value="CONSORCIO">Consórcio / SPE</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label">Email Institucional</label>
                        <input 
                          value={editCompanyData.email} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, email: e.target.value })}
                          className="form-control" 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Telefone de Contato</label>
                        <input 
                          value={editCompanyData.phone} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, phone: e.target.value })}
                          className="form-control" 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.6fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label">Endereço Completo</label>
                        <input 
                          value={editCompanyData.address} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, address: e.target.value })}
                          className="form-control" 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Cidade</label>
                        <input 
                          value={editCompanyData.city} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, city: e.target.value })}
                          className="form-control" 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">UF</label>
                        <input 
                          value={editCompanyData.state} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, state: e.target.value })}
                          className="form-control" 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                      <button type="button" onClick={() => setCompanyModalOpen(false)} className="btn btn-secondary">
                        Fechar
                      </button>
                      <button type="submit" disabled={savingEditCompany} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {savingEditCompany ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar Alterações da Empresa
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAIS SECUNDÁRIOS: NOVA CAT, EDITAR CAT, PROFISSIONAL, ETC */}
      {/* ─────────────────────────────────────────────────────────── */}
      {/* Modal Registrar Nova CAT */}
      {modalCatOpen && selectedEmpresa && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}
        onClick={() => setModalCatOpen(false)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '650px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Registrar Atestado / CAT</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Empresa: {selectedEmpresa.tradeName || selectedEmpresa.name}</p>
              </div>
              <button onClick={() => setModalCatOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCat} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Número da CAT *</label>
                  <input 
                    value={newCatData.numeroCat} 
                    onChange={(e) => setNewCatData({ ...newCatData, numeroCat: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 247128/2024"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Órgão Emitente / Contratante *</label>
                  <input 
                    value={newCatData.emitente} 
                    onChange={(e) => setNewCatData({ ...newCatData, emitente: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: SEINFRA / DER"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Objeto da Obra ou Serviço *</label>
                <textarea 
                  value={newCatData.objeto} 
                  onChange={(e) => setNewCatData({ ...newCatData, objeto: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Descrição do serviço executado pela empresa..." 
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Serviço</label>
                  <select 
                    value={newCatData.tipoServico} 
                    onChange={(e) => setNewCatData({ ...newCatData, tipoServico: e.target.value })}
                    className="form-control"
                  >
                    <option value="EXECUCAO_INFRAESTRUTURA">Execução de Infraestrutura</option>
                    <option value="ELABORACAO_PROJETOS">Elaboração de Projetos</option>
                    <option value="SUPERVISAO_FISCALIZACAO">Supervisão / Fiscalização</option>
                    <option value="GERENCIAMENTO">Gerenciamento</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Área Técnica</label>
                  <input 
                    value={newCatData.areaTecnica} 
                    onChange={(e) => setNewCatData({ ...newCatData, areaTecnica: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Pavimentação e Drenagem"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Local da Obra</label>
                  <input 
                    value={newCatData.local} 
                    onChange={(e) => setNewCatData({ ...newCatData, local: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Fortaleza"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">UF</label>
                  <input 
                    value={newCatData.uf} 
                    onChange={(e) => setNewCatData({ ...newCatData, uf: e.target.value })}
                    className="form-control" 
                    placeholder="CE"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Link do Arquivo PDF (Google Drive / Nuvem)</label>
                <input 
                  value={newCatData.urlOrigem} 
                  onChange={(e) => setNewCatData({ ...newCatData, urlOrigem: e.target.value })}
                  className="form-control" 
                  placeholder="https://drive.google.com/file/d/..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalCatOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingCat} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {savingCat ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Atestado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar CAT */}
      {modalEditCatOpen && editingCat && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}
        onClick={() => setModalEditCatOpen(false)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '650px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editar Atestado Técnico / CAT</h3>
              </div>
              <button onClick={() => setModalEditCatOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditCat} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Número da CAT</label>
                  <input 
                    value={editingCat.numeroCat || ''} 
                    onChange={(e) => setEditingCat({ ...editingCat, numeroCat: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Órgão Emitente *</label>
                  <input 
                    value={editingCat.emitente || ''} 
                    onChange={(e) => setEditingCat({ ...editingCat, emitente: e.target.value })}
                    className="form-control" 
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Objeto da Obra ou Serviço *</label>
                <textarea 
                  value={editingCat.objeto || ''} 
                  onChange={(e) => setEditingCat({ ...editingCat, objeto: e.target.value })}
                  className="form-control" 
                  rows={2}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Link do Arquivo PDF (Google Drive / Nuvem)</label>
                <input 
                  value={editingCat.urlOrigem || editingCat.storageUrl || ''} 
                  onChange={(e) => setEditingCat({ ...editingCat, urlOrigem: e.target.value, storageUrl: e.target.value })}
                  className="form-control" 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalEditCatOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingEditCat} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {savingEditCat ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Vincular Profissional à Empresa */}
      {modalProfOpen && selectedEmpresa && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}
        onClick={() => setModalProfOpen(false)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '600px', 
              width: '100%', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Vincular Parceiro / Engenheiro</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Empresa: {selectedEmpresa.tradeName || selectedEmpresa.name}</p>
              </div>
              <button onClick={() => setModalProfOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProf} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input 
                  value={newProfData.nome} 
                  onChange={(e) => setNewProfData({ ...newProfData, nome: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Eng. Mariana Costa"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Função / Cargo</label>
                  <input 
                    value={newProfData.funcao} 
                    onChange={(e) => setNewProfData({ ...newProfData, funcao: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Vínculo</label>
                  <select 
                    value={newProfData.vinculo} 
                    onChange={(e) => setNewProfData({ ...newProfData, vinculo: e.target.value })}
                    className="form-control"
                  >
                    <option value="CLT">CLT</option>
                    <option value="PJ">PJ (Prestador)</option>
                    <option value="SOCIO">Sócio</option>
                    <option value="PARCEIRO">Parceiro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Conselho</label>
                  <input 
                    value={newProfData.conselho} 
                    onChange={(e) => setNewProfData({ ...newProfData, conselho: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Registro (CREA/CAU)</label>
                  <input 
                    value={newProfData.numeroConselho} 
                    onChange={(e) => setNewProfData({ ...newProfData, numeroConselho: e.target.value })}
                    className="form-control" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalProfOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingProf} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {savingProf ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Vincular Profissional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Certidão */}
      {modalCertidaoOpen && selectedEmpresa && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}
        onClick={() => setModalCertidaoOpen(false)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '600px', 
              width: '100%', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Registrar Certidão / Habilitação</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Empresa: {selectedEmpresa.tradeName || selectedEmpresa.name}</p>
              </div>
              <button onClick={() => setModalCertidaoOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCertidao} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nome do Documento / Certidão *</label>
                <input 
                  value={newCertidaoData.nome} 
                  onChange={(e) => setNewCertidaoData({ ...newCertidaoData, nome: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: CND Federal (Receita / PGFN)"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Órgão Emissor</label>
                  <input 
                    value={newCertidaoData.emissor} 
                    onChange={(e) => setNewCertidaoData({ ...newCertidaoData, emissor: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data de Vencimento</label>
                  <input 
                    type="date"
                    value={newCertidaoData.vencimento} 
                    onChange={(e) => setNewCertidaoData({ ...newCertidaoData, vencimento: e.target.value })}
                    className="form-control" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Link do Arquivo PDF (Google Drive / Nuvem)</label>
                <input 
                  value={newCertidaoData.storageUrl} 
                  onChange={(e) => setNewCertidaoData({ ...newCertidaoData, storageUrl: e.target.value })}
                  className="form-control" 
                  placeholder="https://drive.google.com/file/d/..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalCertidaoOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingCertidao} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {savingCertidao ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Certidão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Nova Empresa */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cadastrar Empresa / Parceira</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmpresa} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Razão Social *</label>
                <input 
                  value={newEmpresa.name} 
                  onChange={(e) => setNewEmpresa({ ...newEmpresa, name: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: UFC Engenharia Ltda"
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Nome Fantasia</label>
                  <input 
                    value={newEmpresa.tradeName} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, tradeName: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: UFC Engenharia" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input 
                    value={newEmpresa.cnpj} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, cnpj: e.target.value })}
                    className="form-control" 
                    placeholder="00.000.000/0001-00" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Entidade</label>
                  <select 
                    value={newEmpresa.type} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, type: e.target.value })}
                    className="form-control"
                  >
                    <option value="PROPRIA">Empresa Própria</option>
                    <option value="PARCEIRA">Empresa Parceira</option>
                    <option value="CONSORCIO">Consórcio / SPE</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Email de Contato</label>
                  <input 
                    value={newEmpresa.email} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, email: e.target.value })}
                    className="form-control" 
                    placeholder="contato@empresa.com" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.6fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <input 
                    value={newEmpresa.address} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, address: e.target.value })}
                    className="form-control" 
                    placeholder="Av. das Construções, 500" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input 
                    value={newEmpresa.city} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, city: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">UF</label>
                  <input 
                    value={newEmpresa.state} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, state: e.target.value })}
                    className="form-control" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Cadastrar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
