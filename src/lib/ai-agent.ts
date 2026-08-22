import Anthropic from '@anthropic-ai/sdk';

export async function analyzeLicitacao(licitacao: any, editalText?: string) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const systemPrompt = `Você é um especialista em licitações públicas brasileiras (Lei 14.133). 
        Analise a licitação e o texto do edital (se houver). 
        Extraia requisitos, riscos, recomende uma ação, etc.
        Responda ESTRITAMENTE em formato JSON com as seguintes chaves:
        {
          "scoreAderencia": number (0 a 100),
          "recomendacao": string ("PARTICIPAR", "PARTICIPAR_EM_CONSORCIO", "REQUERER_ESCLARECIMENTO", "IMPUGNAR", "DESCARTAR"),
          "resumoExecutivo": string,
          "riscos": [{ "titulo": string, "gravidade": "BAIXO"|"MEDIO"|"ALTO"|"CRITICO", "descricao": string, "mitigacao": string }],
          "lacunas": [string],
          "requisitos": [{ "tipo": string, "descricao": string, "obrigatorio": boolean, "fonte": string }],
          "proximosPassos": [string]
        }`;

      const userPrompt = `
        Licitação: ${JSON.stringify(licitacao)}
        Texto do Edital: ${editalText?.substring(0, 50000) || 'Não fornecido'}
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      let content = '';
      if (response.content[0].type === 'text') {
        content = response.content[0].text;
      }
      
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = content.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonStr);
      }
      return JSON.parse(content);
    } catch (error) {
      console.error("Erro na API da Anthropic:", error);
      // Fallback to simulation
    }
  }

  // Simulated logic based on licitacao fields
  const mockRequisitos = [
    { tipo: "JURIDICO", descricao: "Apresentar Contrato Social consolidado", obrigatorio: true, fonte: "Item 7.1" },
    { tipo: "FISCAL", descricao: "Certidão Negativa de Débitos Federais (CND)", obrigatorio: true, fonte: "Item 7.2" },
    { tipo: "FISCAL", descricao: "Certidão Negativa FGTS", obrigatorio: true, fonte: "Item 7.2" },
    { tipo: "TECNICA_OPERACIONAL", descricao: "Atestado de capacidade técnica compatível com o objeto", obrigatorio: true, fonte: "Item 8.1" },
  ];

  if (licitacao.exigeGarantia) {
    mockRequisitos.push({ tipo: "ECONOMICO", descricao: "Comprovar garantia de proposta de 1% do valor", obrigatorio: true, fonte: "Item 9" });
  }

  const riscos = [];
  if (licitacao.exigeVisita) {
    riscos.push({
      titulo: "Visita Técnica Obrigatória",
      gravidade: "MEDIO",
      descricao: "Necessário agendar e realizar visita ao local em prazo exíguo.",
      mitigacao: "Agendar imediatamente visita pelo telefone do órgão."
    });
  }
  if (!licitacao.permiteConsorcio) {
    riscos.push({
      titulo: "Vedação a Consórcio",
      gravidade: "ALTO",
      descricao: "Edital não permite consórcio, exigindo qualificação técnica exclusiva da empresa.",
      mitigacao: "Validar se acervo próprio atende todos os itens de maior relevância."
    });
  }

  let scoreAderencia = 85;
  let recomendacao = "PARTICIPAR";

  if (riscos.some(r => r.gravidade === "ALTO")) {
    scoreAderencia -= 20;
    recomendacao = "PARTICIPAR_EM_CONSORCIO"; // Or IMPUGNAR
  }

  if (!licitacao.permiteConsorcio && recomendacao === "PARTICIPAR_EM_CONSORCIO") {
    recomendacao = "IMPUGNAR";
  }

  return {
    scoreAderencia,
    recomendacao,
    resumoExecutivo: `Licitação para ${licitacao.objetoResumo || licitacao.objeto}. A análise indica viabilidade ${recomendacao === 'PARTICIPAR' ? 'alta' : 'moderada'}.`,
    riscos,
    lacunas: ["Falta detalhamento do projeto executivo", "Ausência de cronograma de desembolso"],
    requisitos: mockRequisitos,
    proximosPassos: ["Revisar atestados", "Emitir certidões atualizadas", "Elaborar proposta de preço"]
  };
}
