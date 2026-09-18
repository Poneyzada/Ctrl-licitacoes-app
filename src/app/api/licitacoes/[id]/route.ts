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

    const data: any = {};

    // String fields
    const stringFields = [
      'orgaoNome', 'orgaoUasg', 'orgaoUnidade', 'municipio', 'uf',
      'modalidade', 'numero', 'numeroProcesso', 'pncpId', 'objeto',
      'objetoResumo', 'tipoServico', 'fase', 'status', 'risco',
      'plataforma', 'plataformaUrl', 'observacoes', 'resultado',
      'vencedor', 'fonteOrigem', 'pncpUrl'
    ];
    for (const f of stringFields) {
      if (body[f] !== undefined) {
        data[f] = body[f] === '' ? null : body[f];
      }
    }

    // Foreign Keys
    if (body.organizationId !== undefined) {
      data.organizationId = body.organizationId || null;
    }
    if (body.consorcioId !== undefined) {
      data.consorcioId = body.consorcioId || null;
    }
    if (body.responsavelId !== undefined) {
      data.responsavelId = body.responsavelId || null;
    }

    // Numbers
    if (body.valorEstimado !== undefined) {
      data.valorEstimado = (body.valorEstimado === '' || body.valorEstimado === null)
        ? null
        : typeof body.valorEstimado === 'number'
          ? body.valorEstimado
          : parseFloat(String(body.valorEstimado).replace(/\./g, '').replace(',', '.'));
    }
    if (body.valorFinal !== undefined) {
      data.valorFinal = (body.valorFinal === '' || body.valorFinal === null)
        ? null
        : typeof body.valorFinal === 'number'
          ? body.valorFinal
          : parseFloat(String(body.valorFinal).replace(/\./g, '').replace(',', '.'));
    }

    // Booleans
    const boolFields = [
      'orcamentoSigiloso', 'permiteConsorcio', 'permiteSubcontrato',
      'exigeVisita', 'exigeGarantia'
    ];
    for (const f of boolFields) {
      if (body[f] !== undefined) {
        data[f] = Boolean(body[f]);
      }
    }

    // Dates
    const dateFields = ['dataHoraSessao', 'dataImpugnacao', 'dataEsclarecimento', 'dataResultado'];
    for (const f of dateFields) {
      if (body[f] !== undefined) {
        data[f] = body[f] ? new Date(body[f]) : null;
      }
    }

    const licitacao = await prisma.licitacao.update({
      where: { id },
      data,
    });

    if (session.user?.id) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'UPDATE_LICITACAO',
            entity: 'Licitacao',
            entityId: id,
            metadata: JSON.stringify({ fields: Object.keys(data) })
          }
        });
      } catch (auditErr) {
        console.warn('AuditLog error:', auditErr);
      }
    }

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
