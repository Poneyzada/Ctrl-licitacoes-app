import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AuditoriaClientPage from './AuditoriaClientPage'

async function getAuditLogs() {
  const logs = await prisma.auditLog.findMany({
    include: {
      user: { select: { name: true, email: true, role: true } },
      contract: { select: { title: true, number: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  // Converte datas para string para serialização segura de Server Component para Client Component
  return logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }))
}

export default async function AuditoriaPage() {
  const session = await auth()

  const allowedRoles = ['DIRETORIA', 'DIRETOR', 'COORDENADOR', 'MANUTENCAO_MASTER']
  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    redirect('/dashboard?error=sem-permissao')
  }

  const logs = await getAuditLogs()

  return <AuditoriaClientPage initialLogs={logs} />
}
