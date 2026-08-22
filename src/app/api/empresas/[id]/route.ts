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
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            acervo: { where: { deletedAt: null } },
            licitacoes: { where: { deletedAt: null } },
            complianceDocs: { where: { deletedAt: null } }
          }
        },
        consorcioMembros: {
          include: {
            consorcio: true
          }
        },
        complianceDocs: {
          where: { deletedAt: null },
          orderBy: { vencimento: 'asc' }
        },
        acervo: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!organization || organization.deletedAt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
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
    delete dataToUpdate.id;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    const organization = await prisma.organization.update({
      where: { id },
      data: dataToUpdate
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'UPDATE',
        entity: 'Organization',
        entityId: organization.id,
        metadata: JSON.stringify(body)
      }
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error updating organization:', error);
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
    const organization = await prisma.organization.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        active: false
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'DELETE',
        entity: 'Organization',
        entityId: organization.id,
        metadata: JSON.stringify({ deletedAt: organization.deletedAt })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
