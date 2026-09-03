import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const acervos = await prisma.acervoTecnico.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' }
    });

    const seen = new Map<string, any>();
    const duplicateIds: string[] = [];

    for (const item of acervos) {
      // Key by CAT or Atestado + Emitente + Org
      const keyCat = item.numeroCat ? `cat_${item.orgId}_${item.numeroCat.trim().toLowerCase()}` : null;
      const keyAtestado = item.numeroAtestado ? `at_${item.orgId}_${item.numeroAtestado.trim().toLowerCase()}` : null;
      const keyObj = `obj_${item.orgId}_${item.emitente?.trim().toLowerCase()}_${item.objeto?.trim().toLowerCase().slice(0, 50)}`;

      const primaryKey = keyCat || keyAtestado || keyObj;

      if (seen.has(primaryKey)) {
        duplicateIds.push(item.id);
      } else {
        seen.set(primaryKey, item);
      }
    }

    // Soft delete / remove duplicates
    if (duplicateIds.length > 0) {
      await prisma.acervoTecnico.updateMany({
        where: { id: { in: duplicateIds } },
        data: { deletedAt: new Date(), ativo: false }
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user?.id || 'system',
          action: 'DEDUPLICATE',
          entity: 'AcervoTecnico',
          metadata: JSON.stringify({
            duplicatesRemoved: duplicateIds.length,
            ids: duplicateIds
          })
        }
      });
    }

    // Audit summary of remaining items
    const remaining = await prisma.acervoTecnico.findMany({
      where: { deletedAt: null }
    });

    const semCat = remaining.filter(a => !a.numeroCat && !a.numeroAtestado).length;
    const semArquivo = remaining.filter(a => !a.storageUrl && !a.urlOrigem).length;
    const semQuantitativo = remaining.filter(a => !a.quantitativos || a.quantitativos === '[]' || a.quantitativos === '').length;

    return NextResponse.json({
      success: true,
      totalRegistros: remaining.length,
      duplicadosRemovidos: duplicateIds.length,
      semCat,
      semArquivo,
      semQuantitativo
    });

  } catch (error) {
    console.error('Erro na deduplicação de acervo:', error);
    return NextResponse.json({ error: 'Erro interno ao deduplicar' }, { status: 500 });
  }
}
