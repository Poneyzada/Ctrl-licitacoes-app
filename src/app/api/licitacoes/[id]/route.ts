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

    const VALID_MODALIDADES = [
      'CONCORRENCIA_ELETRONICA',
      'LICITACAO_PRESENCIAL',
      'CHAMAMENTO',
      'PREGAO_ELETRONICO',
      'DISPENSA',
    ];

    const VALID_TIPO_SERVICO = [
      'ELABORACAO_PROJETOS',
      'PROJETO_INFRAESTRUTURA',
      'CONTRATACAO_INTEGRADA',
      'EXECUCAO',
      'EXECUCAO_INFRAESTRUTURA',
      'SERVICOS_HIDRICOS',
      'FISCALIZACAO',
      'ASSESSORAMENTO',
      'GERENCIAMENTO',
      'MANUTENCAO',
      'SUPERVISAO',
      'PAVIMENTACAO_INFRAESTRUTURA',
      'EXECUCAO_EDIFICACOES',
      'OBRAS_RODOVIARIAS',
      'SUPERVISAO_FISCALIZACAO',
      'ASSESSORAMENTO_GERENCIAMENTO',
    ];

    // String fields
    const stringFields = [
      'orgaoNome', 'orgaoUasg', 'orgaoUnidade', 'municipio', 'uf',
      'numero', 'numeroProcesso', 'pncpId', 'objeto',
      'objetoResumo', 'fase', 'status', 'risco',
      'plataforma', 'plataformaUrl', 'observacoes', 'resultado',
      'vencedor', 'fonteOrigem', 'pncpUrl'
    ];
    for (const f of stringFields) {
      if (body[f] !== undefined) {
        data[f] = body[f] === '' ? null : body[f];
      }
    }

    if (body.modalidade !== undefined) {
      data.modalidade = VALID_MODALIDADES.includes(body.modalidade) ? body.modalidade : null;
    }
    if (body.tipoServico !== undefined) {
      data.tipoServico = VALID_TIPO_SERVICO.includes(body.tipoServico) ? body.tipoServico : null;
    }

    // Foreign Keys
    if (body.organizationId !== undefined) {
      data.organizationId = body.organizationId || null;
    }

    // Consórcio handling
    if (body.formatoParticipacao !== undefined || body.isConsorcio !== undefined || body.consorcioNome !== undefined) {
      const isConsorcio = Boolean(body.isConsorcio || body.formatoParticipacao === 'CONSORCIO');
      if (!isConsorcio) {
        data.consorcioId = null;
      } else {
        const existing = await prisma.licitacao.findUnique({
          where: { id },
          select: { consorcioId: true }
        });

        if (existing?.consorcioId) {
          if (body.consorcioNome) {
            await prisma.consorcio.update({
              where: { id: existing.consorcioId },
              data: {
                name: body.consorcioNome.trim(),
                notes: body.consorcioComposicao !== undefined ? (body.consorcioComposicao ? body.consorcioComposicao.trim() : null) : undefined
              }
            });
          }
          data.consorcioId = existing.consorcioId;
        } else if (body.consorcioNome) {
          try {
            const consorcio = await prisma.consorcio.create({
              data: {
                name: body.consorcioNome.trim(),
                notes: body.consorcioComposicao ? body.consorcioComposicao.trim() : null,
                membros: (body.organizationId || data.organizationId) ? {
                  create: [
                    {
                      orgId: body.organizationId || data.organizationId,
                      percentual: 50,
                      isLider: true,
                      responsabilidade: 'Empresa Líder / Representante do Consórcio'
                    }
                  ]
                } : undefined
              }
            });
            data.consorcioId = consorcio.id;
          } catch (cErr) {
            console.warn('Could not create consorcio in PATCH:', cErr);
          }
        }
        data.permiteConsorcio = true;
      }
    } else if (body.consorcioId !== undefined) {
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
