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
    const document = await prisma.complianceDocument.findUnique({
      where: { id },
      include: { 
        organization: true,
        uploader: { select: { id: true, name: true } }
      }
    });

    if (!document || document.deletedAt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
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
    if (body.emissao) dataToUpdate.emissao = new Date(body.emissao);
    if (body.vencimento) dataToUpdate.vencimento = new Date(body.vencimento);
    
    delete dataToUpdate.id;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    const document = await prisma.complianceDocument.update({
      where: { id },
      data: dataToUpdate
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'UPDATE',
        entity: 'ComplianceDocument',
        entityId: document.id,
        metadata: JSON.stringify(body)
      }
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
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
    const document = await prisma.complianceDocument.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        status: 'VENCIDO'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'DELETE',
        entity: 'ComplianceDocument',
        entityId: document.id,
        metadata: JSON.stringify({ deletedAt: document.deletedAt })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
