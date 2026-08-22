import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q || q.length < 2) {
    return NextResponse.json({ licitacoes: [], acervos: [], documentos: [] });
  }

  try {
    const [licitacoes, acervos, documentos] = await Promise.all([
      prisma.licitacao.findMany({
        where: {
          deletedAt: null,
          OR: [
            { orgaoNome: { contains: q, mode: 'insensitive' } },
            { objeto: { contains: q, mode: 'insensitive' } },
            { numero: { contains: q, mode: 'insensitive' } },
            { municipio: { contains: q, mode: 'insensitive' } },
          ]
        },
        include: { organization: { select: { tradeName: true, name: true } } },
        take: 5
      }),
      prisma.acervoTecnico.findMany({
        where: {
          deletedAt: null,
          OR: [
            { emitente: { contains: q, mode: 'insensitive' } },
            { objeto: { contains: q, mode: 'insensitive' } },
            { areaTecnica: { contains: q, mode: 'insensitive' } },
            { numeroCat: { contains: q, mode: 'insensitive' } },
            { quantitativos: { contains: q, mode: 'insensitive' } }
          ]
        },
        include: { organization: { select: { tradeName: true, name: true } } },
        take: 5
      }),
      prisma.complianceDocument.findMany({
        where: {
          deletedAt: null,
          OR: [
            { nome: { contains: q, mode: 'insensitive' } },
            { emissor: { contains: q, mode: 'insensitive' } },
            { numero: { contains: q, mode: 'insensitive' } }
          ]
        },
        include: { organization: { select: { tradeName: true, name: true } } },
        take: 5
      })
    ]);

    return NextResponse.json({ licitacoes, acervos, documentos });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 });
  }
}
