import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    
    const recurso = await prisma.recursoCaso.findUnique({
      where: { id },
      include: {
        licitacao: {
          select: {
            orgaoNome: true,
            numero: true,
            modalidade: true,
          }
        }
      }
    });

    if (!recurso) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(recurso);
  } catch (error) {
    console.error('Error fetching recurso:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const prazo = body.prazo ? new Date(body.prazo) : undefined;

    const data: any = { ...body };
    if (prazo !== undefined) data.prazo = prazo;

    const recurso = await prisma.recursoCaso.update({
      where: { id },
      data
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'UPDATE',
        entity: 'RecursoCaso',
        entityId: recurso.id,
        metadata: JSON.stringify(recurso)
      }
    });

    return NextResponse.json(recurso);
  } catch (error) {
    console.error('Error updating recurso:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const recurso = await prisma.recursoCaso.delete({
      where: { id }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'DELETE',
        entity: 'RecursoCaso',
        entityId: recurso.id,
        metadata: JSON.stringify(recurso)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurso:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
