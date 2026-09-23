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

    // Helper to safely parse dates
    const parseDate = (d: any) => {
      if (!d) return null;
      try {
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? null : parsed;
      } catch {
        return null;
      }
    };

    // Helper to safely parse numbers
    const parseNum = (v: any) => {
      if (v === '' || v === null || v === undefined) return null;
      if (typeof v === 'number') return isNaN(v) ? null : v;
      const clean = String(v).replace(/\./g, '').replace(',', '.');
      const num = parseFloat(clean);
      return isNaN(num) ? null : num;
    };

    const dataHoraSessao = parseDate(body.dataHoraSessao);
    const dataImpugnacao = parseDate(body.dataImpugnacao);
    const dataEsclarecimento = parseDate(body.dataEsclarecimento);

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

    const modalidade = VALID_MODALIDADES.includes(body.modalidade) ? body.modalidade : null;
    const tipoServico = VALID_TIPO_SERVICO.includes(body.tipoServico) ? body.tipoServico : null;

    // Consórcio handling
    let consorcioId = body.consorcioId || null;
    const isConsorcio = Boolean(body.isConsorcio || body.formatoParticipacao === 'CONSORCIO' || body.consorcioNome);

    if (isConsorcio && body.consorcioNome && !consorcioId) {
      try {
        const consorcio = await prisma.consorcio.create({
          data: {
            name: body.consorcioNome.trim(),
            notes: body.consorcioComposicao ? body.consorcioComposicao.trim() : null,
            membros: body.organizationId ? {
              create: [
                {
                  orgId: body.organizationId,
                  percentual: 50,
                  isLider: true,
                  responsabilidade: 'Empresa Líder / Representante do Consórcio'
                }
              ]
            } : undefined
          }
        });
        consorcioId = consorcio.id;
      } catch (cErr) {
        console.warn('Could not create consorcio record:', cErr);
      }
    }

    const licitacao = await prisma.licitacao.create({
      data: {
        orgaoNome: body.orgaoNome,
        orgaoUasg: body.orgaoUasg || null,
        municipio: body.municipio || null,
        uf: body.uf || null,
        modalidade,
        numero: body.numero || null,
        numeroProcesso: body.numeroProcesso || null,
        plataforma: body.plataforma || null,
        plataformaUrl: body.plataformaUrl || null,
        objeto: body.objeto,
        objetoResumo: body.objetoResumo || null,
        tipoServico,
        dataHoraSessao,
        dataImpugnacao,
        dataEsclarecimento,
        valorEstimado: parseNum(body.valorEstimado),
        orcamentoSigiloso: Boolean(body.orcamentoSigiloso),
        permiteConsorcio: isConsorcio ? true : Boolean(body.permiteConsorcio),
        permiteSubcontrato: Boolean(body.permiteSubcontrato),
        exigeVisita: Boolean(body.exigeVisita),
        exigeGarantia: Boolean(body.exigeGarantia),
        organizationId: body.organizationId || null,
        consorcioId: isConsorcio ? consorcioId : null,
        observacoes: body.observacoes || null,
        createdBy: session.user?.id || null,
      }
    });

    // Log audit in try/catch to avoid aborting licitacao if auditLog fails
    if (session.user?.id) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'CREATE_LICITACAO',
            entity: 'Licitacao',
            entityId: licitacao.id,
            metadata: JSON.stringify({ numero: licitacao.numero, orgao: licitacao.orgaoNome })
          }
        });
      } catch (auditErr) {
        console.warn('AuditLog create skipped:', auditErr);
      }
    }

    return NextResponse.json(licitacao, { status: 201 });
  } catch (error: any) {
    console.error('Error creating licitacao:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}