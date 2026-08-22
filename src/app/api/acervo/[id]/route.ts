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
    const acervo = await prisma.acervoTecnico.findUnique({
      where: { id },
      include: { organization: true }
    });

    if (!acervo || acervo.deletedAt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(acervo);
  } catch (error) {
    console.error('Error fetching acervo:', error);
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

    const dataToUpdate: any = { ...body };
    if (body.periodoInicio) dataToUpdate.periodoInicio = new Date(body.periodoInicio);
    if (body.periodoFim) dataToUpdate.periodoFim = new Date(body.periodoFim);
    
    // Remove id and standard fields that shouldn't be patched directly if present
    delete dataToUpdate.id;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    const acervo = await prisma.acervoTecnico.update({
      where: { id },
      data: dataToUpdate
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'UPDATE',
        entity: 'AcervoTecnico',
        entityId: acervo.id,
        metadata: JSON.stringify(body)
      }
    });

    return NextResponse.json(acervo);
  } catch (error) {
    console.error('Error updating acervo:', error);
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
    const acervo = await prisma.acervoTecnico.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        ativo: false
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'DELETE',
        entity: 'AcervoTecnico',
        entityId: acervo.id,
        metadata: JSON.stringify({ deletedAt: acervo.deletedAt })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting acervo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
