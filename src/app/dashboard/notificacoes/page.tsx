import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { 
  Bell, AlertCircle, Clock, ShieldAlert, 
  CheckCircle2, FileText, Check 
} from 'lucide-react';

export const metadata = { title: 'Notificações & Alertas | LicitaControl' };

export default async function NotificacoesPage() {
  await auth();

  const notificacoesMock = [
    {
      id: '1',
      categoria: 'URGENTE',
      titulo: 'Prazo Limite para Pedido de Esclarecimento',
      mensagem: 'Licitação SEINFRA/CE nº 042/2026: Encerramento do prazo para pedido de esclarecimento da bomba submersível.',
      createdAt: new Date(),
      lida: false
    },
    {
      id: '2',
      categoria: 'DOCUMENTO',
      titulo: 'Certidão CNDT Trabalhista Vencendo em 7 dias',
      mensagem: 'A Certidão Negativa de Débitos Trabalhistas de UFC Engenharia vence em breve. Solicite a renovação no site do TST.',
      createdAt: new Date(Date.now() - 3600000 * 4),
      lida: false
    },
    {
      id: '3',
      categoria: 'PRAZO',
      titulo: 'Sessão Pública de Disputa em 7 dias',
      mensagem: 'Prefeitura de Sobral nº 018/2026 (Pavimentação CBUQ) - Sessão agendada para 28/08 às 10h no Portal de Compras Públicas.',
      createdAt: new Date(Date.now() - 3600000 * 24),
      lida: true
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={26} style={{ color: 'var(--color-primary)' }} />
            Central de Notificações & Alertas
          </h1>
          <p className="page-subtitle">
            Avisos de prazos iminentes, vencimento de certidões e atualizações de editais
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notificacoesMock.map((notif) => (
          <div 
            key={notif.id}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              padding: '18px 20px',
              background: notif.lida ? 'var(--bg-surface)' : 'linear-gradient(135deg, rgba(22,22,24,1) 0%, rgba(26,10,15,0.4) 100%)',
              border: notif.lida ? '1px solid var(--border-color)' : '1px solid var(--border-color-accent)'
            }}
          >
            <div style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: 'var(--radius-md)', 
              background: notif.categoria === 'URGENTE' ? 'rgba(239, 68, 68, 0.15)' : (notif.categoria === 'DOCUMENTO' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)'),
              color: notif.categoria === 'URGENTE' ? '#f87171' : (notif.categoria === 'DOCUMENTO' ? '#fbbf24' : '#60a5fa'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {notif.categoria === 'URGENTE' ? <AlertCircle size={20} /> : (notif.categoria === 'DOCUMENTO' ? <ShieldAlert size={20} /> : <Clock size={20} />)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {notif.titulo}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatDate(notif.createdAt)}
                </span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {notif.mensagem}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
