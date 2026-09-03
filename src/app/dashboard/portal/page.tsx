import { auth } from '@/lib/auth';
import Portal from '@/app/portal';

export const metadata = { title: 'Portal LicitaControl | Central Completa' };

export default async function PortalUnifiedPage() {
  const session = await auth();
  
  return (
    <Portal
      identity={{
        email: session?.user?.email || 'diretor@licitacontrol.local',
        name: session?.user?.name || 'Diretor',
      }}
      renderedAt={new Date().toISOString()}
    />
  );
}
