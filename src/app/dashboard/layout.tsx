import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { GlobalSearchModal } from '@/components/layout/GlobalSearchModal'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LicitaControl | Central de Licitações',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="app-layout">
      <GlobalSearchModal />
      <Sidebar user={session.user} notificationCount={0} />
      <div className="main-content dashboard-layout">
        <div className="page-wrapper">
          {children}
          <footer style={{
            marginTop: '48px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span>LicitaControl · Central de Licitações & Gestão de Contratos</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ opacity: 0.7 }}>Desenvolvido por</span>
              <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Tríade Studio</strong>
            </span>
          </footer>
        </div>
      </div>
    </div>
  )
}
