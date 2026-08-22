import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const tipo = searchParams.get('tipo');
    const status = searchParams.get('status');
    const expiringSoon = searchParams.get('expiringSoon') === 'true'; // <= 30 days

    const whereClause: any = { deletedAt: null };
    
    if (orgId) whereClause.orgId = orgId;
    if (tipo) whereClause.tipo = tipo;
    if (status) whereClause.status = status;
    
    if (expiringSoon) {
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      whereClause.vencimento = {
        lte: in30Days,
        gte: new Date() // Not expired yet, just expiring soon (could adjust logic)
      };
      whereClause.semVencimento = false;
    }

    const documents = await prisma.complianceDocument.findMany({
      where: whereClause,
      include: {
        organization: true,
        uploader: { select: { id: true, name: true, email: true } }
      },
      orderBy: { vencimento: 'asc' }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching compliance documents:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const emissao = body.emissao ? new Date(body.emissao) : undefined;
    const vencimento = body.vencimento ? new Date(body.vencimento) : undefined;

    const document = await prisma.complianceDocument.create({
      data: {
        orgId: body.orgId,
        professionalId: body.professionalId,
        nome: body.nome,
        tipo: body.tipo,
        numero: body.numero,
        emissor: body.emissor,
        emissao,
        vencimento,
        semVencimento: body.semVencimento || false,
        observacoes: body.observacoes,
        status: body.status || 'VIGENTE',
        storageKey: body.storageKey,
        storageUrl: body.storageUrl,
        uploadedBy: session.user?.id,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'CREATE',
        entity: 'ComplianceDocument',
        entityId: document.id,
        metadata: JSON.stringify(document)
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating compliance document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
