import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const professionalId = searchParams.get('professionalId');
    const tipoServico = searchParams.get('tipoServico');
    const uf = searchParams.get('uf');
    const search = searchParams.get('search') || '';

    const whereClause: any = { deletedAt: null };
    
    if (orgId) whereClause.orgId = orgId;
    if (professionalId) whereClause.professionalId = professionalId;
    if (tipoServico) whereClause.tipoServico = tipoServico;
    if (uf) whereClause.uf = uf;
    
    if (search) {
      whereClause.OR = [
        { objeto: { contains: search, mode: 'insensitive' } },
        { emitente: { contains: search, mode: 'insensitive' } },
        { palavrasChave: { contains: search, mode: 'insensitive' } },
        { numeroAtestado: { contains: search, mode: 'insensitive' } },
        { numeroCat: { contains: search, mode: 'insensitive' } },
        { responsavelTecnico: { contains: search, mode: 'insensitive' } },
        { local: { contains: search, mode: 'insensitive' } }
      ];
    }

    const acervos = await prisma.acervoTecnico.findMany({
      where: whereClause,
      include: {
        organization: true,
        professional: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(acervos);
  } catch (error) {
    console.error('Error fetching acervo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const periodoInicio = body.periodoInicio ? new Date(body.periodoInicio) : undefined;
    const periodoFim = body.periodoFim ? new Date(body.periodoFim) : undefined;

    const acervo = await prisma.acervoTecnico.create({
      data: {
        orgId: body.orgId,
        professionalId: body.professionalId || null,
        numeroAtestado: body.numeroAtestado,
        numeroCat: body.numeroCat,
        numeroContrato: body.numeroContrato,
        emitente: body.emitente,
        objeto: body.objeto,
        tipoServico: body.tipoServico,
        quantitativos: body.quantitativos, // Should be passed as JSON string
        areaTecnica: body.areaTecnica,
        local: body.local,
        uf: body.uf,
        periodoInicio,
        periodoFim,
        responsavelTecnico: body.responsavelTecnico,
        palavrasChave: body.palavrasChave,
        storageUrl: body.storageUrl,
        urlOrigem: body.urlOrigem,
        observacoes: body.observacoes,
        createdBy: session.user?.id,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'CREATE',
        entity: 'AcervoTecnico',
        entityId: acervo.id,
        metadata: JSON.stringify(acervo)
      }
    });

    return NextResponse.json(acervo, { status: 201 });
  } catch (error) {
    console.error('Error creating acervo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
