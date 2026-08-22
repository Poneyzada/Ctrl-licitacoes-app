"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Filter, Plus, AlertCircle, 
  CheckCircle2, Clock, FileText, Building2, Calendar, 
  AlertTriangle, XCircle, ArrowUpRight, Loader2, X, Save
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDoc, setNewDoc] = useState({
    orgId: '',
    nome: '',
    tipo: 'CND_FEDERAL',
    numero: '',
    emissor: '',
    emissao: '',
    vencimento: '',
    semVencimento: false,
    observacoes: ''
  });

  const [stats, setStats] = useState({
    validos: 0,
    atencao: 0,
    critico: 0,
    vencidos: 0
  });

  useEffect(() => {
    fetch('/api/empresas')
      .then(res => res.json())
      .then(data => {
        setOrganizations(data);
        if (data.length > 0) {
          setNewDoc(prev => ({ ...prev, orgId: data[0].id }));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [filterEmpresa, filterStatus, search]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let url = '/api/documentos?';
      if (filterEmpresa) url += `orgId=${filterEmpresa}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const now = new Date();
        let v = 0, a = 0, c = 0, x = 0;
        
        const processed = data.map((doc: any) => {
          if (doc.semVencimento) {
            v++;
            return { ...doc, uiStatus: 'VIGENTE', daysLeft: 999 };
          }
          
          if (!doc.vencimento) {
            v++;
            return { ...doc, uiStatus: 'VIGENTE', daysLeft: 999 };
          }
          
          const venc = new Date(doc.vencimento);
          const diffTime = venc.getTime() - now.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let uiStatus = 'VIGENTE';
          if (daysLeft < 0) {
            uiStatus = 'VENCIDO';
            x++;
          } else if (daysLeft <= 15) {
            uiStatus = 'CRITICO';
            c++;
          } else if (daysLeft <= 30) {
            uiStatus = 'ATENCAO';
            a++;
          } else {
            v++;
          }
          
          return { ...doc, uiStatus, daysLeft };
        });

        let filtered = processed;
        if (filterStatus !== 'ALL') {
          filtered = filtered.filter((d: any) => d.uiStatus === filterStatus);
        }
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter((d: any) => 
            d.nome?.toLowerCase().includes(s) ||
            d.emissor?.toLowerCase().includes(s) ||
            d.numero?.toLowerCase().includes(s)
          );
        }

        setDocuments(filtered);
        if (!filterEmpresa && filterStatus === 'ALL' && !search) {
          setStats({ validos: v, atencao: a, critico: c, vencidos: x });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.nome || !newDoc.orgId) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
      if (res.ok) {
        setModalOpen(false);
        setNewDoc({
          orgId: organizations[0]?.id || '',
          nome: '',
          tipo: 'CND_FEDERAL',
          numero: '',
          emissor: '',
          emissao: '',
          vencimento: '',
          semVencimento: false,
          observacoes: ''
        });
        fetchDocuments();
      } else {
        alert('Erro ao salvar certidão.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (uiStatus: string, daysLeft: number, semVencimento: boolean) => {
    if (semVencimento) {
      return (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(34, 197, 94, 0.15)', color: '#34d399' }}>
          Sem Vencimento
        </span>
      );
    }

    switch (uiStatus) {
      case 'VENCIDO':
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.18)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            ✕ Vencido ({Math.abs(daysLeft)}d atrás)
          </span>
        );
      case 'CRITICO':
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(249, 115, 22, 0.18)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
            ⚠ Crítico ({daysLeft}d restantes)
          </span>
        );
      case 'ATENCAO':
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            ⚡ Atenção ({daysLeft}d)
          </span>
        );
      default:
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(34, 197, 94, 0.15)', color: '#34d399' }}>
            ✓ Vigente ({daysLeft === 999 ? 'Ativo' : `${daysLeft}d`})
          </span>
        );
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} style={{ color: 'var(--color-primary)' }} />
            Central de Documentos & Radar de Vencimentos
          </h1>
          <p className="page-subtitle">
            Monitoramento de CNDs, regularidade fiscal, balanços e certidões para habilitação imediata
          </p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Nova Certidão / Documento
        </button>
      </div>

      {/* Radar de Vencimentos - Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#34d399' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>{stats.validos}</div>
          <div className="stat-label">Certidões Vigentes (&gt;30d)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <Clock size={22} />
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.atencao}</div>
          <div className="stat-label">Vencendo em até 30 dias</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.12)', color: '#fb923c' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-value" style={{ color: '#fb923c' }}>{stats.critico}</div>
          <div className="stat-label">Crítico (Vence em ≤15 dias)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>
            <XCircle size={22} />
          </div>
          <div className="stat-value" style={{ color: '#f87171' }}>{stats.vencidos}</div>
          <div className="stat-label">Certidões Vencidas</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '28px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por certidão, emissor, número..." 
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', width: '100%' }}
            />
          </div>

          <select 
            value={filterEmpresa} 
            onChange={(e) => setFilterEmpresa(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '180px' }}
          >
            <option value="">Empresa: Todas</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.tradeName || org.name}</option>
            ))}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-control" 
            style={{ width: 'auto', height: '40px', minWidth: '160px' }}
          >
            <option value="ALL">Status: Todos</option>
            <option value="VIGENTE">Vigente</option>
            <option value="ATENCAO">Atenção (≤30d)</option>
            <option value="CRITICO">Crítico (≤15d)</option>
            <option value="VENCIDO">Vencido</option>
          </select>

          {(search || filterEmpresa || filterStatus !== 'ALL') && (
            <button 
              onClick={() => { setSearch(''); setFilterEmpresa(''); setFilterStatus('ALL'); }}
              className="btn btn-ghost btn-sm" 
              style={{ height: '40px' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando radar de documentos...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShieldCheck size={44} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Nenhum documento encontrado</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Cadastre as certidões e balanços para manter o radar atualizado.
          </p>
          <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> Cadastrar Documento
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Documento / Certidão</th>
                <th>Empresa</th>
                <th>Órgão Emissor</th>
                <th>Emissão</th>
                <th>Vencimento</th>
                <th>Radar de Validade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const isUfc = doc.organization?.name?.toLowerCase().includes('ufc');

                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.nome}</div>
                      {doc.numero && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nº {doc.numero}</div>
                      )}
                    </td>

                    <td>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        padding: '2px 7px', 
                        borderRadius: 'var(--radius-sm)',
                        background: isUfc ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: isUfc ? '#34d399' : '#fbbf24',
                      }}>
                        {doc.organization?.tradeName || doc.organization?.name || 'N/A'}
                      </span>
                    </td>

                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {doc.emissor || 'Órgão Competente'}
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {doc.emissao ? formatDate(new Date(doc.emissao)) : '--/--/----'}
                    </td>

                    <td style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {doc.semVencimento ? 'Indeterminado' : (doc.vencimento ? formatDate(new Date(doc.vencimento)) : 'Não informado')}
                    </td>

                    <td>
                      {getStatusBadge(doc.uiStatus, doc.daysLeft, doc.semVencimento)}
                    </td>

                    <td>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Ver / Renovar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Novo Documento */}
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
                <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Nova Certidão / Documento Legal</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Empresa Titular *</label>
                <select 
                  value={newDoc.orgId} 
                  onChange={(e) => setNewDoc({ ...newDoc, orgId: e.target.value })}
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
                <label className="form-label">Nome do Documento / Certidão *</label>
                <input 
                  value={newDoc.nome} 
                  onChange={(e) => setNewDoc({ ...newDoc, nome: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Certidão Negativa Federal PGFN"
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select 
                    value={newDoc.tipo} 
                    onChange={(e) => setNewDoc({ ...newDoc, tipo: e.target.value })}
                    className="form-control"
                  >
                    <option value="CND_FEDERAL">CND Federal / PGFN</option>
                    <option value="TRABALHISTA">CNDT Trabalhista (TST)</option>
                    <option value="FGTS">CRF FGTS (Caixa)</option>
                    <option value="CERTIDAO_ESTADUAL">CND Estadual (SEFAZ)</option>
                    <option value="CERTIDAO_MUNICIPAL">CND Municipal (ISS/IPTU)</option>
                    <option value="BALANCO_PATRIMONIAL">Balanço Patrimonial</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nº do Documento / Autenticidade</label>
                  <input 
                    value={newDoc.numero} 
                    onChange={(e) => setNewDoc({ ...newDoc, numero: e.target.value })}
                    className="form-control" 
                    placeholder="Ex: PGFN-2026-991" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Órgão Emissor</label>
                <input 
                  value={newDoc.emissor} 
                  onChange={(e) => setNewDoc({ ...newDoc, emissor: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: Receita Federal, Caixa Econômica..." 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Data de Emissão</label>
                  <input 
                    type="date" 
                    value={newDoc.emissao} 
                    onChange={(e) => setNewDoc({ ...newDoc, emissao: e.target.value })}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data de Vencimento</label>
                  <input 
                    type="date" 
                    value={newDoc.vencimento} 
                    onChange={(e) => setNewDoc({ ...newDoc, vencimento: e.target.value })}
                    disabled={newDoc.semVencimento}
                    className="form-control" 
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <input 
                  type="checkbox" 
                  checked={newDoc.semVencimento} 
                  onChange={(e) => setNewDoc({ ...newDoc, semVencimento: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                Documento sem prazo de validade (ex: Balanço, Contrato Social)
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar no Radar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
