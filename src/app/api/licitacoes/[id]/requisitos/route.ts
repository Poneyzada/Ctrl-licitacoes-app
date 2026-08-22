import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await params;

    const body = await req.json();
    const { requisitoId, status, providencia } = body;

    if (!requisitoId) {
      return NextResponse.json({ error: 'Requisito ID required' }, { status: 400 });
    }

    const requisito = await prisma.requisito.update({
      where: { id: requisitoId },
      data: {
        ...(status && { status }),
        ...(providencia !== undefined && { providencia }),
      }
    });

    return NextResponse.json(requisito);
  } catch (error) {
    console.error('Error updating requisito:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
