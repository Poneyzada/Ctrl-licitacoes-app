"use client";

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Clock, Filter, Plus, Search, 
  Scale, FileText, CheckCircle, XCircle, 
  ChevronRight, Calendar, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

type Recurso = {
  id: string;
  licitacaoId: string;
  tipo: string;
  posicao: string;
  prazo: string | null;
  responsavel: string;
  concorrente: string | null;
  status: string;
  resumo: string;
  fundamento: string;
  proximaAcao: string;
  setor: string;
  licitacao: {
    orgaoNome: string;
    numero: string;
    modalidade: string;
  };
};

export default function RecursosPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRecursos();
  }, [filterTipo, filterStatus]);

  const fetchRecursos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTipo) params.append('tipo', filterTipo);
      if (filterStatus) params.append('status', filterStatus);
      
      const res = await fetch(`/api/recursos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecursos(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysLeft = (dateString: string | null) => {
    if (!dateString) return null;
    const diff = new Date(dateString).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const getUrgencyClass = (days: number | null) => {
    if (days === null) return 'badge-neutral';
    if (days < 0) return 'badge-error';
    if (days <= 2) return 'badge-warning';
    return 'badge-success';
  };

  const filteredRecursos = recursos.filter(r => {
    if (!search) return true;
    const termo = search.toLowerCase();
    return (
      r.licitacao?.orgaoNome?.toLowerCase().includes(termo) ||
      r.licitacao?.numero?.toLowerCase().includes(termo) ||
      r.resumo?.toLowerCase().includes(termo)
    );
  });

  const prazosCriticos = recursos
    .filter(r => r.prazo && ['ABERTO', 'EM_ANDAMENTO'].includes(r.status))
    .map(r => ({ ...r, daysLeft: calculateDaysLeft(r.prazo) }))
    .sort((a, b) => (a.daysLeft || 999) - (b.daysLeft || 999))
    .slice(0, 3);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="text-blue-500" />
            Recursos & Prazos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestão de impugnações, esclarecimentos e recursos administrativos.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Novo Caso
        </button>
      </div>

      {/* Radar de Prazos Críticos */}
      {prazosCriticos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-400">
            <AlertTriangle size={20} /> Prazos Críticos Radar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prazosCriticos.map(p => (
              <div key={p.id} className={`p-4 rounded-lg border border-red-500/30 bg-red-500/10`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-red-300 uppercase">{p.tipo.replace('_', ' ')}</span>
                  <span className="text-lg font-bold text-red-400 flex items-center gap-1">
                    <Clock size={16} /> 
                    {p.daysLeft !== null ? (p.daysLeft < 0 ? 'Vencido' : `${p.daysLeft} dias`) : 'Sem prazo'}
                  </span>
                </div>
                <h3 className="font-medium text-sm truncate mb-1">{p.licitacao?.orgaoNome}</h3>
                <p className="text-xs text-muted-foreground truncate">{p.resumo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-surface border border-border rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar órgão, edital, resumo..."
            className="input w-full pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <select className="input" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="">Todos os Tipos</option>
          <option value="IMPUGNACAO">Impugnação</option>
          <option value="ESCLARECIMENTO">Esclarecimento</option>
          <option value="RECURSO">Recurso Adm.</option>
          <option value="CONTRARRAZOES">Contrarrazões</option>
        </select>

        <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os Status</option>
          <option value="ABERTO">Aberto</option>
          <option value="EM_ANDAMENTO">Em Andamento</option>
          <option value="PROTOCOLADO">Protocolado</option>
          <option value="DEFERIDO">Deferido</option>
          <option value="INDEFERIDO">Indeferido</option>
        </select>
      </div>

      {/* Lista de Casos */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filteredRecursos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          Nenhum recurso encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRecursos.map(recurso => {
            const daysLeft = calculateDaysLeft(recurso.prazo);
            
            return (
              <div key={recurso.id} className="case-card">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <span className="badge badge-primary">{recurso.tipo.replace('_', ' ')}</span>
                    <span className="badge badge-outline">{recurso.setor}</span>
                  </div>
                  {recurso.prazo && (
                    <span className={`badge ${getUrgencyClass(daysLeft)} flex items-center gap-1`}>
                      <Calendar size={12} />
                      {new Date(recurso.prazo).toLocaleDateString()} 
                      {daysLeft !== null && ` (${daysLeft}d)`}
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-lg mb-1">{recurso.licitacao?.orgaoNome}</h3>
                <p className="text-sm text-muted-foreground mb-3">Edital: {recurso.licitacao?.numero} ({recurso.licitacao?.modalidade})</p>
                
                <div className="bg-background p-3 rounded-md mb-4 border border-border/50">
                  <p className="text-sm line-clamp-2"><strong>Resumo:</strong> {recurso.resumo}</p>
                </div>
                
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <span className="text-sm font-medium">{recurso.status}</span>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                    Ver detalhes <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .bg-surface { background-color: var(--bg-surface); }
        .bg-background { background-color: var(--bg-background); }
        .border-border { border-color: var(--border-color); }
        .text-muted-foreground { color: var(--text-muted); }
        
        .case-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          transition: all 0.2s;
        }
        .case-card:hover {
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateY(-2px);
        }
        
        .badge {
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .badge-primary { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
        .badge-outline { border: 1px solid var(--border-color); color: var(--text-secondary); }
        .badge-error { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .badge-warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
        .badge-success { background: rgba(16, 185, 129, 0.2); color: #34d399; }
        .badge-neutral { background: rgba(156, 163, 175, 0.2); color: #9ca3af; }
        
        .btn {
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-weight: 500;
          font-size: 0.875rem;
          transition: all 0.2s;
          cursor: pointer;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
        }
        .btn-primary:hover {
          background: #2563eb;
        }
        
        .input {
          background: var(--bg-background);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}
