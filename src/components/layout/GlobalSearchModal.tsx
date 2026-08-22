'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Gavel, FileText, ShieldCheck, 
  ArrowRight, X, Loader2, Sparkles, Building2,
  Calendar, Layers, Scale, Kanban, MonitorCheck, Inbox
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function GlobalSearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ licitacoes: any[]; acervos: any[]; documentos: any[] }>({
    licitacoes: [],
    acervos: [],
    documentos: []
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Navigation shortcuts
  const quickLinks = [
    { title: 'Licitações em Andamento', href: '/dashboard/licitacoes', icon: Gavel, desc: 'Ver certames e editais' },
    { title: 'Acervo Técnico & CATs', href: '/dashboard/acervo', icon: Layers, desc: 'Consultar atestados e quantitativos' },
    { title: 'Radar de Documentos / CNDs', href: '/dashboard/documentos', icon: ShieldCheck, desc: 'Validade de certidões' },
    { title: 'Recursos & Prazos', href: '/dashboard/recursos', icon: Scale, desc: 'Impugnações e esclarecimentos' },
    { title: 'Kanban Pós-Disputa', href: '/dashboard/resultado', icon: Kanban, desc: 'Acompanhar homologação' },
    { title: 'Entrada AXXIA & PNCP', href: '/dashboard/axxia', icon: Inbox, desc: 'Fila de oportunidades' },
  ];

  // Shortcut Listener: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ licitacoes: [], acervos: [], documentos: [] });
    }
  }, [open]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ licitacoes: [], acervos: [], documentos: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) return null;

  const totalResults = results.licitacoes.length + results.acervos.length + results.documentos.length;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        zIndex: 9999,
        paddingLeft: '16px',
        paddingRight: '16px'
      }}
      onClick={() => setOpen(false)}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color-strong)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 24px rgba(232, 93, 93, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-elevated)'
        }}>
          <Search size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por licitação, CAT, CND, objeto, órgão..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {loading && <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
          <button 
            onClick={() => setOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 6px',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '12px' }}>
          {!query && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '6px 12px 10px', letterSpacing: '0.08em' }}>
                Navegação Rápida
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                        background: 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {query && totalResults === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Nenhum resultado encontrado para &quot;{query}&quot;
            </div>
          )}

          {/* Licitações Results */}
          {results.licitacoes.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', padding: '6px 12px 8px', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Gavel size={13} /> Licitações ({results.licitacoes.length})
              </div>
              {results.licitacoes.map((lic) => (
                <div 
                  key={lic.id}
                  onClick={() => handleSelect(`/dashboard/licitacoes/${lic.id}`)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: 'transparent',
                    marginBottom: '2px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{lic.orgaoNome}</span>
                    <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 600 }}>{lic.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lic.objetoResumo || lic.objeto}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Acervo Results */}
          {results.acervos.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#34d399', padding: '6px 12px 8px', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={13} /> Acervo Técnico & CATs ({results.acervos.length})
              </div>
              {results.acervos.map((ac) => (
                <div 
                  key={ac.id}
                  onClick={() => handleSelect('/dashboard/acervo')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: 'transparent',
                    marginBottom: '2px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{ac.emitente}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CAT: {ac.numeroCat || 'S/N'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {ac.areaTecnica ? `${ac.areaTecnica} • ` : ''}{ac.objeto}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Documentos Results */}
          {results.documentos.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#fbbf24', padding: '6px 12px 8px', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={13} /> Certidões & Documentos ({results.documentos.length})
              </div>
              {results.documentos.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => handleSelect('/dashboard/documentos')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: 'transparent',
                    marginBottom: '2px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{doc.nome}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{doc.emissor}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Shortcut Tips */}
        <div style={{
          padding: '10px 16px',
          background: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span>Navegue com Enter e clique</span>
          <span>Atalho: <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '4px', color: 'var(--text-primary)' }}>Ctrl + K</kbd></span>
        </div>
      </div>
    </div>
  );
}
