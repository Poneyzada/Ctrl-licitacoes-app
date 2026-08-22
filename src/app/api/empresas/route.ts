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

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'CREATE',
        entity: 'Organization',
        entityId: organization.id,
        metadata: JSON.stringify(organization)
      }
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
