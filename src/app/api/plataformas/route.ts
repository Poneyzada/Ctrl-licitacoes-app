import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const plataformas = await prisma.plataformaPortal.findMany({
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(plataformas);
  } catch (error) {
    console.error('Erro ao listar plataformas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    if (!body.nome) {
      return NextResponse.json({ error: 'Nome da plataforma é obrigatório' }, { status: 400 });
    }

    const validadeCertificado = body.validadeCertificado ? new Date(body.validadeCertificado) : null;

    const plataforma = await prisma.plataformaPortal.create({
      data: {
        nome: body.nome,
        url: body.url || null,
        tipo: body.tipo || 'FEDERAL',
        ufcStatus: body.ufcStatus || 'CREDENCIADO',
        porticoStatus: body.porticoStatus || 'CREDENCIADO',
        validadeCertificado,
        responsavel: body.responsavel || null,
        loginUfc: body.loginUfc || null,
        loginPortico: body.loginPortico || null,
        observacoes: body.observacoes || null,
        storageUrl: body.storageUrl || null,
        storageKey: body.storageKey || null
      }
    });

    if (session.user?.id) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'CREATE',
            entity: 'PlataformaPortal',
            entityId: plataforma.id,
            metadata: JSON.stringify(plataforma)
          }
        });
      } catch (auditErr) {
        console.warn('Erro ao gravar audit log:', auditErr);
      }
    }

    return NextResponse.json(plataforma, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar plataforma:', error);
    return NextResponse.json({ error: 'Erro ao salvar plataforma' }, { status: 500 });
  }
}
