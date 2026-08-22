"use client";

import React, { useState, useEffect } from 'react';
import { 
  Kanban, Plus, Clock, AlertCircle, CheckCircle, 
  ArrowRight, Search, GripVertical 
} from 'lucide-react';

type Followup = {
  id: string;
  licitacaoId: string;
  fase: string;
  tipo: string;
  proximaAcao: string;
  prazo: string | null;
  responsavel: string;
  status: string;
  licitacao: {
    orgaoNome: string;
    numero: string;
    modalidade: string;
    valorEstimado: number | null;
  };
};

const KANBAN_COLUMNS = [
  { id: 'PENDENTE', title: 'Pendente', color: 'border-yellow-500', bg: 'bg-yellow-500/10' },
  { id: 'EM_ELABORACAO', title: 'Em Elaboração', color: 'border-blue-500', bg: 'bg-blue-500/10' },
  { id: 'PROTOCOLADO', title: 'Protocolado', color: 'border-purple-500', bg: 'bg-purple-500/10' },
  { id: 'CONCLUIDO', title: 'Concluído', color: 'border-green-500', bg: 'bg-green-500/10' },
];

export default function ResultadoPage() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resultado');
      if (res.ok) {
        const data = await res.json();
        setFollowups(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updatePhase = async (id: string, newFase: string) => {
    try {
      const res = await fetch(`/api/resultado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, fase: newFase })
      });
      if (res.ok) {
        setFollowups(prev => prev.map(f => f.id === id ? { ...f, fase: newFase } : f));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = followups.filter(f => {
    if (!search) return true;
    const t = search.toLowerCase();
    return (
      f.licitacao?.orgaoNome?.toLowerCase().includes(t) ||
      f.licitacao?.numero?.toLowerCase().includes(t) ||
      f.responsavel?.toLowerCase().includes(t)
    );
  });

  const getItemsByColumn = (colId: string) => filtered.filter(f => f.fase === colId);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Kanban className="text-purple-500" />
            Acompanhando Resultado
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kanban pós-disputa: documentação, homologação e contratação.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar..."
              className="input pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus size={16} /> Nova Etapa
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Carregando kanban...
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-6 min-w-max h-full pb-4">
            {KANBAN_COLUMNS.map(col => (
              <div key={col.id} className="kanban-column">
                <div className={`kanban-header ${col.bg} border-t-2 ${col.color}`}>
                  <h3 className="font-semibold">{col.title}</h3>
                  <span className="kanban-count">{getItemsByColumn(col.id).length}</span>
                </div>
                
                <div className="kanban-body">
                  {getItemsByColumn(col.id).map(item => (
                    <div key={item.id} className="kanban-card group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                          <GripVertical size={14} className="opacity-0 group-hover:opacity-100 cursor-grab" />
                          {item.licitacao?.numero}
                        </div>
                        {item.prazo && (
                          <div className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                            <Clock size={12} />
                            {new Date(item.prazo).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-sm mb-1">{item.licitacao?.orgaoNome}</h4>
                      
                      {item.licitacao?.valorEstimado && (
                        <p className="text-xs text-green-400 font-medium mb-3">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.licitacao.valorEstimado)}
                        </p>
                      )}
                      
                      <div className="bg-background rounded p-2 text-xs text-muted-foreground mb-3 line-clamp-2">
                        <strong>Próxima ação:</strong> {item.proximaAcao || 'Não definida'}
                      </div>
                      
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-border">
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold" title={item.responsavel}>
                            {item.responsavel ? item.responsavel.substring(0, 2).toUpperCase() : '--'}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <select 
                            className="text-xs bg-surface border border-border rounded px-1"
                            value={item.fase}
                            onChange={(e) => updatePhase(item.id, e.target.value)}
                          >
                            {KANBAN_COLUMNS.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {getItemsByColumn(col.id).length === 0 && (
                    <div className="text-center p-4 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground">
                      Nenhum item
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .bg-surface { background-color: var(--bg-surface); }
        .bg-background { background-color: var(--bg-background); }
        .border-border { border-color: var(--border-color); }
        .text-muted-foreground { color: var(--text-muted); }
        
        .kanban-column {
          width: 320px;
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        
        .kanban-header {
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
        }
        
        .kanban-count {
          background: var(--bg-background);
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .kanban-body {
          padding: 1rem;
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .kanban-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .kanban-card:hover {
          border-color: rgba(168, 85, 247, 0.4);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .btn {
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-weight: 500;
          font-size: 0.875rem;
          transition: all 0.2s;
          cursor: pointer;
        }
        .btn-primary {
          background: #a855f7;
          color: white;
          border: none;
        }
        .btn-primary:hover {
          background: #9333ea;
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
          border-color: #a855f7;
        }
      `}</style>
    </div>
  );
}
