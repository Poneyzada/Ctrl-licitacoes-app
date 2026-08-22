import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { licitacaoId, keywords = [], tipoServico } = body;

    // Fetch active acervos
    const whereClause: any = { 
      deletedAt: null,
      ativo: true
    };
    
    // Optionally filter by tipoServico if strict matching is desired
    // if (tipoServico) whereClause.tipoServico = tipoServico;

    const acervos = await prisma.acervoTecnico.findMany({
      where: whereClause,
      include: {
        organization: true
      }
    });

    // Basic calculation of compatibility based on keywords match
    const keywordLower = keywords.map((k: string) => k.toLowerCase());
    
    const results = acervos.map(acervo => {
      let matches = 0;
      let matchedKeywords: string[] = [];
      const searchableText = `${acervo.objeto} ${acervo.palavrasChave || ''} ${acervo.quantitativos || ''} ${acervo.tipoServico || ''}`.toLowerCase();
      
      keywordLower.forEach((kw: string) => {
        if (searchableText.includes(kw)) {
          matches++;
          matchedKeywords.push(kw);
        }
      });
      
      let score = keywordLower.length > 0 ? Math.round((matches / keywordLower.length) * 100) : 0;
      
      // Bonus if tipoServico matches
      if (tipoServico && acervo.tipoServico === tipoServico) {
        score = Math.min(100, score + 20);
      }

      return {
        ...acervo,
        compatibilityScore: score,
        matchedKeywords
      };
    });

    // Sort by score
    results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Group by Organization
    const groupedResults = results.reduce((acc, curr) => {
      const orgName = curr.organization?.name || 'Sem Organização';
      if (!acc[orgName]) {
        acc[orgName] = [];
      }
      acc[orgName].push(curr);
      return acc;
    }, {} as Record<string, typeof results>);

    return NextResponse.json({
      licitacaoId,
      results: groupedResults,
      totalMatches: results.filter(r => r.compatibilityScore > 0).length
    });
  } catch (error) {
    console.error('Error calculating compatibility:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
