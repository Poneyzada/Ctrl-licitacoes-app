import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractText } from 'unpdf';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Nenhum arquivo PDF fornecido' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Extrair texto do PDF
    const { text, totalPages } = await extractText(uint8Array, { mergePages: true });
    const fullText = (text || '').replace(/\r\n/g, '\n');

    console.log(`📄 PDF processado: "${file.name}" (${totalPages} páginas, ${fullText.length} caracteres)`);

    // 1. Órgão Licitante
    let orgaoNome = '';
    const orgaoMatches = [
      /(?:PREFEITURA\s+MUNICIPAL\s+(?:DE|DO|DA)?\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]{3,60})/i,
      /(?:GOVERNO\s+DO\s+ESTADO\s+(?:DE|DO|DA)?\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]{3,60})/i,
      /(?:SECRETARIA\s+(?:DE|DO|DA|MUNICIPAL|ESTADUAL)\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]{3,80})/i,
      /(?:ÓRGÃO|CONTRATANTE|ENTIDADE)\s*[:\-–—]\s*([^\n]{3,120})/i,
      /(?:SUPERINTENDÊNCIA|DEPARTAMENTO|COMPANHIA|TRIBUNAL|CONSELHO)\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]{3,80}/i,
    ];
    for (const regex of orgaoMatches) {
      const match = fullText.match(regex);
      if (match) {
        orgaoNome = (match[1] || match[0]).replace(/\s+/g, ' ').trim();
        break;
      }
    }
    if (!orgaoNome) {
      orgaoNome = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    }

    // 2. Número do Edital
    let numero = '';
    const editalMatch = fullText.match(/(?:EDITAL|CONCORR[ÊE]NCIA|PREG[ÃA]O(?:\s+ELETR[ÔO]NICO)?|DISPENSA)\s*(?:N[º°O.]*)\s*[:\-–—]?\s*([0-9]{1,8}(?:[./-][0-9A-Z]{1,8}){0,3})/i);
    if (editalMatch) {
      numero = editalMatch[1].trim();
    }

    // 3. Processo Administrativo
    let numeroProcesso = '';
    const procMatch = fullText.match(/(?:PROCESSO(?:\s+ADMINISTRATIVO)?(?:\s+N[º°O.]*)?)\s*[:\-–—]?\s*([0-9A-Z./-]+)/i);
    if (procMatch) {
      numeroProcesso = procMatch[1].trim();
    }

    // 4. Modalidade
    let modalidade = 'CONCORRENCIA_ELETRONICA';
    if (/PREG[ÃA]O\s+ELETR[ÔO]NICO/i.test(fullText)) {
      modalidade = 'PREGAO_ELETRONICO';
    } else if (/CONCORR[ÊE]NCIA(?:\s+ELETR[ÔO]NICA)?/i.test(fullText)) {
      modalidade = 'CONCORRENCIA_ELETRONICA';
    } else if (/CHAMAMENTO/i.test(fullText)) {
      modalidade = 'CHAMAMENTO';
    } else if (/DISPENSA/i.test(fullText)) {
      modalidade = 'DISPENSA';
    } else if (/PRESENCIAL/i.test(fullText)) {
      modalidade = 'LICITACAO_PRESENCIAL';
    }

    // 5. Objeto
    let objeto = '';
    const objetoMatch = fullText.match(/(?:^|\n)\s*(?:DO\s+)?OBJETO(?:\s+DA\s+(?:LICITAÇÃO|CONTRATAÇÃO))?\s*[:\-–—]\s*([^\n]{20,800})/i);
    if (objetoMatch) {
      objeto = objetoMatch[1].replace(/\s+/g, ' ').trim();
    } else {
      // Fallback: primeiras 300 palavras após preâmbulo
      objeto = fullText.slice(0, 400).replace(/\s+/g, ' ').trim();
    }

    // Resumo do objeto
    const objetoResumo = objeto.slice(0, 160);

    // 6. Valor Estimado
    let valorEstimado = '';
    const valorMatch = fullText.match(/(?:VALOR\s+(?:ESTIMADO|GLOBAL|MÁXIMO|TOTAL|REFERENCIAL)|ORÇAMENTO\s+ESTIMADO)\s*[:\-–—]?\s*R\$\s*([\d.]+,\d{2}|\d[\d.]+)/i);
    if (valorMatch) {
      const cleanVal = valorMatch[1].replace(/\./g, '').replace(',', '.');
      valorEstimado = cleanVal;
    }

    // 7. Data e Hora da Sessão
    let dataHoraSessao = '';
    const dateMatch = fullText.match(/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:[^\n]{0,30}?(\d{1,2})[:h](\d{2}))?/i);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      const hour = (dateMatch[4] || '09').padStart(2, '0');
      const min = (dateMatch[5] || '00').padStart(2, '0');
      dataHoraSessao = `${year}-${month}-${day}T${hour}:${min}`;
    }

    // 8. Plataforma
    let plataforma = 'Compras.gov.br';
    if (/comprasnet|compras\.gov\.br/i.test(fullText)) {
      plataforma = 'Compras.gov.br';
    } else if (/bll\s*compras|bll\.org/i.test(fullText)) {
      plataforma = 'BLL Compras';
    } else if (/licita[cç][oõ]es-e|bb\.com\.br/i.test(fullText)) {
      plataforma = 'Licitações-e (Banco do Brasil)';
    } else if (/portal\s+de\s+compras\s+p[uú]blicas/i.test(fullText)) {
      plataforma = 'Portal de Compras Públicas';
    } else if (/licitanet/i.test(fullText)) {
      plataforma = 'LicitaNet';
    }

    // 9. Local e UF
    let uf = 'CE';
    let municipio = '';
    const ufMatches = {
      CE: /Cear[aá]|Fortaleza|Sobral|Juazeiro|Crato|Caucaia/i,
      BA: /Bahia|Salvador|Feira de Santana|Porto Seguro|Ilh[eé]us|Vit[oó]ria da Conquista/i,
      PE: /Pernambuco|Recife|Petrolina|Caruaru/i,
      AL: /Alagoas|Macei[oó]|Pilar/i,
      ES: /Esp[ií]rito Santo|Vit[oó]ria|Vila Velha/i,
      SP: /S[aã]o Paulo|Campinas/i,
      RJ: /Rio de Janeiro|Niter[oó]i/i,
      MG: /Minas Gerais|Belo Horizonte/i,
      DF: /Bras[ií]lia|Distrito Federal/i,
    };
    for (const [key, reg] of Object.entries(ufMatches)) {
      if (reg.test(fullText)) {
        uf = key;
        break;
      }
    }

    const munMatch = fullText.match(/(?:MUNIC[IÍ]PIO|CIDADE)\s+(?:DE|DO|DA)?\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]{3,40})/i);
    if (munMatch) {
      municipio = munMatch[1].trim();
    }

    // 10. Condicionantes
    const permiteConsorcio = /permite(?:\s+a\s+participa[cç][aã]o\s+de)?\s+cons[oó]rcio|admitida\s+a\s+participa[cç][aã]o\s+em\s+cons[oó]rcio/i.test(fullText) && !/vedada\s+a\s+participa[cç][aã]o\s+em\s+cons[oó]rcio/i.test(fullText);
    const exigeVisita = /visita\s+t[eé]cnica\s+obrigat[oó]ria|vistoria\s+pr[eé]via\s+obrigat[oó]ria/i.test(fullText);
    const exigeGarantia = /garantia\s+da\s+proposta|garantia\s+contratual/i.test(fullText);
    const orcamentoSigiloso = /or[cç]amento\s+sigiloso|sigilo\s+do\s+or[cç]amento/i.test(fullText);

    // 11. Roteamento Empresarial e Tipo de Serviço
    const isObra = /(?:obra|execu[cç][aã]o|pavimenta[cç][aã]o|reforma|constru[cç][aã]o|terraplenagem|drenagem|edifica[cç][aã]o)/i.test(objeto);
    const isConsultoria = /(?:supervis[aã]o|gerenciamento|fiscaliza[cç][aã]o|elabora[cç][aã]o\s+de\s+projeto|consultoria|estudos|assessoria)/i.test(objeto);

    let tipoServico = 'EXECUCAO_INFRAESTRUTURA';
    if (isConsultoria && !isObra) {
      tipoServico = 'ELABORACAO_PROJETOS';
    } else if (isObra && isConsultoria) {
      tipoServico = 'CONTRATACAO_INTEGRADA';
    }

    // Localizar organização correspondente no banco
    const orgTargetName = isConsultoria && !isObra ? 'UFC' : 'Pórtico';
    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          { name: { contains: orgTargetName, mode: 'insensitive' } },
          { tradeName: { contains: orgTargetName, mode: 'insensitive' } }
        ]
      }
    });

    return NextResponse.json({
      success: true,
      extractedData: {
        organizationId: org?.id || '',
        orgaoNome,
        orgaoUasg: '',
        municipio,
        uf,
        modalidade,
        numero,
        numeroProcesso,
        plataforma,
        objeto,
        objetoResumo,
        tipoServico,
        dataHoraSessao,
        dataEsclarecimento: '',
        dataImpugnacao: '',
        valorEstimado,
        orcamentoSigiloso,
        permiteConsorcio,
        permiteSubcontrato: false,
        exigeVisita,
        exigeGarantia,
        observacoes: `Extraído automaticamente via LICIT.AI do PDF "${file.name}" (${totalPages} páginas).`,
      },
      fileMeta: {
        name: file.name,
        size: file.size,
        totalPages,
        previewText: fullText.slice(0, 1000)
      }
    });

  } catch (error: any) {
    console.error('Erro ao processar PDF:', error);
    return NextResponse.json({ 
      error: error?.message || 'Falha ao processar o arquivo PDF.' 
    }, { status: 500 });
  }
}
