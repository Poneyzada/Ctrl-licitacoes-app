import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditarLicitacaoForm from './EditarLicitacaoForm';

export const metadata = { title: 'Editar Licitação | LicitaControl' };

export default async function EditarLicitacaoPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await auth();
  const { id } = await params;

  const [licitacao, organizations] = await Promise.all([
    prisma.licitacao.findUnique({
      where: { id },
      include: {
        organization: true,
        consorcio: true
      }
    }),
    prisma.organization.findMany({
      where: { deletedAt: null, active: true },
      select: { id: true, name: true, tradeName: true }
    })
  ]);

  if (!licitacao) notFound();

  return <EditarLicitacaoForm licitacao={licitacao} organizations={organizations} />;
}
