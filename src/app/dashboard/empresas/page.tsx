"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, Briefcase, Plus, 
  Phone, Mail, MapPin, ShieldCheck, Loader2, X, Save, Layers,
  Download, Edit3, Trash2, Calendar, CheckCircle2, AlertTriangle,
  ExternalLink, Search, Check, Shield, UserPlus, FileUp, Award, FolderOpen, Eye
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function EmpresasPage() {
  const [mainTab, setMainTab] = useState<'empresas' | 'profissionais'>('empresas');
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profSearch, setProfSearch] = useState('');
  const [profOrgFilter, setProfOrgFilter] = useState('ALL');
  const [profConselhoFilter, setProfConselhoFilter] = useState('ALL');

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
    notes: '',
    areasAtuacao: '',
    documentName: 'Cartão CNPJ e Comprovante de Inscrição.pdf',
    cnpjCardUrl: ''
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
    tipoServico: 'PAVIMENTACAO_INFRAESTRUTURA',
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

  // Modal Novo Profissional / Engenheiro
  const [modalProfOpen, setModalProfOpen] = useState(false);
  const [savingProf, setSavingProf] = useState(false);
  const [newProfData, setNewProfData] = useState({
    orgId: '',
    nome: '',
    funcao: 'Engenheiro Civil Pleno',
    vinculo: 'CLT',
    conselho: 'CREA',
    numeroConselho: '',
    situacaoConselho: 'ATIVO',
    formacao: 'Engenharia Civil',
    resumoProfissional: '',
    storageUrl: '',
    storageKey: ''
  });

  // Modal Editar Profissional
  const [editProfModalOpen, setEditProfModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<any>(null);
  const [editProfData, setEditProfData] = useState<any>({});
  const [savingEditProf, setSavingEditProf] = useState(false);

  const downloadOrOpenDoc = (url: string, name: string) => {
    if (!url) {
      alert('Arquivo sem anexo ou link de visualização disponível.');
      return;
    }
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = name && name.includes('.') ? name : `${name || 'documento'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(url, '_blank');
    }
  };

  // Modal Pasta Técnica do Profissional (Dossiê de CATs & Certidões)
  const [selectedProfDossie, setSelectedProfDossie] = useState<any>(null);
  const [dossieModalOpen, setDossieModalOpen] = useState(false);

  // Modal Adicionar CAT direta ao Profissional
  const [modalProfCatOpen, setModalProfCatOpen] = useState(false);
  const [savingProfCat, setSavingProfCat] = useState(false);
  const [newProfCatData, setNewProfCatData] = useState({
    numeroCat: '',
    numeroAtestado: '',
    emitente: '',
    objeto: '',
    tipoServico: 'PAVIMENTACAO_INFRAESTRUTURA',
    areaTecnica: 'Obras Civis / Infraestrutura',
    local: '',
    uf: 'CE',
    urlOrigem: ''
  });

  // Modal Nova Certidão de Habilitação da Empresa
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
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resEmp, resProf] = await Promise.all([
        fetch('/api/empresas'),
        fetch('/api/profissionais')
      ]);

      if (resEmp.ok) {
        const dataEmp = await resEmp.json();
        setEmpresas(dataEmp);
        if (dataEmp.length > 0) {
          setNewProfData(prev => ({ ...prev, orgId: dataEmp[0].id }));
        }
      }

      if (resProf.ok) {
        const dataProf = await resProf.json();
        setProfessionals(dataProf);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
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
        loadAllData();
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
      alert('Razão Social da empresa é obrigatória.');
      return;
    }

    setSaving(true);
    try {
      const notesComAreas = newEmpresa.areasAtuacao 
        ? `${newEmpresa.notes ? newEmpresa.notes + '\n\n' : ''}[ÁREAS DE ATUAÇÃO]: ${newEmpresa.areasAtuacao}`
        : newEmpresa.notes;

      const payload = {
        ...newEmpresa,
        notes: notesComAreas
      };

      const res = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
          notes: '',
          areasAtuacao: '',
          documentName: 'Cartão CNPJ e Comprovante de Inscrição.pdf',
          cnpjCardUrl: ''
        });
        loadAllData();
        alert('Empresa cadastrada com sucesso!');
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao cadastrar empresa');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  // --- Gestão de Profissionais ---
  const handleCreateProf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfData.nome || !newProfData.orgId) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    setSavingProf(true);
    try {
      const res = await fetch('/api/profissionais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfData)
      });

      if (res.ok) {
        setModalProfOpen(false);
        setNewProfData({
          orgId: empresas[0]?.id || '',
          nome: '',
          funcao: 'Engenheiro Civil Pleno',
          vinculo: 'CLT',
          conselho: 'CREA',
          numeroConselho: '',
          situacaoConselho: 'ATIVO',
          formacao: 'Engenharia Civil',
          resumoProfissional: '',
          storageUrl: '',
          storageKey: ''
        });
        loadAllData();
        alert('Profissional cadastrado com sucesso!');
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar profissional');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar');
    } finally {
      setSavingProf(false);
    }
  };

  const openDossie = (prof: any) => {
    setSelectedProfDossie(prof);
    setDossieModalOpen(true);
  };

  const openEditProf = (prof: any) => {
    setEditingProf(prof);
    setEditProfData({
      nome: prof.nome || '',
      orgId: prof.orgId || '',
      funcao: prof.funcao || '',
      vinculo: prof.vinculo || 'CLT',
      conselho: prof.conselho || 'CREA',
      numeroConselho: prof.numeroConselho || '',
      situacaoConselho: prof.situacaoConselho || 'ATIVO',
      formacao: prof.formacao || '',
      resumoProfissional: prof.resumoProfissional || '',
      storageUrl: prof.storageUrl || '',
      storageKey: prof.storageKey || ''
    });
    setEditProfModalOpen(true);
  };

  const handleSaveEditProf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProf) return;

    setSavingEditProf(true);
    try {
      const res = await fetch(`/api/profissionais/${editingProf.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProfData)
      });

      if (res.ok) {
        setEditProfModalOpen(false);
        loadAllData();
        if (selectedProfDossie?.id === editingProf.id) {
          const updated = await res.json();
          setSelectedProfDossie((prev: any) => ({ ...prev, ...updated }));
        }
        alert('Dados do profissional atualizados com sucesso!');
      } else {
        alert('Erro ao atualizar profissional');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar');
    } finally {
      setSavingEditProf(false);
    }
  };

  const handleDeleteProf = async (prof: any) => {
    if (!confirm(`Deseja remover o profissional "${prof.nome}" do quadro técnico?`)) return;

    try {
      const res = await fetch(`/api/profissionais/${prof.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDossieModalOpen(false);
        loadAllData();
        alert('Profissional removido com sucesso!');
      } else {
        alert('Erro ao remover profissional');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao excluir');
    }
  };

  const handleAddProfCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfDossie) return;

    setSavingProfCat(true);
    try {
      const res = await fetch('/api/acervo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProfCatData,
          orgId: selectedProfDossie.orgId,
          responsavelTecnico: selectedProfDossie.nome
        })
      });

      if (res.ok) {
        setModalProfCatOpen(false);
        setNewProfCatData({
          numeroCat: '',
          numeroAtestado: '',
          emitente: '',
          objeto: '',
          tipoServico: 'PAVIMENTACAO_INFRAESTRUTURA',
          areaTecnica: 'Obras Civis / Infraestrutura',
          local: '',
          uf: 'CE',
          urlOrigem: ''
        });
        loadAllData();
        alert('CAT vinculada ao acervo com sucesso!');
      } else {
        alert('Erro ao vincular CAT');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar CAT');
    } finally {
      setSavingProfCat(false);
    }
  };

  // --- Funções de Certidão e CAT da Empresa ---
  const handleCreateCertidao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa || !newCertidaoData.nome) return;

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
        loadAllData();
        alert('Certidão registrada com sucesso!');
      } else {
        alert('Erro ao registrar certidão');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão');
    } finally {
      setSavingCertidao(false);
    }
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa || !newCatData.objeto) return;

    setSavingCat(true);
    try {
      const res = await fetch('/api/acervo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCatData,
          orgId: selectedEmpresa.id
        })
      });

      if (res.ok) {
        setModalCatOpen(false);
        openCompanyManagement(selectedEmpresa, 'acervos');
        loadAllData();
        alert('CAT cadastrada com sucesso!');
      } else {
        alert('Erro ao cadastrar CAT');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão');
    } finally {
      setSavingCat(false);
    }
  };

  const filteredEmpresas = empresas.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.name && e.name.toLowerCase().includes(q)) ||
      (e.tradeName && e.tradeName.toLowerCase().includes(q)) ||
      (e.cnpj && e.cnpj.includes(q)) ||
      (e.notes && e.notes.toLowerCase().includes(q))
    );
  });

  const filteredProfessionals = professionals.filter(p => {
    const matchesOrg = profOrgFilter === 'ALL' || p.orgId === profOrgFilter;
    const matchesConselho = profConselhoFilter === 'ALL' || p.conselho === profConselhoFilter;
    const q = profSearch.toLowerCase();
    const matchesSearch = !profSearch || 
      (p.nome && p.nome.toLowerCase().includes(q)) ||
      (p.numeroConselho && p.numeroConselho.toLowerCase().includes(q)) ||
      (p.funcao && p.funcao.toLowerCase().includes(q)) ||
      (p.formacao && p.formacao.toLowerCase().includes(q));
    return matchesOrg && matchesConselho && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '22px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={26} style={{ color: 'var(--color-primary)' }} />
            Empresas, Habilitação & Quadro Técnico
          </h1>
          <p className="page-subtitle">
            Gestão de pessoas jurídicas (UFC, Pórtico e Parceiras), engenheiros RTs, certidões e habilitação técnica
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {mainTab === 'empresas' ? (
            <button 
              onClick={() => setModalOpen(true)} 
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} />
              Cadastrar Nova Empresa
            </button>
          ) : (
            <button 
              onClick={() => setModalProfOpen(true)} 
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <UserPlus size={18} />
              Novo Engenheiro / Profissional
            </button>
          )}
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setMainTab('empresas')}
          className={`btn ${mainTab === 'empresas' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.9rem' }}
        >
          <Building2 size={18} />
          Empresas Cadastradas ({empresas.length})
        </button>

        <button
          onClick={() => setMainTab('profissionais')}
          className={`btn ${mainTab === 'profissionais' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.9rem' }}
        >
          <Award size={18} />
          Quadro Técnico & Engenheiros ({professionals.length})
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ABA 1: EMPRESAS CADASTRADAS                                */}
      {/* ─────────────────────────────────────────────────────────── */}
      {mainTab === 'empresas' && (
        <div>
          {/* Search bar */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: '20px', background: 'var(--bg-surface)' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar por razão social, nome fantasia, CNPJ ou área de atuação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px', height: '40px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Companies Grid */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
              Carregando dados das empresas...
            </div>
          ) : filteredEmpresas.length === 0 ? (
            <div className="card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Nenhuma empresa encontrada com os termos buscados.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {filteredEmpresas.map(emp => {
                const isUfc = emp.name.toLowerCase().includes('ufc');
                const isPortico = emp.name.toLowerCase().includes('pórtico') || emp.name.toLowerCase().includes('portico');
                const badgeColor = isUfc ? '#60a5fa' : isPortico ? 'var(--color-primary)' : '#fbbf24';
                const badgeBg = isUfc ? 'rgba(59, 130, 246, 0.15)' : isPortico ? 'rgba(232, 93, 93, 0.15)' : 'rgba(245, 158, 11, 0.15)';

                // Extrair áreas de atuação das notas se existir
                const areasMatch = emp.notes?.match(/\[ÁREAS DE ATUAÇÃO\]:\s*([^\n]+)/);
                const areasTexto = areasMatch ? areasMatch[1] : null;

                return (
                  <div 
                    key={emp.id} 
                    className="card" 
                    style={{ 
                      padding: '22px', 
                      background: 'var(--bg-surface)', 
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s, border-color 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '3px 9px', 
                          borderRadius: 'var(--radius-sm)',
                          background: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeColor}40`
                        }}>
                          {emp.type === 'PROPRIA' ? (isUfc ? 'UFC ENGENHARIA' : isPortico ? 'PÓRTICO CONSTRUÇÕES' : 'EMPRESA PRÓPRIA') : emp.type === 'CONSORCIO' ? 'CONSÓRCIO' : 'PARCEIRA OPERACIONAL'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {emp.city ? `${emp.city}/${emp.state || 'CE'}` : 'Brasil'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {emp.tradeName || emp.name}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {emp.name}
                      </p>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>
                        CNPJ: {emp.cnpj || 'Não informado'}
                      </div>

                      {areasTexto && (
                        <div style={{ 
                          fontSize: '0.78rem', 
                          color: 'var(--text-secondary)', 
                          background: 'rgba(255, 255, 255, 0.03)', 
                          padding: '8px 10px', 
                          borderRadius: 'var(--radius-sm)', 
                          marginBottom: '16px',
                          border: '1px solid var(--border-color)'
                        }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Atuação:</strong> {areasTexto}
                        </div>
                      )}

                      {/* Métricas da Empresa */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '18px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Atestados</span>
                          <strong style={{ fontSize: '1.05rem', color: '#60a5fa' }}>{emp._count?.acervo || 0}</strong>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>RTs / Equipe</span>
                          <strong style={{ fontSize: '1.05rem', color: '#34d399' }}>
                            {professionals.filter(p => p.orgId === emp.id).length}
                          </strong>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Certidões</span>
                          <strong style={{ fontSize: '1.05rem', color: '#fbbf24' }}>{emp._count?.complianceDocs || 0}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                      <button 
                        onClick={() => openCompanyManagement(emp, 'acervos')}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Layers size={14} /> Dossiê & CATs
                      </button>
                      <button 
                        onClick={() => openCompanyManagement(emp, 'dados')}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Edit3 size={14} /> Gerenciar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ABA 2: QUADRO TÉCNICO & ENGENHEIROS                        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {mainTab === 'profissionais' && (
        <div>
          {/* KPI Cards dos Profissionais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Profissionais Cadastrados</span>
                <Award size={18} style={{ color: '#60a5fa' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
                {professionals.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Engenheiros e RTs habilitados</span>
            </div>

            <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CATs Profissionais</span>
                <Layers size={18} style={{ color: '#34d399' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#34d399' }}>
                {professionals.reduce((acc, p) => acc + (p.acervos?.length || 0), 0)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atestados vinculados à equipe</span>
            </div>

            <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Conselhos Ativos</span>
                <ShieldCheck size={18} style={{ color: '#fbbf24' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}>
                {professionals.filter(p => p.situacaoConselho === 'ATIVO').length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Situação regular no CREA/CAU</span>
            </div>
          </div>

          {/* Filtros de Profissionais */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: '20px', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Buscar engenheiro por nome, CREA, função ou formação..."
                  value={profSearch}
                  onChange={(e) => setProfSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
                />
              </div>

              <select
                value={profOrgFilter}
                onChange={(e) => setProfOrgFilter(e.target.value)}
                className="form-control"
                style={{ height: '38px', fontSize: '0.85rem', minWidth: '180px' }}
              >
                <option value="ALL">Todas as Empresas</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.tradeName || emp.name}</option>
                ))}
              </select>

              <select
                value={profConselhoFilter}
                onChange={(e) => setProfConselhoFilter(e.target.value)}
                className="form-control"
                style={{ height: '38px', fontSize: '0.85rem', minWidth: '140px' }}
              >
                <option value="ALL">Todos Conselhos</option>
                <option value="CREA">CREA</option>
                <option value="CAU">CAU</option>
                <option value="CRQ">CRQ</option>
              </select>
            </div>
          </div>

          {/* Tabela de Profissionais */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', background: 'var(--bg-surface)' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
                Carregando profissionais...
              </div>
            ) : filteredProfessionals.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Nenhum engenheiro ou profissional encontrado.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Engenheiro / RT</th>
                      <th>Empresa Vinculada</th>
                      <th>Conselho / Registro</th>
                      <th>Vínculo</th>
                      <th>CATs Vinculadas</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfessionals.map(prof => {
                      const empNome = prof.organization?.tradeName || prof.organization?.name || 'Empresa Própria';
                      return (
                        <tr key={prof.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#60a5fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                border: '1px solid rgba(59, 130, 246, 0.3)'
                              }}>
                                {prof.nome.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                                  {prof.nome}
                                </strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {prof.funcao || 'Responsável Técnico'} • {prof.formacao || 'Engenharia Civil'}
                                </span>
                                {prof.storageUrl && (
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => downloadOrOpenDoc(prof.storageUrl, prof.storageKey || prof.nome)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.72rem',
                                        color: 'var(--color-primary)',
                                        background: 'rgba(232, 93, 93, 0.1)',
                                        border: '1px solid rgba(232, 93, 93, 0.25)',
                                        borderRadius: '4px',
                                        padding: '2px 7px',
                                        marginTop: '4px',
                                        cursor: 'pointer'
                                      }}
                                      title="Abrir / Baixar anexo do profissional"
                                    >
                                      <FileText size={11} />
                                      <span>{prof.storageKey || 'Ver Anexo'}</span>
                                      <Download size={10} style={{ opacity: 0.8 }} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              padding: '3px 8px', 
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)'
                            }}>
                              {empNome}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#60a5fa' }}>
                                {prof.conselho || 'CREA'}: {prof.numeroConselho || 'S/N'}
                              </span>
                              <span style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: 800, 
                                padding: '1px 6px', 
                                borderRadius: 'var(--radius-full)',
                                background: prof.situacaoConselho === 'ATIVO' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: prof.situacaoConselho === 'ATIVO' ? '#34d399' : '#f87171'
                              }}>
                                {prof.situacaoConselho || 'ATIVO'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {prof.vinculo || 'CLT'}
                            </span>
                          </td>
                          <td>
                            <span style={{ 
                              fontSize: '0.78rem', 
                              fontWeight: 700, 
                              color: prof.acervos && prof.acervos.length > 0 ? '#34d399' : 'var(--text-muted)' 
                            }}>
                              {prof.acervos?.length || 0} atestados
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              {prof.storageUrl && (
                                <button
                                  type="button"
                                  onClick={() => downloadOrOpenDoc(prof.storageUrl, prof.storageKey || prof.nome)}
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '6px 8px', color: 'var(--color-primary)' }}
                                  title="Baixar / Abrir Anexo do Profissional"
                                >
                                  <Download size={14} />
                                </button>
                              )}
                              <button 
                                onClick={() => openDossie(prof)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Abrir Pasta Técnica com CATs e Certidões"
                              >
                                <FolderOpen size={13} style={{ color: '#60a5fa' }} /> Pasta Técnica
                              </button>
                              <button 
                                onClick={() => openEditProf(prof)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 8px' }}
                                title="Editar Cadastro"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProf(prof)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 8px', color: '#ef4444' }}
                                title="Remover Profissional"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: PASTA TÉCNICA DO PROFISSIONAL (DOSSIÊ DE CATs)      */}
      {/* ─────────────────────────────────────────────────────────── */}
      {dossieModalOpen && selectedProfDossie && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div 
            className="card" 
            style={{ 
              maxWidth: '850px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px'
            }}
          >
            {/* Cabeçalho da Pasta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '18px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>
                  {selectedProfDossie.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Pasta Técnica: {selectedProfDossie.nome}
                    </h3>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      padding: '2px 8px', 
                      borderRadius: 'var(--radius-sm)', 
                      background: 'rgba(34, 197, 94, 0.15)', 
                      color: '#34d399' 
                    }}>
                      {selectedProfDossie.situacaoConselho || 'REGULAR'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedProfDossie.funcao} • {selectedProfDossie.conselho || 'CREA'} nº {selectedProfDossie.numeroConselho || 'S/N'} • Vínculo {selectedProfDossie.vinculo}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => setModalProfCatOpen(true)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Vincular Nova CAT
                </button>
                <button onClick={() => setDossieModalOpen(false)} className="btn btn-ghost btn-sm">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Resumo Profissional / Dossiê */}
            {selectedProfDossie.resumoProfissional && (
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '18px', border: '1px solid var(--border-color)' }}>
                <strong style={{ fontSize: '0.8rem', color: '#60a5fa', display: 'block', marginBottom: '4px' }}>Qualificação & Experiência:</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {selectedProfDossie.resumoProfissional}
                </p>
              </div>
            )}

            {/* Documento / Dossiê Anexo do Profissional */}
            {selectedProfDossie.storageUrl && (
              <div style={{
                background: 'rgba(232, 93, 93, 0.08)',
                border: '1px solid rgba(232, 93, 93, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <FileText size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedProfDossie.storageKey || 'Dossiê / Documento do Profissional'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Arquivo anexado ao cadastro do profissional (Carteira, Diploma ou Currículo)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadOrOpenDoc(selectedProfDossie.storageUrl, selectedProfDossie.storageKey || selectedProfDossie.nome)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', flexShrink: 0 }}
                >
                  <Eye size={14} /> Abrir / Baixar Documento
                </button>
              </div>
            )}

            {/* Seção CATs e Atestados */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} style={{ color: 'var(--color-primary)' }} />
                  Atestados de Capacidade Técnica e CATs Vinculadas
                </h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedProfDossie.acervos?.length || 0} atestados registrados
                </span>
              </div>

              {!selectedProfDossie.acervos || selectedProfDossie.acervos.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Nenhuma CAT vinculada a esta pasta técnica no momento.
                  </p>
                  <button 
                    onClick={() => setModalProfCatOpen(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} /> Adicionar Primeira CAT
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>CAT / Atestado</th>
                        <th>Órgão Emitente</th>
                        <th>Objeto & Escopo</th>
                        <th>Local</th>
                        <th style={{ textAlign: 'right' }}>Documento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProfDossie.acervos.map((cat: any) => (
                        <tr key={cat.id}>
                          <td>
                            <strong style={{ fontSize: '0.85rem', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                              {cat.numeroCat || cat.numeroAtestado || 'CAT S/N'}
                            </strong>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {cat.emitente}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-primary)', maxWidth: '280px' }}>
                            {cat.objeto}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {cat.uf || 'CE'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {cat.urlOrigem || cat.storageUrl ? (
                              <a 
                                href={cat.urlOrigem || cat.storageUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <ExternalLink size={12} /> Visualizar
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem anexo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: CADASTRAR NOVA EMPRESA (COM ÁREAS E CARTÃO CNPJ)     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div 
            className="card" 
            style={{ 
              maxWidth: '680px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cadastrar Empresa / Parceira</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Preencha os dados corporativos e anexe a habilitação</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmpresa} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

                <div className="form-group">
                  <label className="form-label">Nome Fantasia</label>
                  <input 
                    value={newEmpresa.tradeName} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, tradeName: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: UFC Engenharia"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input 
                    value={newEmpresa.cnpj} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, cnpj: e.target.value })}
                    className="form-control" 
                    placeholder="00.000.000/0001-00"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Entidade</label>
                  <select 
                    value={newEmpresa.type} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, type: e.target.value })}
                    className="form-control"
                  >
                    <option value="PROPRIA">Empresa Própria (UFC / Pórtico)</option>
                    <option value="PARCEIRA">Empresa Parceira / Subcontratada</option>
                    <option value="CONSORCIO">Consórcio</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">E-mail de Contato</label>
                  <input 
                    type="email"
                    value={newEmpresa.email} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, email: e.target.value })}
                    className="form-control" 
                    placeholder="licitacao@empresa.com.br"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input 
                    value={newEmpresa.phone} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, phone: e.target.value })}
                    className="form-control" 
                    placeholder="(85) 99999-9999"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Endereço Completo</label>
                  <input 
                    value={newEmpresa.address} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, address: e.target.value })}
                    className="form-control" 
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input 
                    value={newEmpresa.city} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, city: e.target.value })}
                    className="form-control" 
                    placeholder="Fortaleza"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">UF</label>
                  <select 
                    value={newEmpresa.state} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, state: e.target.value })}
                    className="form-control"
                  >
                    {['CE', 'BA', 'PE', 'RN', 'PB', 'PI', 'MA', 'SP', 'RJ', 'MG', 'DF', 'GO'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campo Livre: Áreas de Atuação */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#60a5fa' }}>
                  Áreas de Atuação da Empresa (texto livre)
                </label>
                <textarea 
                  value={newEmpresa.areasAtuacao} 
                  onChange={(e) => setNewEmpresa({ ...newEmpresa, areasAtuacao: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Ex: Pavimentação asfáltica, drenagem urbana, saneamento básico, edificações e obras de arte especiais..."
                />
              </div>

              {/* Upload Inicial de Cartão CNPJ e Documentação */}
              <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileUp size={15} style={{ color: 'var(--color-primary)' }} />
                  Cartão CNPJ / Documentação de Habilitação Inicial
                </label>
                <input 
                  type="text"
                  value={newEmpresa.cnpjCardUrl} 
                  onChange={(e) => setNewEmpresa({ ...newEmpresa, cnpjCardUrl: e.target.value })}
                  className="form-control" 
                  placeholder="Cole o link do Google Drive, PDF ou anexo do Cartão CNPJ..."
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  O documento será registrado automaticamente na aba de Habilitação da empresa.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: NOVO PROFISSIONAL / ENGENHEIRO                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modalProfOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div 
            className="card" 
            style={{ 
              maxWidth: '620px', 
              width: '100%', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cadastrar Engenheiro / Profissional</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vincular ao quadro técnico e criar pasta documental</p>
                </div>
              </div>
              <button onClick={() => setModalProfOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProf} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input 
                    value={newProfData.nome} 
                    onChange={(e) => setNewProfData({ ...newProfData, nome: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Empresa Vinculada *</label>
                  <select 
                    value={newProfData.orgId} 
                    onChange={(e) => setNewProfData({ ...newProfData, orgId: e.target.value })}
                    className="form-control"
                    required
                  >
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.tradeName || emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Função / Cargo</label>
                  <input 
                    value={newProfData.funcao} 
                    onChange={(e) => setNewProfData({ ...newProfData, funcao: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Engenheiro Civil Sênior / RT"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Vínculo</label>
                  <select 
                    value={newProfData.vinculo} 
                    onChange={(e) => setNewProfData({ ...newProfData, vinculo: e.target.value })}
                    className="form-control"
                  >
                    <option value="CLT">CLT</option>
                    <option value="PJ">PJ (Prestador)</option>
                    <option value="SOCIO">Sócio / Diretor Técnico</option>
                    <option value="AUTONOMO">Autônomo</option>
                    <option value="PARCEIRO">Parceiro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Conselho</label>
                  <select 
                    value={newProfData.conselho} 
                    onChange={(e) => setNewProfData({ ...newProfData, conselho: e.target.value })}
                    className="form-control"
                  >
                    <option value="CREA">CREA</option>
                    <option value="CAU">CAU</option>
                    <option value="CRQ">CRQ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nº do Registro</label>
                  <input 
                    value={newProfData.numeroConselho} 
                    onChange={(e) => setNewProfData({ ...newProfData, numeroConselho: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 061234567-8"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Situação</label>
                  <select 
                    value={newProfData.situacaoConselho} 
                    onChange={(e) => setNewProfData({ ...newProfData, situacaoConselho: e.target.value })}
                    className="form-control"
                  >
                    <option value="ATIVO">Ativo / Regular</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Formação / Graduação</label>
                <input 
                  value={newProfData.formacao} 
                  onChange={(e) => setNewProfData({ ...newProfData, formacao: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Engenharia Civil (UFC), Especialização em Pavimentação"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resumo Profissional / Experiência</label>
                <textarea 
                  value={newProfData.resumoProfissional} 
                  onChange={(e) => setNewProfData({ ...newProfData, resumoProfissional: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Descreva a atuação principal, tempo de experiência e especialidades técnicas..." 
                />
              </div>

              {/* Campo de Anexo do Profissional */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Anexo do Profissional (Dossiê, Carteira CREA/CAU, Diploma, Currículo)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opcional</span>
                </label>

                <div style={{
                  border: '1px dashed var(--border-color-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  textAlign: 'center'
                }}>
                  {newProfData.storageUrl ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-elevated)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <FileText size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {newProfData.storageKey || 'Documento Anexado'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>
                            ✓ Arquivo pronto para vincular
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewProfData(prev => ({ ...prev, storageUrl: '', storageKey: '' }))}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444', padding: '6px', flexShrink: 0 }}
                        title="Remover anexo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="newProfFileInput"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 15 * 1024 * 1024) {
                              alert('O arquivo deve ter no máximo 15MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setNewProfData(prev => ({
                                ...prev,
                                storageUrl: ev.target?.result as string,
                                storageKey: file.name
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="newProfFileInput"
                        className="btn btn-secondary btn-sm"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <FileUp size={16} style={{ color: 'var(--color-primary)' }} />
                        Escolher Arquivo do Computador (PDF / Imagem)
                      </label>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        ou informe um link externo abaixo (Google Drive, etc.)
                      </div>
                      <input
                        type="url"
                        value={newProfData.storageUrl.startsWith('data:') ? '' : newProfData.storageUrl}
                        onChange={(e) => setNewProfData(prev => ({ ...prev, storageUrl: e.target.value, storageKey: e.target.value ? 'Link Externo' : '' }))}
                        className="form-control"
                        placeholder="https://..."
                        style={{ marginTop: '8px', fontSize: '0.82rem' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalProfOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingProf} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {savingProf ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Profissional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: EDITAR PROFISSIONAL                                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      {editProfModalOpen && editingProf && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div 
            className="card" 
            style={{ 
              maxWidth: '620px', 
              width: '100%', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editar Profissional</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Atualizar cadastro do quadro técnico</p>
                </div>
              </div>
              <button onClick={() => setEditProfModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditProf} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input 
                    value={editProfData.nome || ''} 
                    onChange={(e) => setEditProfData({ ...editProfData, nome: e.target.value })}
                    className="form-control" 
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Empresa Vinculada *</label>
                  <select 
                    value={editProfData.orgId || ''} 
                    onChange={(e) => setEditProfData({ ...editProfData, orgId: e.target.value })}
                    className="form-control"
                    required
                  >
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.tradeName || emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Função / Cargo</label>
                  <input 
                    value={editProfData.funcao || ''} 
                    onChange={(e) => setEditProfData({ ...editProfData, funcao: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Vínculo</label>
                  <select 
                    value={editProfData.vinculo || 'CLT'} 
                    onChange={(e) => setEditProfData({ ...editProfData, vinculo: e.target.value })}
                    className="form-control"
                  >
                    <option value="CLT">CLT</option>
                    <option value="PJ">PJ (Prestador)</option>
                    <option value="SOCIO">Sócio / Diretor Técnico</option>
                    <option value="AUTONOMO">Autônomo</option>
                    <option value="PARCEIRO">Parceiro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Conselho</label>
                  <select 
                    value={editProfData.conselho || 'CREA'} 
                    onChange={(e) => setEditProfData({ ...editProfData, conselho: e.target.value })}
                    className="form-control"
                  >
                    <option value="CREA">CREA</option>
                    <option value="CAU">CAU</option>
                    <option value="CRQ">CRQ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nº do Registro</label>
                  <input 
                    value={editProfData.numeroConselho || ''} 
                    onChange={(e) => setEditProfData({ ...editProfData, numeroConselho: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Situação</label>
                  <select 
                    value={editProfData.situacaoConselho || 'ATIVO'} 
                    onChange={(e) => setEditProfData({ ...editProfData, situacaoConselho: e.target.value })}
                    className="form-control"
                  >
                    <option value="ATIVO">Ativo / Regular</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Formação / Graduação</label>
                <input 
                  value={editProfData.formacao || ''} 
                  onChange={(e) => setEditProfData({ ...editProfData, formacao: e.target.value })}
                  className="form-control" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resumo Profissional / Experiência</label>
                <textarea 
                  value={editProfData.resumoProfissional || ''} 
                  onChange={(e) => setEditProfData({ ...editProfData, resumoProfissional: e.target.value })}
                  className="form-control" 
                  rows={2}
                />
              </div>

              {/* Campo de Anexo do Profissional */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Documento Anexo / Dossiê (PDF ou Imagem)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opcional</span>
                </label>

                {editProfData.storageUrl ? (
                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <FileText size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {editProfData.storageKey || 'Documento do Profissional'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Arquivo anexado ao cadastro
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => downloadOrOpenDoc(editProfData.storageUrl, editProfData.storageKey || editProfData.nome)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
                      >
                        <Eye size={13} /> Visualizar / Baixar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditProfData((prev: any) => ({ ...prev, storageUrl: '', storageKey: '' }))}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444', padding: '6px' }}
                        title="Remover arquivo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    border: '1px dashed var(--border-color-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    background: 'rgba(255,255,255,0.02)',
                    textAlign: 'center'
                  }}>
                    <input
                      type="file"
                      id="editProfFileInput"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 15 * 1024 * 1024) {
                            alert('O arquivo deve ter no máximo 15MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setEditProfData((prev: any) => ({
                              ...prev,
                              storageUrl: ev.target?.result as string,
                              storageKey: file.name
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="editProfFileInput"
                      className="btn btn-secondary btn-sm"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <FileUp size={15} style={{ color: 'var(--color-primary)' }} />
                      Anexar Documento / Dossiê (PDF / Imagem)
                    </label>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      ou informe um link externo abaixo:
                    </div>
                    <input
                      type="url"
                      value={editProfData.storageUrl?.startsWith('data:') ? '' : editProfData.storageUrl}
                      onChange={(e) => setEditProfData((prev: any) => ({ ...prev, storageUrl: e.target.value, storageKey: e.target.value ? 'Link Externo' : '' }))}
                      className="form-control"
                      placeholder="https://..."
                      style={{ marginTop: '6px', fontSize: '0.82rem' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setEditProfModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingEditProf} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {savingEditProf ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: VINCULAR CAT DIRETA AO PROFISSIONAL                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modalProfCatOpen && selectedProfDossie && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div 
            className="card" 
            style={{ 
              maxWidth: '600px', 
              width: '100%', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '26px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Vincular CAT à Pasta do Engenheiro</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Profissional: {selectedProfDossie.nome}</p>
              </div>
              <button onClick={() => setModalProfCatOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProfCat} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Nº da CAT</label>
                  <input 
                    value={newProfCatData.numeroCat} 
                    onChange={(e) => setNewProfCatData({ ...newProfCatData, numeroCat: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 2026/0142"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nº do Atestado</label>
                  <input 
                    value={newProfCatData.numeroAtestado} 
                    onChange={(e) => setNewProfCatData({ ...newProfCatData, numeroAtestado: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: AT-89/2025"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Órgão Emitente *</label>
                <input 
                  value={newProfCatData.emitente} 
                  onChange={(e) => setNewProfCatData({ ...newProfCatData, emitente: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: SEINFRA/CE, DNIT, Prefeitura de Fortaleza..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Objeto dos Serviços *</label>
                <textarea 
                  value={newProfCatData.objeto} 
                  onChange={(e) => setNewProfCatData({ ...newProfCatData, objeto: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Descreva os serviços executados e quantitativos principais..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Serviço</label>
                  <select 
                    value={newProfCatData.tipoServico} 
                    onChange={(e) => setNewProfCatData({ ...newProfCatData, tipoServico: e.target.value })}
                    className="form-control"
                  >
                    <option value="PAVIMENTACAO_INFRAESTRUTURA">Pavimentação e Infraestrutura</option>
                    <option value="EXECUCAO_EDIFICACOES">Edificações e Obras Civis</option>
                    <option value="OBRAS_RODOVIARIAS">Obras Rodoviárias</option>
                    <option value="SUPERVISAO_FISCALIZACAO">Fiscalização e Supervisão</option>
                    <option value="SERVICOS_HIDRICOS">Saneamento e Hídricos</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">UF</label>
                  <input 
                    value={newProfCatData.uf} 
                    onChange={(e) => setNewProfCatData({ ...newProfCatData, uf: e.target.value })}
                    className="form-control" 
                    placeholder="CE"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Link do Documento / Google Drive</label>
                <input 
                  value={newProfCatData.urlOrigem} 
                  onChange={(e) => setNewProfCatData({ ...newProfCatData, urlOrigem: e.target.value })}
                  className="form-control" 
                  placeholder="https://..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalProfCatOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingProfCat} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {savingProfCat ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar e Vincular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: GERENCIAMENTO COMPLETO DA EMPRESA                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      {companyModalOpen && selectedEmpresa && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div 
            className="card" 
            style={{ 
              maxWidth: '900px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedEmpresa.tradeName || selectedEmpresa.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedEmpresa.name} • CNPJ: {selectedEmpresa.cnpj || 'Não cadastrado'}
                </p>
              </div>
              <button onClick={() => setCompanyModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            {/* Abas Internas da Empresa */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
              <button 
                onClick={() => setCompanyTab('acervos')} 
                className={`btn btn-sm ${companyTab === 'acervos' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Atestados & CATs ({selectedEmpresa.acervo?.length || 0})
              </button>
              <button 
                onClick={() => setCompanyTab('certidoes')} 
                className={`btn btn-sm ${companyTab === 'certidoes' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Certidões & Habilitação ({selectedEmpresa.complianceDocs?.length || 0})
              </button>
              <button 
                onClick={() => setCompanyTab('dados')} 
                className={`btn btn-sm ${companyTab === 'dados' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Dados Cadastrais
              </button>
            </div>

            {loadingCompanyDetails ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: 'var(--color-primary)' }} />
                Carregando detalhes da empresa...
              </div>
            ) : (
              <div>
                {/* Aba Acervos da Empresa */}
                {companyTab === 'acervos' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Atestados da Empresa</h4>
                      <button onClick={() => setModalCatOpen(true)} className="btn btn-primary btn-sm">
                        <Plus size={14} /> Cadastrar Novo Atestado
                      </button>
                    </div>

                    {!selectedEmpresa.acervo || selectedEmpresa.acervo.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                        Nenhum atestado registrado para esta empresa.
                      </p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>CAT / Atestado</th>
                              <th>Órgão Emitente</th>
                              <th>Objeto</th>
                              <th>Local</th>
                              <th style={{ textAlign: 'right' }}>Documento</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEmpresa.acervo.map((cat: any) => (
                              <tr key={cat.id}>
                                <td>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#60a5fa' }}>
                                    {cat.numeroCat || cat.numeroAtestado || 'S/N'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.82rem' }}>{cat.emitente}</td>
                                <td style={{ fontSize: '0.82rem', maxWidth: '300px' }}>{cat.objeto}</td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.uf || 'CE'}</td>
                                <td style={{ textAlign: 'right' }}>
                                  {cat.urlOrigem || cat.storageUrl ? (
                                    <a href={cat.urlOrigem || cat.storageUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                      <ExternalLink size={12} /> Ver
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Aba Certidões & Habilitação da Empresa */}
                {companyTab === 'certidoes' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Certidões Negativas e Documentos de Habilitação</h4>
                      <button onClick={() => setModalCertidaoOpen(true)} className="btn btn-primary btn-sm">
                        <Plus size={14} /> Nova Certidão
                      </button>
                    </div>

                    {!selectedEmpresa.complianceDocs || selectedEmpresa.complianceDocs.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                        Nenhuma certidão anexada para esta empresa.
                      </p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Certidão / Documento</th>
                              <th>Tipo</th>
                              <th>Emissor</th>
                              <th>Vencimento</th>
                              <th>Status</th>
                              <th style={{ textAlign: 'right' }}>Anexo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEmpresa.complianceDocs.map((doc: any) => (
                              <tr key={doc.id}>
                                <td><strong style={{ fontSize: '0.85rem' }}>{doc.nome}</strong></td>
                                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.tipo}</td>
                                <td style={{ fontSize: '0.82rem' }}>{doc.emissor || '-'}</td>
                                <td style={{ fontSize: '0.82rem', color: '#fbbf24' }}>
                                  {doc.vencimento ? formatDate(doc.vencimento) : 'Sem validade'}
                                </td>
                                <td>
                                  <span style={{ 
                                    fontSize: '0.72rem', 
                                    fontWeight: 700, 
                                    padding: '2px 7px', 
                                    borderRadius: 'var(--radius-sm)',
                                    background: doc.status === 'VIGENTE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: doc.status === 'VIGENTE' ? '#34d399' : '#f87171'
                                  }}>
                                    {doc.status || 'VIGENTE'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  {doc.storageUrl ? (
                                    <a href={doc.storageUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                      <ExternalLink size={12} /> Ver
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Aba Dados Cadastrais */}
                {companyTab === 'dados' && (
                  <form onSubmit={handleSaveCompanyData} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Razão Social</label>
                        <input 
                          value={editCompanyData.name || ''} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, name: e.target.value })}
                          className="form-control" 
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Nome Fantasia</label>
                        <input 
                          value={editCompanyData.tradeName || ''} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, tradeName: e.target.value })}
                          className="form-control" 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">CNPJ</label>
                        <input 
                          value={editCompanyData.cnpj || ''} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, cnpj: e.target.value })}
                          className="form-control" 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tipo de Entidade</label>
                        <select 
                          value={editCompanyData.type || 'PROPRIA'} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, type: e.target.value })}
                          className="form-control"
                        >
                          <option value="PROPRIA">Empresa Própria</option>
                          <option value="PARCEIRA">Empresa Parceira</option>
                          <option value="CONSORCIO">Consórcio</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">E-mail</label>
                        <input 
                          value={editCompanyData.email || ''} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, email: e.target.value })}
                          className="form-control" 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Telefone</label>
                        <input 
                          value={editCompanyData.phone || ''} 
                          onChange={(e) => setEditCompanyData({ ...editCompanyData, phone: e.target.value })}
                          className="form-control" 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Observações & Áreas de Atuação</label>
                      <textarea 
                        value={editCompanyData.notes || ''} 
                        onChange={(e) => setEditCompanyData({ ...editCompanyData, notes: e.target.value })}
                        className="form-control" 
                        rows={3}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button type="submit" disabled={savingEditCompany} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {savingEditCompany ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Nova CAT para Empresa */}
      {modalCatOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div 
            className="card" 
            style={{ 
              maxWidth: '600px', 
              width: '100%', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '26px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cadastrar Atestado / CAT para a Empresa</h3>
              <button onClick={() => setModalCatOpen(false)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateCat} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Nº da CAT</label>
                  <input 
                    value={newCatData.numeroCat} 
                    onChange={(e) => setNewCatData({ ...newCatData, numeroCat: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 0142/2026"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nº do Atestado</label>
                  <input 
                    value={newCatData.numeroAtestado} 
                    onChange={(e) => setNewCatData({ ...newCatData, numeroAtestado: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: AT-15/2025"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Órgão Emitente *</label>
                <input 
                  value={newCatData.emitente} 
                  onChange={(e) => setNewCatData({ ...newCatData, emitente: e.target.value })}
                  className="form-control" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Objeto *</label>
                <textarea 
                  value={newCatData.objeto} 
                  onChange={(e) => setNewCatData({ ...newCatData, objeto: e.target.value })}
                  className="form-control" 
                  rows={2}
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
                    <option value="PAVIMENTACAO_INFRAESTRUTURA">Pavimentação e Infraestrutura</option>
                    <option value="EXECUCAO_EDIFICACOES">Edificações e Obras Civis</option>
                    <option value="OBRAS_RODOVIARIAS">Obras Rodoviárias</option>
                    <option value="SUPERVISAO_FISCALIZACAO">Fiscalização e Supervisão</option>
                    <option value="SERVICOS_HIDRICOS">Saneamento e Hídricos</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">UF</label>
                  <input 
                    value={newCatData.uf} 
                    onChange={(e) => setNewCatData({ ...newCatData, uf: e.target.value })}
                    className="form-control" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Link do Documento</label>
                <input 
                  value={newCatData.urlOrigem} 
                  onChange={(e) => setNewCatData({ ...newCatData, urlOrigem: e.target.value })}
                  className="form-control" 
                  placeholder="https://..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalCatOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={savingCat} className="btn btn-primary">
                  {savingCat ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar CAT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Certidão para Empresa */}
      {modalCertidaoOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div 
            className="card" 
            style={{ 
              maxWidth: '550px', 
              width: '100%', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '26px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Nova Certidão de Habilitação</h3>
              <button onClick={() => setModalCertidaoOpen(false)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateCertidao} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nome da Certidão *</label>
                <input 
                  value={newCertidaoData.nome} 
                  onChange={(e) => setNewCertidaoData({ ...newCertidaoData, nome: e.target.value })}
                  className="form-control" 
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select 
                    value={newCertidaoData.tipo} 
                    onChange={(e) => setNewCertidaoData({ ...newCertidaoData, tipo: e.target.value })}
                    className="form-control"
                  >
                    <option value="CND_FEDERAL">CND Federal (PGFN / RFB)</option>
                    <option value="FGTS">Certificado do FGTS (CRF)</option>
                    <option value="CNDT">Certidão Negativa Trabalhista</option>
                    <option value="CND_ESTADUAL">CND Estadual (SEFAZ)</option>
                    <option value="CND_MUNICIPAL">CND Municipal (ISS)</option>
                    <option value="FALENCIA">Certidão de Falência e Concordata</option>
                    <option value="REGULARIDADE_CREA">Certidão de Registro no CREA/CAU</option>
                  </select>
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
                <label className="form-label">Órgão Emissor</label>
                <input 
                  value={newCertidaoData.emissor} 
                  onChange={(e) => setNewCertidaoData({ ...newCertidaoData, emissor: e.target.value })}
                  className="form-control" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Link do Documento / Anexo</label>
                <input 
                  value={newCertidaoData.storageUrl} 
                  onChange={(e) => setNewCertidaoData({ ...newCertidaoData, storageUrl: e.target.value })}
                  className="form-control" 
                  placeholder="https://..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalCertidaoOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={savingCertidao} className="btn btn-primary">
                  {savingCertidao ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Certidão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
