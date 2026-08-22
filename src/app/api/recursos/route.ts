import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const status = searchParams.get('status');
    const setor = searchParams.get('setor');

    const whereClause: any = {};
    if (tipo) whereClause.tipo = tipo;
    if (status) whereClause.status = status;
    if (setor) whereClause.setor = setor;

    const recursos = await prisma.recursoCaso.findMany({
      where: whereClause,
      include: {
        licitacao: {
          select: {
            orgaoNome: true,
            numero: true,
            modalidade: true,
          }
        }
      },
      orderBy: { prazo: 'asc' }
    });

    return NextResponse.json(recursos);
  } catch (error) {
    console.error('Error fetching recursos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const prazo = body.prazo ? new Date(body.prazo) : undefined;

    const recurso = await prisma.recursoCaso.create({
      data: {
        licitacaoId: body.licitacaoId,
        tipo: body.tipo,
        posicao: body.posicao,
        prazo,
        responsavel: body.responsavel,
        concorrente: body.concorrente,
        status: body.status || 'ABERTO',
        resumo: body.resumo,
        fundamento: body.fundamento,
        proximaAcao: body.proximaAcao,
        setor: body.setor,
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'CREATE',
        entity: 'RecursoCaso',
        entityId: recurso.id,
        metadata: JSON.stringify(recurso)
      }
    });

    return NextResponse.json(recurso, { status: 201 });
  } catch (error) {
    console.error('Error creating recurso:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
