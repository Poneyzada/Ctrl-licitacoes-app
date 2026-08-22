import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { 
  MonitorCheck, CheckCircle2, AlertTriangle, Clock, 
  ExternalLink, Key, Plus, ShieldCheck, Building2, Globe
} from 'lucide-react';

export const metadata = { title: 'Validade das Plataformas | LicitaControl' };

export default async function PlataformasPage() {
  await auth();

  const plataformasMock = [
    {
      id: '1',
      nome: 'Compras.gov.br (SIASG / Comprasnet)',
      url: 'https://comprasnet.gov.br',
      ufcStatus: 'CREDENCIADO',
      porticoStatus: 'CREDENCIADO',
      validadeCertificado: new Date('2026-11-30'),
      responsavel: 'Carlos Mendes',
      tipo: 'FEDERAL'
    },
    {
      id: '2',
      nome: 'Portal de Compras Públicas',
      url: 'https://portaldecompraspublicas.com.br',
      ufcStatus: 'CREDENCIADO',
      porticoStatus: 'CREDENCIADO',
      validadeCertificado: new Date('2026-12-15'),
      responsavel: 'Fernanda Lima',
      tipo: 'ESTADUAL_MUNICIPAL'
    },
    {
      id: '3',
      nome: 'Licitações-e (Banco do Brasil)',
      url: 'https://licitacoes-e.com.br',
      ufcStatus: 'CREDENCIADO',
      porticoStatus: 'RENOVAR',
      validadeCertificado: new Date('2026-09-10'),
      responsavel: 'Ana Paula Souza',
      tipo: 'NACIONAL'
    },
    {
      id: '4',
      nome: 'BEC / SP (Bolsa Eletrônica de Compras)',
      url: 'https://bec.sp.gov.br',
      ufcStatus: 'CREDENCIADO',
      porticoStatus: 'CREDENCIADO',
      validadeCertificado: new Date('2027-01-20'),
      responsavel: 'Carlos Mendes',
      tipo: 'ESTADUAL'
    },
    {
      id: '5',
      nome: 'BLL Compras (Bolsa de Licitações)',
      url: 'https://bllcompras.com',
      ufcStatus: 'RENOVAR',
      porticoStatus: 'CREDENCIADO',
      validadeCertificado: new Date('2026-09-05'),
      responsavel: 'Fernanda Lima',
      tipo: 'PRIVADO_MUNICIPAL'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MonitorCheck size={26} style={{ color: 'var(--color-primary)' }} />
            Validade das Plataformas & Portais de Licitação
          </h1>
          <p className="page-subtitle">
            Controle de credenciamentos, logins em portais eletrônicos e validade de certificados e-CNPJ
          </p>
        </div>
      </div>

      {/* Grid of Platforms */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
        {plataformasMock.map((p) => (
          <div 
            key={p.id}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.nome}
                  </h3>
                  <a 
                    href={p.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ fontSize: '0.78rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                  >
                    Acessar Portal <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                {p.tipo}
              </span>
            </div>

            {/* Status por Empresa */}
            <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>UFC Engenharia:</span>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  borderRadius: 'var(--radius-sm)',
                  background: p.ufcStatus === 'CREDENCIADO' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: p.ufcStatus === 'CREDENCIADO' ? '#34d399' : '#fbbf24'
                }}>
                  {p.ufcStatus === 'CREDENCIADO' ? '✓ Credenciado' : '⚠ Renovar Senha'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pórtico Construções:</span>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  borderRadius: 'var(--radius-sm)',
                  background: p.porticoStatus === 'CREDENCIADO' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: p.porticoStatus === 'CREDENCIADO' ? '#34d399' : '#fbbf24'
                }}>
                  {p.porticoStatus === 'CREDENCIADO' ? '✓ Credenciado' : '⚠ Renovar Senha'}
                </span>
              </div>
            </div>

            {/* Certificate & Responsible */}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: 'auto' }}>
              <span>Certificado e-CNPJ: {formatDate(p.validadeCertificado)}</span>
              <span>Resp: {p.responsavel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
