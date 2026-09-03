import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const requisito = await prisma.requisito.create({
      data: {
        licitacaoId: id,
        tipo: body.tipo || 'TECNICA_OPERACIONAL',
        descricao: body.descricao,
        fonte: body.fonte || 'Edital / TR',
        obrigatorio: body.obrigatorio !== undefined ? body.obrigatorio : true,
        status: body.status || 'ATENDE',
        providencia: body.providencia || ''
      }
    });

    return NextResponse.json(requisito, { status: 201 });
  } catch (error) {
    console.error('Error creating requisito:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await params;

    const body = await req.json();
    const { requisitoId, status, providencia, descricao, fonte, tipo } = body;

    if (!requisitoId) {
      return NextResponse.json({ error: 'Requisito ID required' }, { status: 400 });
    }

    const requisito = await prisma.requisito.update({
      where: { id: requisitoId },
      data: {
        ...(status && { status }),
        ...(providencia !== undefined && { providencia }),
        ...(descricao && { descricao }),
        ...(fonte && { fonte }),
        ...(tipo && { tipo }),
      }
    });

    return NextResponse.json(requisito);
  } catch (error) {
    console.error('Error updating requisito:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await params;
    const { searchParams } = new URL(req.url);
    const requisitoId = searchParams.get('requisitoId');

    if (!requisitoId) {
      return NextResponse.json({ error: 'Requisito ID required' }, { status: 400 });
    }

    await prisma.requisito.delete({
      where: { id: requisitoId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting requisito:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
