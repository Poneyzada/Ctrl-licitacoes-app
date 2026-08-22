"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, Search, Filter, Plus, FileText, 
  MapPin, Calendar, FileCheck, ArrowRight, Loader2
} from 'lucide-react';

export default function AcervoPage() {
  const [acervos, setAcervos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    ufc: 0,
    portico: 0,
    areas: 0
  });

  useEffect(() => {
    fetchAcervos();
  }, [search, orgFilter]);

  const fetchAcervos = async () => {
    setLoading(true);
    try {
      let url = '/api/acervo?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (orgFilter) url += `orgId=${orgFilter}&`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAcervos(data);
        
        // Compute stats only on full load or adapt as needed
        if (!search && !orgFilter) {
          const ufcCount = data.filter((d: any) => d.organization?.name?.toLowerCase().includes('ufc')).length;
          const porticoCount = data.filter((d: any) => d.organization?.name?.toLowerCase().includes('pórtico') || d.organization?.name?.toLowerCase().includes('portico')).length;
          const areasSet = new Set(data.map((d: any) => d.areaTecnica).filter(Boolean));
          
          setStats({
            total: data.length,
            ufc: ufcCount,
            portico: porticoCount,
            areas: areasSet.size
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const parseQuantitativos = (qStr: string) => {
    if (!qStr) return [];
    try {
      return JSON.parse(qStr);
    } catch {
      return [];
    }
  };

  return (
    <div className="container-fluid animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Acervo Técnico</h1>
          <p className="page-subtitle">Gestão de atestados, CATs e compatibilidade para licitações</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <FileCheck size={16} />
            <span>Simulador de Compatibilidade</span>
          </button>
          <Link href="/dashboard/acervo/novo" className="btn btn-primary">
            <Plus size={16} />
            <span>Novo Atestado</span>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid mb-6">
        <div className="metric-card">
          <div className="metric-header">
            <h3 className="metric-title">Total Atestados</h3>
            <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <FileText size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.total}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <h3 className="metric-title">UFC Engenharia</h3>
            <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Building2 size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.ufc}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <h3 className="metric-title">Pórtico Construções</h3>
            <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Building2 size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.portico}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <h3 className="metric-title">Áreas Técnicas</h3>
            <div className="metric-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Filter size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.areas}</div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="p-4 border-b border-[var(--border-color)] flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[300px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por objeto, emitente ou palavras-chave..." 
              className="input pl-10 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="input" 
              value={orgFilter} 
              onChange={(e) => setOrgFilter(e.target.value)}
            >
              <option value="">Todas as Empresas</option>
              {/* Should ideally be dynamically populated from organizations */}
              <option value="ufc">UFC Engenharia</option>
              <option value="portico">Pórtico Construções</option>
            </select>
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="animate-spin text-muted" size={32} />
            </div>
          ) : acervos.length === 0 ? (
            <div className="p-8 text-center text-muted">
              Nenhum acervo técnico encontrado.
            </div>
          ) : (
            <div className="acervo-grid p-4">
              {acervos.map((acervo) => (
                <div key={acervo.id} className="acervo-card">
                  <div className="acervo-header flex justify-between items-start mb-3">
                    <div>
                      <span className="badge badge-primary mb-2">
                        {acervo.organization?.name || 'Sem empresa'}
                      </span>
                      <h3 className="font-semibold text-[var(--text-primary)] text-sm">
                        {acervo.numeroCat ? `CAT Nº ${acervo.numeroCat}` : `Atestado Nº ${acervo.numeroAtestado || 'S/N'}`}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{acervo.emitente}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-3">
                    {acervo.objeto}
                  </p>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {parseQuantitativos(acervo.quantitativos).slice(0,3).map((q: any, i: number) => (
                        <span key={i} className="badge badge-ghost text-[10px]">
                          {q.quantidade} {q.unidade} - {q.descricao}
                        </span>
                      ))}
                      {parseQuantitativos(acervo.quantitativos).length > 3 && (
                        <span className="badge badge-ghost text-[10px]">+{parseQuantitativos(acervo.quantitativos).length - 3} itens</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mt-auto pt-3 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      <span>{acervo.local} {acervo.uf ? `- ${acervo.uf}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>
                        {acervo.periodoInicio ? new Date(acervo.periodoInicio).getFullYear() : 'N/I'} 
                        {acervo.periodoFim ? ` a ${new Date(acervo.periodoFim).getFullYear()}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .metric-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 20px;
        }
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .metric-title {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .metric-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .metric-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .acervo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .acervo-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          transition: all 0.2s;
        }
        .acervo-card:hover {
          border-color: var(--border-color-strong);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
