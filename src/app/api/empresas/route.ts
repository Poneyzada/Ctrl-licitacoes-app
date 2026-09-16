import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const organizations = await prisma.organization.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            acervo: { where: { deletedAt: null } },
            licitacoes: { where: { deletedAt: null } },
            complianceDocs: { where: { deletedAt: null } }
          }
        },
        consorcioMembros: {
          include: {
            consorcio: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const organization = await prisma.organization.create({
      data: {
        name: body.name,
        tradeName: body.tradeName,
        cnpj: body.cnpj,
        type: body.type || 'PROPRIA',
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        active: body.active !== undefined ? body.active : true,
        notes: body.notes
      }
    });

    // Se foi enviado cartão CNPJ ou documento inicial
    if (body.cnpjCardUrl || body.documentName) {
      try {
        await prisma.complianceDocument.create({
          data: {
            orgId: organization.id,
            nome: body.documentName || 'Cartão CNPJ e Comprovante de Inscrição.pdf',
            tipo: 'CARTAO_CNPJ',
            numero: body.cnpj || '',
            emissor: 'Receita Federal do Brasil',
            storageUrl: body.cnpjCardUrl || '',
            status: 'VIGENTE'
          }
        });
      } catch (docErr) {
        console.warn('Erro ao salvar documento inicial da empresa:', docErr);
      }
    }

    if (session.user?.id) {
      try {
        const userExists = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (userExists) {
          await prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: 'CREATE',
              entity: 'Organization',
              entityId: organization.id,
              metadata: JSON.stringify(organization)
            }
          });
        }
      } catch (auditErr) {
        console.warn('Audit log warning:', auditErr);
      }
    }

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar empresa: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
