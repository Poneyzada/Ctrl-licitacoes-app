import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Portal from '@/app/portal';

export const metadata = { title: 'LicitaControl | Central de Licitações' };

export default async function StandalonePortalPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <Portal
      identity={{
        email: session?.user?.email || 'diretor@licitacontrol.local',
        name: session?.user?.name || 'Diretoria Geral',
      }}
      renderedAt={new Date().toISOString()}
    />
  );
}
