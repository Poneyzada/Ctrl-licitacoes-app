import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const licitacao = await prisma.licitacao.findUnique({
      where: { id },
      include: {
        organization: true,
        consorcio: true,
        requisitos: true,
        equipe: true,
        documentos: true,
        editalVersions: true,
        analises: { orderBy: { createdAt: 'desc' } },
        recursosCasos: true,
        followups: true, 
      }
    });

    if (!licitacao) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    return NextResponse.json(licitacao);
  } catch (error) {
    console.error('Error fetching licitacao:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const licitacao = await prisma.licitacao.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(licitacao);
  } catch (error) {
    console.error('Error updating licitacao:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    // Soft delete
    await prisma.licitacao.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting licitacao:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
