import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const profissionais = await prisma.professional.findMany({
      where: { deletedAt: null },
      include: {
        organization: true,
        acervos: {
          where: { deletedAt: null }
        }
      },
      orderBy: { nome: 'asc' }
    });

    return NextResponse.json(profissionais);
  } catch (error) {
    console.error('Erro ao listar profissionais:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();

    const professional = await prisma.professional.create({
      data: {
        orgId: body.orgId,
        nome: body.nome,
        funcao: body.funcao,
        vinculo: body.vinculo || 'CLT',
        conselho: body.conselho || 'CREA',
        numeroConselho: body.numeroConselho,
        situacaoConselho: body.situacaoConselho || 'ATIVO',
        formacao: body.formacao,
        resumoProfissional: body.resumoProfissional,
        ativo: true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'CREATE',
        entity: 'Professional',
        entityId: professional.id,
        metadata: JSON.stringify(professional)
      }
    });

    return NextResponse.json(professional, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar profissional:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar' }, { status: 500 });
  }
}
