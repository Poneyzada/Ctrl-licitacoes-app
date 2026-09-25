import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const plataforma = await prisma.plataformaPortal.findUnique({
      where: { id }
    });

    if (!plataforma) {
      return NextResponse.json({ error: 'Plataforma não encontrada' }, { status: 404 });
    }

    return NextResponse.json(plataforma);
  } catch (error) {
    console.error('Erro ao buscar plataforma:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const dataToUpdate: any = { ...body };
    if (body.validadeCertificado !== undefined) {
      dataToUpdate.validadeCertificado = body.validadeCertificado ? new Date(body.validadeCertificado) : null;
    }
    delete dataToUpdate.id;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    const plataforma = await prisma.plataformaPortal.update({
      where: { id },
      data: dataToUpdate
    });

    if (session.user?.id) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'UPDATE',
            entity: 'PlataformaPortal',
            entityId: plataforma.id,
            metadata: JSON.stringify(body)
          }
        });
      } catch (auditErr) {
        console.warn('Erro ao gravar audit log:', auditErr);
      }
    }

    return NextResponse.json(plataforma);
  } catch (error) {
    console.error('Erro ao atualizar plataforma:', error);
    return NextResponse.json({ error: 'Erro ao atualizar plataforma' }, { status: 500 });
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
    await prisma.plataformaPortal.delete({
      where: { id }
    });

    if (session.user?.id) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'DELETE',
            entity: 'PlataformaPortal',
            entityId: id,
            metadata: JSON.stringify({ id })
          }
        });
      } catch (auditErr) {
        console.warn('Erro ao gravar audit log:', auditErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir plataforma:', error);
    return NextResponse.json({ error: 'Erro ao excluir plataforma' }, { status: 500 });
  }
}
