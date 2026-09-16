import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const dataToUpdate = { ...body };
    delete dataToUpdate.id;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    const professional = await prisma.professional.update({
      where: { id },
      data: dataToUpdate
    });

    if (session.user?.id) {
      try {
        const userExists = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (userExists) {
          await prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: 'UPDATE',
              entity: 'Professional',
              entityId: professional.id,
              metadata: JSON.stringify(body)
            }
          });
        }
      } catch (auditErr) {
        console.warn('Audit log warning:', auditErr);
      }
    }

    return NextResponse.json(professional);
  } catch (error) {
    console.error('Erro ao atualizar profissional:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    await prisma.professional.update({
      where: { id },
      data: { deletedAt: new Date(), ativo: false }
    });

    if (session.user?.id) {
      try {
        const userExists = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (userExists) {
          await prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: 'DELETE',
              entity: 'Professional',
              entityId: id,
              metadata: JSON.stringify({ deletedAt: new Date() })
            }
          });
        }
      } catch (auditErr) {
        console.warn('Audit log warning:', auditErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir profissional:', error);
    return NextResponse.json({ error: 'Erro interno ao excluir' }, { status: 500 });
  }
}
