import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const followups = await prisma.tenderFollowup.findMany({
      include: {
        licitacao: {
          include: {
            organization: true,
            documentos: true,
            requisitos: true,
            editalVersions: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(followups);
  } catch (error) {
    console.error('Error fetching followups:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const prazo = body.prazo ? new Date(body.prazo) : undefined;

    const followup = await prisma.tenderFollowup.create({
      data: {
        licitacaoId: body.licitacaoId,
        fase: body.fase || 'PENDENTE',
        tipo: body.tipo,
        proximaAcao: body.proximaAcao,
        prazo,
        responsavel: body.responsavel,
        status: body.status || 'ATIVO',
        observacoes: body.observacoes,
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'CREATE',
        entity: 'TenderFollowup',
        entityId: followup.id,
        metadata: JSON.stringify(followup)
      }
    });

    return NextResponse.json(followup, { status: 201 });
  } catch (error) {
    console.error('Error creating followup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;
    
    if (data.prazo) {
      data.prazo = new Date(data.prazo);
    }

    const followup = await prisma.tenderFollowup.update({
      where: { id },
      data
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'UPDATE',
        entity: 'TenderFollowup',
        entityId: followup.id,
        metadata: JSON.stringify(followup)
      }
    });

    return NextResponse.json(followup);
  } catch (error) {
    console.error('Error updating followup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
