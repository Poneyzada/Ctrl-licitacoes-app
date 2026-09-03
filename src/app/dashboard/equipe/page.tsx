"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Mail, Phone, 
  Building2, Award, FileCheck, CheckCircle2, Plus,
  Download, Edit3, Trash2, X, Save, Loader2, Layers, ExternalLink
} from 'lucide-react';

export default function EquipePage() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
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
    conselho: 'CREA-CE',
    numeroConselho: '',
    situacaoConselho: 'ATIVO',
    formacao: 'Engenharia Civil',
    resumoProfissional: ''
  });

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
    local: 'Fortaleza',
    uf: 'CE',
    urlOrigem: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resProf, resOrgs, resUsers] = await Promise.all([
        fetch('/api/profissionais'),
        fetch('/api/empresas'),
        fetch('/api/auth/session') // ou listagem de users
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
          conselho: 'CREA-CE',
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
          local: 'Fortaleza',
          uf: 'CE',
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
            Gestão do quadro técnico de engenheiros habilitados (CREA/CAU) e seus atestados/CATs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
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

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <Award size={22} />
          </div>
          <div className="stat-value">{professionals.length}</div>
          <div className="stat-label">Profissionais Cadastrados</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#34d399' }}>
            <Layers size={22} />
          </div>
          <div className="stat-value">
            {professionals.reduce((acc, p) => acc + (p.acervos?.length || 0), 0)}
          </div>
          <div className="stat-label">CATs / Atestados Vinculados aos Engenheiros</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(232, 93, 93, 0.12)', color: 'var(--color-primary)' }}>
            <Building2 size={22} />
          </div>
          <div className="stat-value">{organizations.length}</div>
          <div className="stat-label">Empresas e Consórcios</div>
        </div>
      </div>

      {/* Engineers Roster Grid */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Award size={20} style={{ color: '#34d399' }} />
        Quadro Técnico de Engenheiros & Acervos Individuais
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando equipe técnica...</p>
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

      {/* Modal Ver Acervo do Profissional */}
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
              maxWidth: '750px', 
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Acervo Técnico de {selectedProf.nome}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{selectedProf.conselho} nº {selectedProf.numeroConselho || 'S/N'}</p>
              </div>
              <button onClick={() => setAcervoModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            {selectedProf.acervos?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                Nenhum atestado vinculado a este profissional ainda.
                <div style={{ marginTop: '16px' }}>
                  <button onClick={() => { setAcervoModalOpen(false); openAddCatModal(selectedProf); }} className="btn btn-primary btn-sm">
                    <Plus size={14} /> Cadastrar Primeiro Atestado
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedProf.acervos.map((cat: any) => (
                  <div key={cat.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {cat.numeroCat ? `CAT nº ${cat.numeroCat}` : (cat.numeroAtestado ? `Atestado ${cat.numeroAtestado}` : 'Atestado Técnico')}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Emitente: {cat.emitente}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {cat.objeto}
                      </div>
                    </div>

                    <div>
                      {cat.urlOrigem || cat.storageUrl ? (
                        <a 
                          href={cat.urlOrigem || cat.storageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Download size={14} style={{ color: '#34d399' }} /> Baixar Documento
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Sem Arquivo Anexo</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Adicionar Atestado ao Profissional */}
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Vincular Novo Atestado / CAT</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Profissional: <strong>{selectedProf.nome}</strong></p>
              </div>
              <button onClick={() => setAddCatModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCatForProf} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Nº da CAT</label>
                  <input 
                    value={newCat.numeroCat} 
                    onChange={(e) => setNewCat({ ...newCat, numeroCat: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 14921/2024"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nº do Atestado</label>
                  <input 
                    value={newCat.numeroAtestado} 
                    onChange={(e) => setNewCat({ ...newCat, numeroAtestado: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: AT-091/2023"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Órgão / Cliente Emitente *</label>
                <input 
                  value={newCat.emitente} 
                  onChange={(e) => setNewCat({ ...newCat, emitente: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: CAGECE, SEINFRA, Prefeitura..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Objeto do Atestado *</label>
                <textarea 
                  value={newCat.objeto} 
                  onChange={(e) => setNewCat({ ...newCat, objeto: e.target.value })}
                  className="form-control" 
                  rows={3}
                  placeholder="Descrição completa do serviço executado..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Link para Download do Documento / PDF</label>
                <input 
                  type="url"
                  value={newCat.urlOrigem} 
                  onChange={(e) => setNewCat({ ...newCat, urlOrigem: e.target.value })}
                  className="form-control" 
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setAddCatModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingCat} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {savingCat ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Atestado do Engenheiro
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Novo Profissional / Engenheiro</h3>
              </div>
              <button onClick={() => setModalProfOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProf} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Empresa Vinculada *</label>
                <select 
                  value={newProf.orgId} 
                  onChange={(e) => setNewProf({ ...newProf, orgId: e.target.value })}
                  className="form-control" 
                  required
                >
                  <option value="">Selecione a empresa...</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.tradeName || org.name}</option>
                  ))}
                </select>
              </div>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Conselho Profissional</label>
                  <input 
                    value={newProf.conselho} 
                    onChange={(e) => setNewProf({ ...newProf, conselho: e.target.value })}
                    className="form-control" 
                    placeholder="CREA-CE, CAU-CE..." 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nº de Registro no Conselho</label>
                  <input 
                    value={newProf.numeroConselho} 
                    onChange={(e) => setNewProf({ ...newProf, numeroConselho: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: 45892D/CE" 
                  />
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
                  <label className="form-label">Vínculo com a Empresa</label>
                  <select 
                    value={newProf.vinculo} 
                    onChange={(e) => setNewProf({ ...newProf, vinculo: e.target.value })}
                    className="form-control"
                  >
                    <option value="CLT">CLT (Empregado)</option>
                    <option value="PJ">PJ (Contrato de Prestação)</option>
                    <option value="SOCIO">Sócio / Diretor Técnico</option>
                    <option value="AUTONOMO">Autônomo</option>
                    <option value="PARCEIRO">Parceiro Consorciado</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setModalProfOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingProf} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {savingProf ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Profissional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
