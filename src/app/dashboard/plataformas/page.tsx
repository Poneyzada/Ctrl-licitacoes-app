import { Construction } from 'lucide-react';

export default function PlataformasPage() {
  return (
    <main style={{ padding: '32px 24px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        marginBottom: '8px'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Validade das Plataformas</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Controle de cadastros e certificados
      </p>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '48px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        <Construction size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Em construção</p>
        <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Este módulo está sendo desenvolvido</p>
      </div>
    </main>
  );
}
