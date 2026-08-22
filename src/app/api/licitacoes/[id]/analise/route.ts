import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { analyzeLicitacao } from '@/lib/ai-agent';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const licitacao = await prisma.licitacao.findUnique({
      where: { id },
      include: { documentos: true }
    });

    if (!licitacao) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    // Optional: get edital text from documents if available
    let editalText = '';
    const editalDoc = licitacao.documentos.find(d => d.categoria === 'EDITAL' && d.textoExtraido);
    if (editalDoc?.textoExtraido) {
      editalText = editalDoc.textoExtraido;
    }

    const analysisResult = await analyzeLicitacao(licitacao, editalText);

    // Parse the result
    const {
      resumoExecutivo,
      riscos,
      lacunas,
      requisitos,
      proximosPassos,
      scoreAderencia,
      recomendacao
    } = analysisResult;

    // Create the AnaliseEdital
    const analise = await prisma.analiseEdital.create({
      data: {
        licitacaoId: licitacao.id,
        resumoExecutivo,
        riscos: JSON.stringify(riscos),
        lacunas: JSON.stringify(lacunas),
        proximosPassos: JSON.stringify(proximosPassos),
        createdBy: session.user?.id,
      }
    });

    // Create Requisitos
    if (requisitos && requisitos.length > 0) {
      // Clear old requisitos maybe? Or just add new ones
      await prisma.requisito.deleteMany({
        where: { licitacaoId: licitacao.id }
      });

      await prisma.requisito.createMany({
        data: requisitos.map((r: any) => ({
          licitacaoId: licitacao.id,
          tipo: r.tipo,
          descricao: r.descricao,
          obrigatorio: r.obrigatorio,
          fonte: r.fonte,
          status: 'NAO_ANALISADO'
        }))
      });
    }

    // Determine overall risk from analysis to update Licitacao
    let maxRisco: any = 'BAIXO';
    if (riscos && riscos.length > 0) {
      if (riscos.some((r: any) => r.gravidade === 'CRITICO')) maxRisco = 'CRITICO';
      else if (riscos.some((r: any) => r.gravidade === 'ALTO')) maxRisco = 'ALTO';
      else if (riscos.some((r: any) => r.gravidade === 'MEDIO')) maxRisco = 'MEDIO';
    }

    // Optionally update Licitacao
    await prisma.licitacao.update({
      where: { id: licitacao.id },
      data: {
        risco: maxRisco,
        observacoes: (licitacao.observacoes ? licitacao.observacoes + '\n\n' : '') + `Análise de IA: Recomendação - ${recomendacao} (Score: ${scoreAderencia})`
      }
    });

    return NextResponse.json({ ...analysisResult, analiseId: analise.id });
  } catch (error) {
    console.error('Error analyzing licitacao:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
