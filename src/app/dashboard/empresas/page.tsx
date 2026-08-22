"use client";

import React, { useState, useEffect } from 'react';
import { Building, Users, FileText, Briefcase, Plus, Phone, Mail, MapPin } from 'lucide-react';

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/empresas')
      .then(res => res.json())
      .then(data => {
        setEmpresas(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-fluid animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Empresas & Consórcios</h1>
          <p className="page-subtitle">Gestão corporativa, parceiros e participações</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          Nova Empresa
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresas.map((emp) => (
            <div key={emp.id} className="card p-0 overflow-hidden flex flex-col h-full hover:border-[var(--primary)] transition-colors">
              <div className="p-5 border-b border-[var(--border-color)]">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-3 bg-[var(--bg-elevated)] rounded-xl">
                    <Building size={24} className="text-primary" />
                  </div>
                  <span className={`badge ${emp.type === 'PROPRIA' ? 'badge-primary' : emp.type === 'CONSORCIO' ? 'badge-warning-dark' : 'badge-ghost'}`}>
                    {emp.type}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">{emp.name}</h3>
                {emp.cnpj && <p className="text-sm text-[var(--text-muted)] font-mono mt-1">CNPJ: {emp.cnpj}</p>}
              </div>
              
              <div className="p-5 flex-1 flex flex-col gap-3 text-sm text-[var(--text-secondary)]">
                {emp.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-muted" /> {emp.email}
                  </div>
                )}
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-muted" /> {emp.phone}
                  </div>
                )}
                {emp.city && emp.state && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-muted" /> {emp.city} - {emp.state}
                  </div>
                )}
              </div>

              <div className="bg-[var(--bg-elevated)] p-4 border-t border-[var(--border-color)] grid grid-cols-3 gap-2 text-center mt-auto">
                <div>
                  <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1"><FileText size={12}/> Acervos</div>
                  <div className="font-semibold text-primary">{emp._count?.acervo || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1"><Briefcase size={12}/> Licitações</div>
                  <div className="font-semibold text-primary">{emp._count?.licitacoes || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1"><Users size={12}/> Certidões</div>
                  <div className="font-semibold text-primary">{emp._count?.complianceDocs || 0}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
