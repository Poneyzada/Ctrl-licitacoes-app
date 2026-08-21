import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
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
      <Sidebar user={session.user} notificationCount={0} />
      <div className="main-content dashboard-layout">
        <div className="page-wrapper">
          {children}
        </div>
      </div>
    </div>
  )
}
