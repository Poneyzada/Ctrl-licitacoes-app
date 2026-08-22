import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const orgId = searchParams.get('orgId');
    const modalidade = searchParams.get('modalidade');
    const tipoServico = searchParams.get('tipoServico');

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { objeto: { contains: search, mode: 'insensitive' } },
        { orgaoNome: { contains: search, mode: 'insensitive' } },
        { numero: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) whereClause.status = status;
    if (orgId) whereClause.organizationId = orgId;
    if (modalidade) whereClause.modalidade = modalidade;
    if (tipoServico) whereClause.tipoServico = tipoServico;

    const licitacoes = await prisma.licitacao.findMany({
      where: {
        ...whereClause,
        deletedAt: null,
      },
      include: {
        organization: true,
        consorcio: true,
        requisitos: true,
        _count: {
          select: {
            documentos: true,
            requisitos: true,
          }
        },
        analises: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { dataHoraSessao: 'asc' }
    });

    return NextResponse.json(licitacoes);
  } catch (error) {
    console.error('Error fetching licitacoes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    
    // Convert date strings to Date objects
    const dataHoraSessao = body.dataHoraSessao ? new Date(body.dataHoraSessao) : undefined;
    const dataImpugnacao = body.dataImpugnacao ? new Date(body.dataImpugnacao) : undefined;
    const dataEsclarecimento = body.dataEsclarecimento ? new Date(body.dataEsclarecimento) : undefined;

    const licitacao = await prisma.licitacao.create({
      data: {
        orgaoNome: body.orgaoNome,
        orgaoUasg: body.orgaoUasg,
        municipio: body.municipio,
        uf: body.uf,
        modalidade: body.modalidade,
        numero: body.numero,
        numeroProcesso: body.numeroProcesso,
        plataforma: body.plataforma,
        plataformaUrl: body.plataformaUrl,
        objeto: body.objeto,
        objetoResumo: body.objetoResumo,
        tipoServico: body.tipoServico,
        dataHoraSessao,
        dataImpugnacao,
        dataEsclarecimento,
        valorEstimado: body.valorEstimado ? parseFloat(body.valorEstimado) : null,
        orcamentoSigiloso: body.orcamentoSigiloso || false,
        permiteConsorcio: body.permiteConsorcio || false,
        permiteSubcontrato: body.permiteSubcontrato || false,
        exigeVisita: body.exigeVisita || false,
        exigeGarantia: body.exigeGarantia || false,
        organizationId: body.organizationId,
        observacoes: body.observacoes,
        createdBy: session.user?.id,
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'CREATE',
        entity: 'Licitacao',
        entityId: licitacao.id,
        metadata: JSON.stringify(licitacao)
      }
    });

    return NextResponse.json(licitacao, { status: 201 });
  } catch (error) {
    console.error('Error creating licitacao:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}