"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, Briefcase, Plus, 
  Phone, Mail, MapPin, ShieldCheck, Loader2, X, Save, Layers
} from 'lucide-react';

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={26} style={{ color: 'var(--color-primary)' }} />
            Empresas & Perfis Corporativos
          </h1>
          <p className="page-subtitle">
            Gestão das entidades titulares (UFC Engenharia e Pórtico Construções), parceiras e consórcios
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

      {/* Grid of Corporate Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando dados corporativos...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '22px' }}>
          {empresas.map((emp) => {
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

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {emp.tradeName || emp.name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {emp.name}
                  </div>
                  {emp.cnpj && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                      CNPJ: {emp.cnpj}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
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

                {/* KPI Counts Footer */}
                <div style={{ 
                  marginTop: 'auto', 
                  background: 'var(--bg-elevated)', 
                  borderTop: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  padding: '14px 20px',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <FileText size={12} /> Acervos
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa', marginTop: '2px' }}>
                      {emp._count?.acervo || 0}
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Briefcase size={12} /> Licitações
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>
                      {emp._count?.licitacoes || 0}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <ShieldCheck size={12} /> Certidões
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                      {emp._count?.complianceDocs || 0}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova Empresa */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
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
                    <option value="CONSORCIO">Consórcio</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input 
                    value={newEmpresa.phone} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, phone: e.target.value })}
                    className="form-control" 
                    placeholder="(85) 3333-4444" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">E-mail Corporativo</label>
                <input 
                  type="email"
                  value={newEmpresa.email} 
                  onChange={(e) => setNewEmpresa({ ...newEmpresa, email: e.target.value })}
                  className="form-control" 
                  placeholder="contato@empresa.com.br" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <input 
                    value={newEmpresa.address} 
                    onChange={(e) => setNewEmpresa({ ...newEmpresa, address: e.target.value })}
                    className="form-control" 
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
                    maxLength={2}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
