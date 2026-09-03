"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Mail, Phone, 
  Building2, Award, FileCheck, CheckCircle2, Plus,
  Download, Edit3, Trash2, X, Save, Loader2, Layers, ExternalLink, Check
} from 'lucide-react';

export default function EquipePage() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Novo Profissional
  const [modalProfOpen, setModalProfOpen] = useState(false);
  const [savingProf, setSavingProf] = useState(false);
  const [newProf, setNewProf] = useState({
    orgId: '',
    nome: '',
    funcao: 'Engenheiro Civil Pleno',
    vinculo: 'CLT',
    conselho: 'CREA',
    numeroConselho: '',
    situacaoConselho: 'ATIVO',
    formacao: 'Engenharia Civil',
    resumoProfissional: ''
  });

  // Modal Editar Profissional
  const [editProfModalOpen, setEditProfModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<any>(null);
  const [editProfData, setEditProfData] = useState({
    orgId: '',
    nome: '',
    funcao: '',
    vinculo: 'CLT',
    conselho: 'CREA',
    numeroConselho: '',
    situacaoConselho: 'ATIVO',
    formacao: '',
    resumoProfissional: ''
  });
  const [savingEditProf, setSavingEditProf] = useState(false);

  // Modal Acervo do Profissional (Visualizar / Adicionar Atestado)
  const [selectedProf, setSelectedProf] = useState<any>(null);
  const [acervoModalOpen, setAcervoModalOpen] = useState(false);
  const [addCatModalOpen, setAddCatModalOpen] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [newCat, setNewCat] = useState({
    numeroCat: '',
    numeroAtestado: '',
    emitente: '',
    objeto: '',
    tipoServico: 'EXECUCAO_INFRAESTRUTURA',
    areaTecnica: 'Infraestrutura Urbana',
    local: 'Bahia / Ceará / Brasil',
    uf: 'BA',
    urlOrigem: ''
  });

  // Modal Editar CAT Individual
  const [editCatModalOpen, setEditCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [editCatData, setEditCatData] = useState({
    numeroCat: '',
    numeroAtestado: '',
    emitente: '',
    objeto: '',
    tipoServico: '',
    areaTecnica: '',
    local: '',
    uf: '',
    urlOrigem: '',
    storageUrl: ''
  });
  const [savingEditCat, setSavingEditCat] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resProf, resOrgs] = await Promise.all([
        fetch('/api/profissionais'),
        fetch('/api/empresas')
      ]);

      if (resProf.ok) {
        const dataProf = await resProf.json();
        setProfessionals(dataProf);
      }
      if (resOrgs.ok) {
        const dataOrgs = await resOrgs.json();
        setOrganizations(dataOrgs);
        if (dataOrgs.length > 0) {
          setNewProf(prev => ({ ...prev, orgId: dataOrgs[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProf.nome || !newProf.orgId) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setSavingProf(true);
    try {
      const res = await fetch('/api/profissionais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProf)
      });

      if (res.ok) {
        setModalProfOpen(false);
        setNewProf({
          orgId: organizations[0]?.id || '',
          nome: '',
          funcao: 'Engenheiro Civil Pleno',
          vinculo: 'CLT',
          conselho: 'CREA',
          numeroConselho: '',
          situacaoConselho: 'ATIVO',
          formacao: 'Engenharia Civil',
          resumoProfissional: ''
        });
        loadData();
      } else {
        alert('Erro ao salvar profissional');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão');
    } finally {
      setSavingProf(false);
    }
  };

  const openEditProfModal = (prof: any) => {
    setEditingProf(prof);
    setEditProfData({
      orgId: prof.orgId || organizations[0]?.id || '',
      nome: prof.nome || '',
      funcao: prof.funcao || '',
      vinculo: prof.vinculo || 'CLT',
      conselho: prof.conselho || 'CREA',
      numeroConselho: prof.numeroConselho || '',
      situacaoConselho: prof.situacaoConselho || 'ATIVO',
      formacao: prof.formacao || '',
      resumoProfissional: prof.resumoProfissional || ''
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
        loadData();
      } else {
        alert('Erro ao atualizar profissional');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao atualizar');
    } finally {
      setSavingEditProf(false);
    }
  };

  const handleDeleteProf = async (id: string) => {
    if (!confirm('Deseja realmente inativar/remover este profissional do quadro técnico?')) return;

    try {
      const res = await fetch(`/api/profissionais/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEditProfModalOpen(false);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCatForProf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProf || !newCat.emitente || !newCat.objeto) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setSavingCat(true);
    try {
      const res = await fetch('/api/acervo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCat,
          orgId: selectedProf.orgId,
          professionalId: selectedProf.id,
          responsavelTecnico: `${selectedProf.nome} — ${selectedProf.conselho} ${selectedProf.numeroConselho || ''}`,
          quantitativos: '[]'
        })
      });

      if (res.ok) {
        setAddCatModalOpen(false);
        setNewCat({
          numeroCat: '',
          numeroAtestado: '',
          emitente: '',
          objeto: '',
          tipoServico: 'EXECUCAO_INFRAESTRUTURA',
          areaTecnica: 'Infraestrutura Urbana',
          local: 'Bahia / Ceará / Brasil',
          uf: 'BA',
          urlOrigem: ''
        });
        loadData();
      } else {
        alert('Erro ao vincular CAT');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão');
    } finally {
      setSavingCat(false);
    }
  };

  const openEditCatModal = (cat: any) => {
    setEditingCat(cat);
    setEditCatData({
      numeroCat: cat.numeroCat || '',
      numeroAtestado: cat.numeroAtestado || '',
      emitente: cat.emitente || '',
      objeto: cat.objeto || '',
      tipoServico: cat.tipoServico || '',
      areaTecnica: cat.areaTecnica || '',
      local: cat.local || '',
      uf: cat.uf || '',
      urlOrigem: cat.urlOrigem || '',
      storageUrl: cat.storageUrl || ''
    });
    setEditCatModalOpen(true);
  };

  const handleSaveEditCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;

    setSavingEditCat(true);
    try {
      const res = await fetch(`/api/acervo/${editingCat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCatData)
      });

      if (res.ok) {
        setEditCatModalOpen(false);
        loadData();
        // Atualizar lista modal aberta se houver
        if (selectedProf) {
          const updatedProfRes = await fetch(`/api/profissionais/${selectedProf.id}`);
          if (updatedProfRes.ok) {
            const updatedProf = await updatedProfRes.json();
            setSelectedProf(updatedProf);
          }
        }
      } else {
        alert('Erro ao atualizar atestado');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar atestado');
    } finally {
      setSavingEditCat(false);
    }
  };

  const openAcervoModal = (prof: any) => {
    setSelectedProf(prof);
    setAcervoModalOpen(true);
  };

  const openAddCatModal = (prof: any) => {
    setSelectedProf(prof);
    setAddCatModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={26} style={{ color: 'var(--color-primary)' }} />
            Equipe Técnica, Profissionais & Acervos
          </h1>
          <p className="page-subtitle">
            Gestão do quadro técnico de engenheiros habilitados (CREA/CAU), seus dados, vínculos e atestados/CATs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setModalProfOpen(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={18} />
            Novo Profissional / Engenheiro
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CATs / Atestados Vinculados aos Engenheiros</span>
            <Layers size={18} style={{ color: '#34d399' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#34d399' }}>
            {professionals.reduce((acc, p) => acc + (p.acervos?.length || 0), 0)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comprovação técnico-profissional</span>
        </div>

        <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Empresas e Consórcios</span>
            <Building2 size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            {organizations.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UFC Engenharia e Pórtico Construções</span>
        </div>
      </div>

      {/* Grid de Profissionais */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileCheck size={18} style={{ color: '#34d399' }} />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Quadro Técnico de Engenheiros & Acervos Individuais
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando equipe técnica e acervos...</p>
        </div>
      ) : professionals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', marginBottom: '32px' }}>
          <Users size={40} style={{ margin: '0 auto 14px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Nenhum profissional cadastrado ainda.</p>
          <button onClick={() => setModalProfOpen(true)} className="btn btn-primary btn-sm">
            <UserPlus size={16} /> Cadastrar Engenheiro
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px', marginBottom: '36px' }}>
          {professionals.map((prof) => {
            const isUfc = prof.organization?.name?.toLowerCase().includes('ufc');
            const totalCats = prof.acervos?.length || 0;

            return (
              <div key={prof.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className={isUfc ? 'tag-company-ufc' : 'tag-company-portico'} style={{ marginBottom: '6px' }}>
                      {prof.organization?.tradeName || prof.organization?.name}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {prof.nome}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {prof.funcao} • {prof.vinculo}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      padding: '2px 8px', 
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(52, 211, 153, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      fontWeight: 700
                    }}>
                      {prof.situacaoConselho || 'ATIVO'}
                    </span>
                    <button 
                      onClick={() => openEditProfModal(prof)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 6px', color: 'var(--text-muted)' }}
                      title="Editar dados do engenheiro"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="tag-engineer">
                    {prof.conselho} nº {prof.numeroConselho || 'S/N'}
                  </span>
                  {prof.formacao && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Graduação: {prof.formacao}
                    </span>
                  )}
                </div>

                {/* Acervo Mini Box */}
                <div style={{ background: 'var(--bg-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Acervo do Profissional
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#60a5fa' }}>
                      {totalCats} {totalCats === 1 ? 'Atestado / CAT' : 'Atestados / CATs'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => openAcervoModal(prof)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                    >
                      Ver / Baixar
                    </button>
                    <button 
                      onClick={() => openAddCatModal(prof)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '5px 8px' }}
                      title="Vincular novo atestado a este profissional"
                    >
                      <Plus size={14} /> CAT
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Editar Profissional */}
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
        }}
        onClick={() => setEditProfModalOpen(false)}
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
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editar Engenheiro / Profissional</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Atualizar cadastro no quadro técnico</p>
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
                    value={editProfData.nome} 
                    onChange={(e) => setEditProfData({ ...editProfData, nome: e.target.value })}
                    className="form-control" 
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Empresa Vinculada *</label>
                  <select 
                    value={editProfData.orgId} 
                    onChange={(e) => setEditProfData({ ...editProfData, orgId: e.target.value })}
                    className="form-control"
                    required
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.tradeName || org.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Função / Cargo</label>
                  <input 
                    value={editProfData.funcao} 
                    onChange={(e) => setEditProfData({ ...editProfData, funcao: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Engenheiro Civil Sênior"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Vínculo</label>
                  <select 
                    value={editProfData.vinculo} 
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
                  <input 
                    value={editProfData.conselho} 
                    onChange={(e) => setEditProfData({ ...editProfData, conselho: e.target.value })}
                    className="form-control" 
                    placeholder="CREA ou CAU"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Registro (CREA/CAU)</label>
                  <input 
                    value={editProfData.numeroConselho} 
                    onChange={(e) => setEditProfData({ ...editProfData, numeroConselho: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 45892-D"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Situação</label>
                  <select 
                    value={editProfData.situacaoConselho} 
                    onChange={(e) => setEditProfData({ ...editProfData, situacaoConselho: e.target.value })}
                    className="form-control"
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="EM_RENOVACAO">EM RENOVAÇÃO</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Graduação / Especialização</label>
                <input 
                  value={editProfData.formacao} 
                  onChange={(e) => setEditProfData({ ...editProfData, formacao: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Engenharia Civil e Sanitária"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  type="button" 
                  onClick={() => handleDeleteProf(editingProf.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={15} /> Inativar Profissional
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setEditProfModalOpen(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingEditProf} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {savingEditProf ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizar Atestados do Profissional */}
      {acervoModalOpen && selectedProf && (
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
        }}
        onClick={() => setAcervoModalOpen(false)}
        >
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
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="tag-engineer" style={{ marginBottom: '4px' }}>
                  {selectedProf.conselho} {selectedProf.numeroConselho || 'S/N'}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Acervo Técnico de {selectedProf.nome}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedProf.acervos?.length || 0} atestados e CATs registrados
                </p>
              </div>
              <button onClick={() => setAcervoModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            {(!selectedProf.acervos || selectedProf.acervos.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                <Layers size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ color: 'var(--text-secondary)' }}>Nenhum atestado vinculado diretamente a este profissional.</p>
                <button 
                  onClick={() => { setAcervoModalOpen(false); openAddCatModal(selectedProf); }} 
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '12px' }}
                >
                  <Plus size={14} /> Vincular Primeiro Atestado
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedProf.acervos.map((cat: any) => {
                  const hasLink = cat.urlOrigem || cat.storageUrl;
                  return (
                    <div 
                      key={cat.id} 
                      style={{ 
                        background: 'var(--bg-elevated)', 
                        padding: '16px 18px', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                            CAT: {cat.numeroCat || cat.numeroAtestado || 'S/N'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {cat.tipoServico || cat.areaTecnica}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '2px' }}>
                          {cat.objeto}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Emitente: {cat.emitente} • {cat.local || 'Bahia / Ceará'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => openEditCatModal(cat)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Editar Atestado"
                        >
                          <Edit3 size={13} /> Editar
                        </button>

                        {hasLink ? (
                          <a 
                            href={cat.urlOrigem || cat.storageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-primary btn-sm"
                            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                          >
                            <Download size={14} /> Baixar PDF
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '6px 10px' }}>
                            Sem arquivo
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Editar CAT Individual */}
      {editCatModalOpen && editingCat && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}
        onClick={() => setEditCatModalOpen(false)}
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
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editar Atestado Técnico / CAT</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Atualizar dados e link do Google Drive</p>
                </div>
              </div>
              <button onClick={() => setEditCatModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditCat} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Número da CAT</label>
                  <input 
                    value={editCatData.numeroCat} 
                    onChange={(e) => setEditCatData({ ...editCatData, numeroCat: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 247128/2024"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Órgão Emitente *</label>
                  <input 
                    value={editCatData.emitente} 
                    onChange={(e) => setEditCatData({ ...editCatData, emitente: e.target.value })}
                    className="form-control" 
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Objeto da Obra / Serviço *</label>
                <textarea 
                  value={editCatData.objeto} 
                  onChange={(e) => setEditCatData({ ...editCatData, objeto: e.target.value })}
                  className="form-control" 
                  rows={2}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Área Técnica / Especialidade</label>
                  <input 
                    value={editCatData.areaTecnica} 
                    onChange={(e) => setEditCatData({ ...editCatData, areaTecnica: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Local / UF</label>
                  <input 
                    value={editCatData.local} 
                    onChange={(e) => setEditCatData({ ...editCatData, local: e.target.value })}
                    className="form-control" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Link do Arquivo PDF (Google Drive / Nuvem)</label>
                <input 
                  value={editCatData.urlOrigem} 
                  onChange={(e) => setEditCatData({ ...editCatData, urlOrigem: e.target.value, storageUrl: e.target.value })}
                  className="form-control" 
                  placeholder="https://drive.google.com/file/d/..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setEditCatModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingEditCat} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {savingEditCat ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Atestado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Profissional */}
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
        }}
        onClick={() => setModalProfOpen(false)}
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
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cadastrar Profissional / Engenheiro</h3>
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
                    value={newProf.nome} 
                    onChange={(e) => setNewProf({ ...newProf, nome: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Eng. Roberto Silva"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Empresa Vinculada *</label>
                  <select 
                    value={newProf.orgId} 
                    onChange={(e) => setNewProf({ ...newProf, orgId: e.target.value })}
                    className="form-control"
                    required
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.tradeName || org.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Função / Cargo</label>
                  <input 
                    value={newProf.funcao} 
                    onChange={(e) => setNewProf({ ...newProf, funcao: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Vínculo</label>
                  <select 
                    value={newProf.vinculo} 
                    onChange={(e) => setNewProf({ ...newProf, vinculo: e.target.value })}
                    className="form-control"
                  >
                    <option value="CLT">CLT</option>
                    <option value="PJ">PJ (Prestador)</option>
                    <option value="SOCIO">Sócio</option>
                    <option value="AUTONOMO">Autônomo</option>
                    <option value="PARCEIRO">Parceiro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Conselho</label>
                  <input 
                    value={newProf.conselho} 
                    onChange={(e) => setNewProf({ ...newProf, conselho: e.target.value })}
                    className="form-control" 
                    placeholder="CREA ou CAU"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Registro (CREA/CAU)</label>
                  <input 
                    value={newProf.numeroConselho} 
                    onChange={(e) => setNewProf({ ...newProf, numeroConselho: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 45892-D"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Situação</label>
                  <select 
                    value={newProf.situacaoConselho} 
                    onChange={(e) => setNewProf({ ...newProf, situacaoConselho: e.target.value })}
                    className="form-control"
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="PENDENTE">PENDENTE</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Graduação / Especialização</label>
                <input 
                  value={newProf.formacao} 
                  onChange={(e) => setNewProf({ ...newProf, formacao: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Engenharia Civil e Sanitária"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalProfOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingProf} className="btn btn-primary">
                  {savingProf ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Cadastrar Profissional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Vincular Novo Atestado ao Profissional */}
      {addCatModalOpen && selectedProf && (
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
        }}
        onClick={() => setAddCatModalOpen(false)}
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
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Vincular CAT / Atestado</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Profissional: {selectedProf.nome}</p>
              </div>
              <button onClick={() => setAddCatModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCatForProf} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Número da CAT *</label>
                  <input 
                    value={newCat.numeroCat} 
                    onChange={(e) => setNewCat({ ...newCat, numeroCat: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 247128/2024"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Órgão Emitente *</label>
                  <input 
                    value={newCat.emitente} 
                    onChange={(e) => setNewCat({ ...newCat, emitente: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: SEINFRA / DER"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Objeto da Obra / Serviço *</label>
                <textarea 
                  value={newCat.objeto} 
                  onChange={(e) => setNewCat({ ...newCat, objeto: e.target.value })}
                  className="form-control" 
                  rows={2}
                  placeholder="Descrição do serviço executado pelo engenheiro..." 
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Serviço</label>
                  <select 
                    value={newCat.tipoServico} 
                    onChange={(e) => setNewCat({ ...newCat, tipoServico: e.target.value })}
                    className="form-control"
                  >
                    <option value="EXECUCAO_INFRAESTRUTURA">Execução de Infraestrutura</option>
                    <option value="ELABORACAO_PROJETOS">Elaboração de Projetos</option>
                    <option value="SUPERVISAO_FISCALIZACAO">Supervisão e Fiscalização</option>
                    <option value="GERENCIAMENTO">Gerenciamento de Obras</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Área Técnica</label>
                  <input 
                    value={newCat.areaTecnica} 
                    onChange={(e) => setNewCat({ ...newCat, areaTecnica: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: Pavimentação e Drenagem"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Link do Arquivo / PDF (Google Drive)</label>
                <input 
                  value={newCat.urlOrigem} 
                  onChange={(e) => setNewCat({ ...newCat, urlOrigem: e.target.value })}
                  className="form-control" 
                  placeholder="https://drive.google.com/file/d/..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setAddCatModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingCat} className="btn btn-primary">
                  {savingCat ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Atestado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
