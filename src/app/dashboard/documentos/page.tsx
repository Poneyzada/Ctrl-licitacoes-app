"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Plus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  const [stats, setStats] = useState({
    validos: 0,
    atencao: 0,
    critico: 0,
    vencidos: 0
  });

  useEffect(() => {
    fetchDocuments();
  }, [filterEmpresa, filterTipo]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let url = '/api/documentos?';
      if (filterEmpresa) url += `orgId=${filterEmpresa}&`;
      if (filterTipo) url += `tipo=${filterTipo}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        // Calculate days to expire to set statuses if needed (client side display logic)
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

        setDocuments(processed);
        if (!filterEmpresa && !filterTipo) {
          setStats({ validos: v, atencao: a, critico: c, vencidos: x });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'VIGENTE': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: '#10b981' };
      case 'ATENCAO': return { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', border: '#eab308' };
      case 'CRITICO': return { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316', border: '#f97316' };
      case 'VENCIDO': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: '#ef4444' };
      default: return { bg: 'var(--bg-elevated)', text: 'var(--text-primary)', border: 'var(--border-color)' };
    }
  };

  return (
    <div className="container-fluid animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentos & Habilitação</h1>
          <p className="page-subtitle">Controle de certidões, balanços e documentos legais</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary">
            <Plus size={16} />
            Novo Documento
          </button>
        </div>
      </div>

      {/* Radar de Vencimentos */}
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ShieldCheck className="text-primary" /> Radar de Vencimentos
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 flex items-center gap-4 border-l-4" style={{ borderLeftColor: '#10b981' }}>
          <div className="p-3 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle2 color="#10b981" size={24} />
          </div>
          <div>
            <div className="text-sm text-muted">Vigentes ({'>'} 30 dias)</div>
            <div className="text-2xl font-bold">{stats.validos}</div>
          </div>
        </div>
        
        <div className="card p-4 flex items-center gap-4 border-l-4" style={{ borderLeftColor: '#eab308' }}>
          <div className="p-3 rounded-full" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
            <Clock color="#eab308" size={24} />
          </div>
          <div>
            <div className="text-sm text-muted">Atenção (≤ 30 dias)</div>
            <div className="text-2xl font-bold">{stats.atencao}</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 border-l-4" style={{ borderLeftColor: '#f97316' }}>
          <div className="p-3 rounded-full" style={{ background: 'rgba(249, 115, 22, 0.1)' }}>
            <AlertCircle color="#f97316" size={24} />
          </div>
          <div>
            <div className="text-sm text-muted">Crítico (≤ 15 dias)</div>
            <div className="text-2xl font-bold">{stats.critico}</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 border-l-4" style={{ borderLeftColor: '#ef4444' }}>
          <div className="p-3 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <AlertCircle color="#ef4444" size={24} />
          </div>
          <div>
            <div className="text-sm text-muted">Vencidos</div>
            <div className="text-2xl font-bold">{stats.vencidos}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-[var(--border-color)] flex gap-4 items-center">
          <div className="flex-1 min-w-[200px] max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input type="text" placeholder="Buscar documento..." className="input pl-10 w-full" />
          </div>
          <select 
            className="input w-48"
            value={filterEmpresa}
            onChange={e => setFilterEmpresa(e.target.value)}
          >
            <option value="">Todas as Empresas</option>
          </select>
          <select 
            className="input w-48"
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value)}
          >
            <option value="">Todos os Tipos</option>
            <option value="CND_FEDERAL">CND Federal</option>
            <option value="FGTS">FGTS</option>
            <option value="TRABALHISTA">Trabalhista</option>
            <option value="BALANCO">Balanço Patrimonial</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Empresa</th>
                <th>Emissão</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">Carregando...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">Nenhum documento encontrado.</td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const colors = getStatusColor(doc.uiStatus);
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div className="font-medium text-sm">{doc.nome}</div>
                        <div className="text-xs text-muted mt-1">{doc.tipo} {doc.numero ? `- ${doc.numero}` : ''}</div>
                      </td>
                      <td>
                        <span className="badge badge-ghost text-xs">
                          {doc.organization?.name || 'S/ Empresa'}
                        </span>
                      </td>
                      <td className="text-sm">
                        {doc.emissao ? new Date(doc.emissao).toLocaleDateString() : '-'}
                      </td>
                      <td className="text-sm font-medium">
                        {doc.semVencimento ? 'Sem vencimento' : (doc.vencimento ? new Date(doc.vencimento).toLocaleDateString() : '-')}
                        {doc.daysLeft !== 999 && (
                          <div className="text-xs mt-1" style={{ color: colors.text }}>
                            {doc.daysLeft < 0 ? `Vencido há ${Math.abs(doc.daysLeft)} dias` : `Faltam ${doc.daysLeft} dias`}
                          </div>
                        )}
                      </td>
                      <td>
                        <span 
                          className="px-2 py-1 rounded text-xs font-semibold border"
                          style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                        >
                          {doc.uiStatus}
                        </span>
                      </td>
                      <td className="text-right">
                        <button className="btn btn-ghost btn-sm">Ver</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
