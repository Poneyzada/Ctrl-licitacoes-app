import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })


async function main() {
  console.log('🌱 Iniciando seed do LicitaControl...')

  // Limpar dados na ordem correta (FK)
  await prisma.notificacao.deleteMany().catch(() => {})
  await prisma.calendarEvent.deleteMany().catch(() => {})
  await prisma.auditLog.deleteMany()
  await prisma.task.deleteMany()
  await prisma.guarantee.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.measurement.deleteMany()
  await prisma.dailyLog.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.tender.deleteMany()
  await prisma.contractAssignment.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.user.deleteMany()
  await prisma.acervoMatch.deleteMany().catch(() => {})
  await prisma.acervoTecnico.deleteMany().catch(() => {})
  await prisma.complianceDocument.deleteMany().catch(() => {})
  await prisma.platformRegistration.deleteMany().catch(() => {})
  await prisma.equipeLicitacao.deleteMany().catch(() => {})
  await prisma.professional.deleteMany().catch(() => {})
  await prisma.tenderFollowup.deleteMany().catch(() => {})
  await prisma.recursoCaso.deleteMany().catch(() => {})
  await prisma.requisito.deleteMany().catch(() => {})
  await prisma.analiseEdital.deleteMany().catch(() => {})
  await prisma.editalVersion.deleteMany().catch(() => {})
  await prisma.licitacaoDocumento.deleteMany().catch(() => {})
  await prisma.consorcioMembro.deleteMany().catch(() => {})
  await prisma.consorcio.deleteMany().catch(() => {})
  await prisma.licitacao.deleteMany().catch(() => {})
  await prisma.organization.deleteMany().catch(() => {})

  const hash = await bcrypt.hash('123456', 12)

  // ─── ORGANIZAÇÕES ────────────────────────────────────────────────
  const ufc = await prisma.organization.create({
    data: {
      name: 'UFC Engenharia Ltda',
      tradeName: 'UFC Engenharia',
      cnpj: '12.345.678/0001-90',
      type: 'PROPRIA',
      email: 'contato@ufcengenharia.com.br',
      phone: '(85) 3333-4444',
      address: 'Rua das Engenharias, 100',
      city: 'Fortaleza',
      state: 'CE',
    },
  })

  const portico = await prisma.organization.create({
    data: {
      name: 'Pórtico Construções e Serviços Ltda',
      tradeName: 'Pórtico Construções',
      cnpj: '98.765.432/0001-10',
      type: 'PROPRIA',
      email: 'contato@porticoconstrucoes.com.br',
      phone: '(85) 3333-5555',
      address: 'Av. das Construções, 500',
      city: 'Fortaleza',
      state: 'CE',
    },
  })

  console.log(`✅ Organizações criadas: ${ufc.tradeName} + ${portico.tradeName}`)
  void portico // usado implicitamente acima

  // Criar usuários
  const diretoria = await prisma.user.create({
    data: {
      name: 'Carlos Mendes',
      email: 'diretoria@ctrl.com',
      passwordHash: hash,
      role: 'DIRETORIA',
    },
  })

  const coordenador = await prisma.user.create({
    data: {
      name: 'Ana Paula Souza',
      email: 'coordenador@ctrl.com',
      passwordHash: hash,
      role: 'COORDENADOR',
    },
  })

  const campo = await prisma.user.create({
    data: {
      name: 'Roberto Silva',
      email: 'campo@ctrl.com',
      passwordHash: hash,
      role: 'OPERADOR_CAMPO',
    },
  })

  const adm = await prisma.user.create({
    data: {
      name: 'Fernanda Lima',
      email: 'adm@ctrl.com',
      passwordHash: hash,
      role: 'OPERADOR_ADM',
    },
  })

  console.log('✅ Usuários criados')

  // Contrato 1 — Obra ativa
  const contrato1 = await prisma.contract.create({
    data: {
      title: 'Construção da UBS Centro — Unidade Básica de Saúde',
      number: '001/2024',
      organ: 'Prefeitura Municipal de São Paulo',
      scope: 'OBRA',
      status: 'ATIVO',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-09-30'),
      baseDate: new Date('2024-03-01'),
      totalValue: 4850000,
      physicalProgress: 42,
      description: 'Construção de Unidade Básica de Saúde com área de 800m², incluindo consultórios, sala de vacinas, recepção e almoxarifado.',
      address: 'Rua das Flores, 245 — Centro — São Paulo/SP',
    },
  })

  const contrato2 = await prisma.contract.create({
    data: {
      title: 'Manutenção Predial — Complexo Administrativo',
      number: '015/2024',
      organ: 'Governo do Estado — SABESP',
      scope: 'SERVICO',
      status: 'ATIVO',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-05-31'),
      baseDate: new Date('2024-06-01'),
      totalValue: 1200000,
      physicalProgress: 67,
      description: 'Prestação de serviços continuados de manutenção predial preventiva e corretiva.',
      address: 'Av. Paulista, 1000 — São Paulo/SP',
    },
  })

  const contrato3 = await prisma.contract.create({
    data: {
      title: 'Gerenciamento de Obras — Parque Linear Rio Tamanduateí',
      number: '032/2023',
      organ: 'Secretaria Municipal de Infraestrutura Urbana',
      scope: 'GERENCIAMENTO',
      status: 'ATIVO',
      startDate: new Date('2023-11-01'),
      endDate: new Date('2026-10-31'),
      baseDate: new Date('2023-11-01'),
      totalValue: 780000,
      physicalProgress: 18,
      description: 'Serviços de gerenciamento, fiscalização e supervisão de obras do Parque Linear.',
      address: 'Parque Linear Rio Tamanduateí — Santo André/SP',
    },
  })

  console.log('✅ Contratos criados')

  await prisma.contractAssignment.createMany({
    data: [
      { userId: coordenador.id, contractId: contrato1.id },
      { userId: campo.id, contractId: contrato1.id },
      { userId: adm.id, contractId: contrato1.id },
      { userId: coordenador.id, contractId: contrato2.id },
      { userId: adm.id, contractId: contrato2.id },
      { userId: coordenador.id, contractId: contrato3.id },
      { userId: campo.id, contractId: contrato3.id },
    ],
  })

  await prisma.tender.create({
    data: {
      contractId: contrato1.id,
      title: 'Edital Tomada de Preços 001/2024 — UBS Centro',
      status: 'APROVADO',
      decisionBy: diretoria.id,
      decisionAt: new Date('2024-02-15'),
      decisionNote: 'Aprovado após análise técnica. Aderência de 94% aos requisitos.',
      aiReport: JSON.stringify({
        aderencia: 94,
        pontosCriticos: ['Prazo agressivo para fundações', 'Exige ART de responsável técnico com CREA-SP'],
        recomendacao: 'PARTICIPAR',
        resumo: 'Edital bem estruturado, com especificações técnicas detalhadas. Margem estimada de 18-22%. Baixo risco jurídico.',
      }),
    },
  })

  await prisma.tender.create({
    data: {
      contractId: contrato2.id,
      title: 'Pregão Eletrônico 015/2024 — Manutenção Predial SABESP',
      status: 'APROVADO',
      decisionBy: diretoria.id,
      decisionAt: new Date('2024-05-20'),
      aiReport: JSON.stringify({
        aderencia: 88,
        pontosCriticos: ['Exige equipe mínima de 5 técnicos', 'Resposta em até 2h para emergências'],
        recomendacao: 'PARTICIPAR',
        resumo: 'Contrato de manutenção com boa previsibilidade de receita.',
      }),
    },
  })

  await prisma.tender.create({
    data: {
      contractId: contrato3.id,
      title: 'Concorrência 032/2023 — Gerenciamento Parque Linear',
      status: 'APROVADO',
      decisionBy: diretoria.id,
      decisionAt: new Date('2023-10-10'),
      aiReport: JSON.stringify({
        aderencia: 91,
        pontosCriticos: ['Exige profissional com acervo em obras de parques urbanos'],
        recomendacao: 'PARTICIPAR',
        resumo: 'Projeto de alto valor institucional.',
      }),
    },
  })

  console.log('✅ Licitações criadas')

  const ms1 = await prisma.milestone.create({
    data: {
      contractId: contrato1.id,
      title: 'Fase 1 — Terraplanagem e Fundações',
      targetDate: new Date('2024-06-30'),
      completedDate: new Date('2024-07-15'),
      completionPct: 100,
      status: 'CONCLUIDO',
      order: 1,
    },
  })

  const ms2 = await prisma.milestone.create({
    data: {
      contractId: contrato1.id,
      title: 'Fase 2 — Estrutura e Alvenaria',
      targetDate: new Date('2024-11-30'),
      completionPct: 75,
      status: 'EM_ANDAMENTO',
      order: 2,
    },
  })

  await prisma.milestone.create({
    data: {
      contractId: contrato1.id,
      title: 'Fase 3 — Instalações Elétricas e Hidráulicas',
      targetDate: new Date('2025-04-30'),
      completionPct: 0,
      status: 'PENDENTE',
      order: 3,
    },
  })

  await prisma.milestone.create({
    data: {
      contractId: contrato1.id,
      title: 'Fase 4 — Acabamentos e Entrega',
      targetDate: new Date('2025-09-30'),
      completionPct: 0,
      status: 'PENDENTE',
      order: 4,
    },
  })

  const ms2c2 = await prisma.milestone.create({
    data: {
      contractId: contrato2.id,
      title: 'Manutenções Preventivas — Ciclo 1',
      targetDate: new Date('2024-12-31'),
      completionPct: 80,
      status: 'EM_ANDAMENTO',
      order: 1,
    },
  })

  console.log('✅ Milestones criados')

  const hoje = new Date()
  for (let i = 7; i >= 0; i--) {
    const date = new Date(hoje)
    date.setDate(hoje.getDate() - i)
    const weathers = ['ENSOLARADO', 'NUBLADO', 'ENSOLARADO', 'CHUVOSO', 'ENSOLARADO', 'NUBLADO', 'ENSOLARADO', 'ENSOLARADO']
    const isLocked = i > 1
    await prisma.dailyLog.create({
      data: {
        contractId: contrato1.id,
        milestoneId: ms2.id,
        date,
        weather: weathers[i],
        progressPct: 70 + (7 - i),
        description: `Execução da alvenaria no pavimento ${i < 3 ? 'superior' : 'térreo'}. Equipe com ${12 + i} trabalhadores.`,
        workforce: 12 + i,
        lockedAt: isLocked ? new Date(date.getTime() + 24 * 60 * 60 * 1000) : null,
        createdBy: campo.id,
        photos: '[]',
      },
    })
  }

  console.log('✅ Diários de obra criados')

  const med1 = await prisma.measurement.create({
    data: {
      contractId: contrato1.id,
      period: '2024-07',
      amount: 320000,
      description: 'Medição referente à Fase 1 — Terraplanagem concluída',
      status: 'PAGO',
      approvedBy: coordenador.id,
      approvedAt: new Date('2024-08-10'),
      dueDate: new Date('2024-08-30'),
      paidAt: new Date('2024-08-28'),
    },
  })

  await prisma.invoice.create({
    data: {
      measurementId: med1.id,
      nfNumber: 'NF-001234',
      issuedAt: new Date('2024-08-11'),
      dueAt: new Date('2024-08-30'),
      paidAt: new Date('2024-08-28'),
      amount: 320000,
    },
  })

  const med2 = await prisma.measurement.create({
    data: {
      contractId: contrato1.id,
      period: '2024-09',
      amount: 485000,
      description: 'Medição parcial — Fase 2 estrutura (40%)',
      status: 'PAGO',
      approvedBy: coordenador.id,
      approvedAt: new Date('2024-10-08'),
      dueDate: new Date('2024-10-30'),
      paidAt: new Date('2024-10-29'),
    },
  })

  await prisma.invoice.create({
    data: {
      measurementId: med2.id,
      nfNumber: 'NF-002156',
      issuedAt: new Date('2024-10-09'),
      dueAt: new Date('2024-10-30'),
      paidAt: new Date('2024-10-29'),
      amount: 485000,
    },
  })

  const med3 = await prisma.measurement.create({
    data: {
      contractId: contrato1.id,
      period: '2024-11',
      amount: 390000,
      description: 'Medição parcial — Fase 2 alvenaria (35%)',
      status: 'APROVADO',
      approvedBy: coordenador.id,
      approvedAt: new Date('2024-12-05'),
      dueDate: new Date('2024-12-30'),
    },
  })

  await prisma.invoice.create({
    data: {
      measurementId: med3.id,
      nfNumber: 'NF-003041',
      issuedAt: new Date('2024-12-06'),
      dueAt: new Date('2024-12-30'),
      amount: 390000,
    },
  })

  await prisma.measurement.create({
    data: {
      contractId: contrato1.id,
      period: '2024-12',
      amount: 275000,
      description: 'Medição parcial — Dezembro',
      status: 'EM_ANALISE',
      dueDate: new Date('2025-01-30'),
    },
  })

  await prisma.measurement.create({
    data: {
      contractId: contrato2.id,
      period: '2024-10',
      amount: 98000,
      description: 'Medição outubro — serviços de manutenção',
      status: 'ATRASADO',
      dueDate: new Date('2024-11-15'),
    },
  })

  console.log('✅ Medições criadas')

  await prisma.guarantee.createMany({
    data: [
      {
        contractId: contrato1.id,
        type: 'Seguro Garantia de Execução',
        description: 'Apólice de seguro garantia — 5% do valor contratual',
        expiryDate: new Date('2025-10-30'),
        alertDaysBefore: 60,
      },
      {
        contractId: contrato1.id,
        type: 'Seguro de Responsabilidade Civil',
        description: 'RC Obras — cobertura de danos a terceiros',
        expiryDate: new Date('2025-03-01'),
        alertDaysBefore: 45,
      },
      {
        contractId: contrato2.id,
        type: 'Caução em Dinheiro',
        description: 'Caução de 2% retida em conta vinculada',
        expiryDate: new Date('2025-05-31'),
        alertDaysBefore: 30,
      },
    ],
  })

  console.log('✅ Garantias criadas')

  await prisma.task.createMany({
    data: [
      {
        contractId: contrato1.id,
        title: 'Renovar apólice de seguro RC Obras',
        description: 'A apólice vence em 01/03. Contatar corretora e emitir nova apólice.',
        assignedTo: adm.id,
        assignedBy: coordenador.id,
        dueDate: new Date('2025-02-10'),
        priority: 'ALTA',
        status: 'ABERTA',
      },
      {
        contractId: contrato1.id,
        title: 'Enviar boletim de medição dez/2024 para aprovação',
        description: 'Medição de R$ 275.000 aguardando aprovação.',
        assignedTo: coordenador.id,
        assignedBy: diretoria.id,
        dueDate: new Date('2025-01-10'),
        priority: 'ALTA',
        status: 'ABERTA',
      },
      {
        contractId: contrato2.id,
        title: 'Regularizar medição atrasada out/2024',
        description: 'Medição de outubro com pagamento em atraso.',
        assignedTo: coordenador.id,
        assignedBy: diretoria.id,
        dueDate: new Date('2025-01-05'),
        priority: 'URGENTE',
        status: 'EM_ANDAMENTO',
      },
      {
        contractId: contrato1.id,
        title: 'Atualizar diário de obras — semana 47',
        description: 'Consolidar registros fotográficos.',
        assignedTo: campo.id,
        assignedBy: coordenador.id,
        dueDate: new Date('2024-12-20'),
        priority: 'MEDIA',
        status: 'CONCLUIDA',
      },
      {
        title: 'Analisar novo edital — Reforma Escola Municipal',
        description: 'Edital publicado no DOU. Verificar compatibilidade.',
        assignedTo: diretoria.id,
        assignedBy: coordenador.id,
        dueDate: new Date('2025-01-15'),
        priority: 'MEDIA',
        status: 'ABERTA',
      },
    ],
  })

  console.log('✅ Tarefas criadas')

  // ─── LICITAÇÕES (MÓDULO 1) ───────────────────────────────────────
  const lic1 = await prisma.licitacao.create({
    data: {
      orgaoNome: 'Secretaria de Infraestrutura do Estado do Ceará — SEINFRA',
      orgaoUasg: '925142',
      municipio: 'Fortaleza',
      uf: 'CE',
      modalidade: 'CONCORRENCIA_ELETRONICA',
      numero: '042/2026',
      numeroProcesso: '2026/00142-CE',
      objeto: 'Contratação de empresa de engenharia para implantação do Sistema Adutor e Estação de Tratamento de Água no Vale do Jaguaribe.',
      objetoResumo: 'Implantação de adutora de 85km em PEAD DE 400mm e ETA compacta de 150 L/s.',
      tipoServico: 'SERVICOS_HIDRICOS',
      fase: 'HABILITACAO',
      status: 'EM_ANALISE',
      risco: 'MEDIO',
      plataforma: 'Compras.gov.br',
      plataformaUrl: 'https://comprasnet.gov.br',
      dataHoraSessao: new Date('2026-09-15T09:00:00Z'),
      dataEsclarecimento: new Date('2026-09-08T18:00:00Z'),
      dataImpugnacao: new Date('2026-09-10T18:00:00Z'),
      valorEstimado: 24500000.0,
      permiteConsorcio: true,
      permiteSubcontrato: false,
      exigeVisita: true,
      exigeGarantia: true,
      organizationId: ufc.id,
      responsavelId: coordenador.id,
      createdBy: diretoria.id,
      observacoes: 'Licitação prioritária do Q3. Ótima aderência ao acervo hídrico da UFC Engenharia.',
    }
  });

  const lic2 = await prisma.licitacao.create({
    data: {
      orgaoNome: 'Prefeitura Municipal de Sobral — SEINFRA',
      orgaoUasg: '840120',
      municipio: 'Sobral',
      uf: 'CE',
      modalidade: 'CONCORRENCIA_ELETRONICA',
      numero: '018/2026',
      numeroProcesso: '2026/SOBRAL-88',
      objeto: 'Execução de obras de pavimentação em Concreto Betuminoso Usinado a Quente (CBUQ), drenagem pluvial e sinalização viária em vias urbanas.',
      objetoResumo: 'Pavimentação asfáltica CBUQ (120.000 m²) e drenagem (14 km).',
      tipoServico: 'EXECUCAO_INFRAESTRUTURA',
      fase: 'DISPUTA',
      status: 'APROVADA',
      risco: 'BAIXO',
      plataforma: 'Portal de Compras Públicas',
      plataformaUrl: 'https://portaldecompraspublicas.com.br',
      dataHoraSessao: new Date('2026-08-28T10:00:00Z'),
      valorEstimado: 18200000.0,
      permiteConsorcio: false,
      exigeVisita: false,
      exigeGarantia: true,
      organizationId: portico.id,
      responsavelId: coordenador.id,
      createdBy: diretoria.id,
    }
  });

  // Requisitos e Análise de IA para Licitação 1
  await prisma.analiseEdital.create({
    data: {
      licitacaoId: lic1.id,
      status: 'CONFIRMADO',
      resumoExecutivo: 'Edital com excelente aderência técnica para UFC Engenharia. Requer atenção especial à visita técnica obrigatória e ao quantitativo de assentamento de tubulação PEAD.',
      riscos: JSON.stringify([
        { tipo: 'OPERACIONAL', descricao: 'Visita técnica in loco com atestado assinado até 3 dias úteis antes da sessão', gravidade: 'ALTO', recomendacao: 'Agendar visita com equipe de campo imediatamente' },
        { tipo: 'FINANCEIRO', descricao: 'Garantia de proposta de 1% (R$ 245.000) com validade de 90 dias', gravidade: 'MEDIO', recomendacao: 'Emitir Seguro Garantia junto à seguradora' }
      ]),
      lacunas: JSON.stringify(['Planilha orçamentária do item 4.2 sem especificação do fabricante da bomba submersível']),
      conflitos: JSON.stringify([]),
      proximosPassos: JSON.stringify(['Protocolar pedido de esclarecimento sobre curva da bomba', 'Agendar vistoria técnica']),
      modelVersion: 'claude-3-5-sonnet',
      createdBy: diretoria.id,
    }
  });

  await prisma.requisito.createMany({
    data: [
      {
        licitacaoId: lic1.id,
        tipo: 'TECNICA_OPERACIONAL',
        descricao: 'Atestado de capacidade técnico-operacional comprovando execução de no mínimo 40km de adutora em diâmetro igual ou superior a 300mm.',
        obrigatorio: true,
        status: 'ATENDE',
        providencia: 'UFC possui CAT nº 1420/2023 com 65km em PEAD 400mm.',
      },
      {
        licitacaoId: lic1.id,
        tipo: 'TECNICA_PROFISSIONAL',
        descricao: 'Engenheiro Civil ou Sanitarista com CAT de responsabilidade técnica por implantação de ETA de pelo menos 100 L/s.',
        obrigatorio: true,
        status: 'ATENDE',
        providencia: 'Eng. Roberto Silva possui ART no acervo.',
      },
      {
        licitacaoId: lic1.id,
        tipo: 'JURIDICO',
        descricao: 'Comprovação de regularidade fiscal e trabalhista plena (CND Federal, FGTS, CNDT).',
        obrigatorio: true,
        status: 'ATENDE',
      },
      {
        licitacaoId: lic1.id,
        tipo: 'ECONOMICO',
        descricao: 'Índices de Liquidez Geral (LG) e Corrente (LC) >= 1.0 e Patrimônio Líquido mínimo de R$ 2.450.000.',
        obrigatorio: true,
        status: 'ATENDE',
      },
    ]
  });

  // ─── ACERVO TÉCNICO (MÓDULO 2) ────────────────────────────────────
  await prisma.acervoTecnico.createMany({
    data: [
      {
        orgId: ufc.id,
        numeroAtestado: 'AT-2023/089',
        numeroCat: 'CAT-CE-2023-01420',
        numeroContrato: 'CT-440/2021',
        emitente: 'Companhia de Água e Esgoto do Ceará — CAGECE',
        objeto: 'Execução de obras de implantação da Adutora de Integração Hídrica do Médio Curu, incluindo estação elevatória e reservatório apoiado.',
        tipoServico: 'SERVICOS_HIDRICOS',
        areaTecnica: 'Saneamento / Recursos Hídricos',
        local: 'Pentecoste',
        uf: 'CE',
        periodoInicio: new Date('2021-04-10'),
        periodoFim: new Date('2023-08-30'),
        responsavelTecnico: 'Eng. Roberto Silva — CREA-CE 45892-D',
        palavrasChave: 'adutora, pead, estacao elevatoria, cagece, saneamento, agua, tubulacao',
        quantitativos: JSON.stringify([
          { descricao: 'Assentamento de tubulação PEAD DE 400mm', quantidade: '65.400', unidade: 'm' },
          { descricao: 'Estação Elevatória de Água Bruta com 3 bombas de 150cv', quantidade: '1', unidade: 'un' },
          { descricao: 'Reservatório em concreto armado 2.000 m³', quantidade: '2', unidade: 'un' },
        ]),
        observacoes: 'Atestado emitido com louvor pela fiscalização da CAGECE.',
        ativo: true,
      },
      {
        orgId: ufc.id,
        numeroAtestado: 'AT-2024/012',
        numeroCat: 'CAT-CE-2024-00551',
        numeroContrato: 'CT-012/2022',
        emitente: 'Secretaria de Recursos Hídricos — SRH/CE',
        objeto: 'Implantação de Estação de Tratamento de Água (ETA) Modular de 200 L/s e captação flutuante.',
        tipoServico: 'SERVICOS_HIDRICOS',
        areaTecnica: 'Tratamento de Água / Saneamento',
        local: 'Iguatu',
        uf: 'CE',
        periodoInicio: new Date('2022-02-15'),
        periodoFim: new Date('2024-01-20'),
        responsavelTecnico: 'Eng. Roberto Silva — CREA-CE 45892-D',
        palavrasChave: 'eta, tratamento de agua, filtros, floculador, decantador, srh',
        quantitativos: JSON.stringify([
          { descricao: 'Estação de Tratamento de Água em Aço Inox / PRFV', quantidade: '200', unidade: 'L/s' },
          { descricao: 'Captação Flutuante com bombas anfíbias', quantidade: '2', unidade: 'cj' },
        ]),
        ativo: true,
      },
      {
        orgId: portico.id,
        numeroAtestado: 'AT-2023/115',
        numeroCat: 'CAT-CE-2023-09822',
        numeroContrato: 'CT-098/2021',
        emitente: 'Superintendência de Obras Públicas — SOP/CE',
        objeto: 'Execução de obras de pavimentação asfáltica em CBUQ, drenagem superficial e profunda e sinalização horizontal/vertical na Rodovia CE-187.',
        tipoServico: 'EXECUCAO_INFRAESTRUTURA',
        areaTecnica: 'Pavimentação / Infraestrutura Rodoviária',
        local: 'Sobral / Crateús',
        uf: 'CE',
        periodoInicio: new Date('2021-08-01'),
        periodoFim: new Date('2023-11-30'),
        responsavelTecnico: 'Eng. Carlos Mendes — CREA-CE 32110-D',
        palavrasChave: 'pavimentacao, cbuq, asfalto, drenagem, terraplanagem, sop, rodovia',
        quantitativos: JSON.stringify([
          { descricao: 'Pavimentação em Concreto Betuminoso Usinado a Quente (CBUQ)', quantidade: '185.000', unidade: 'm²' },
          { descricao: 'Sub-base e base em brita graduada tratada com cimento (BGTC)', quantidade: '24.000', unidade: 'm³' },
          { descricao: 'Drenagem superficial (meio-fio, sarjeta e descidas d’água)', quantidade: '38.000', unidade: 'm' },
        ]),
        ativo: true,
      },
      {
        orgId: portico.id,
        numeroAtestado: 'AT-2024/045',
        numeroCat: 'CAT-CE-2024-03112',
        numeroContrato: 'CT-055/2023',
        emitente: 'Prefeitura Municipal de Caucaia — SEINFRA',
        objeto: 'Construção de Complexo Escolar de 12 Salas de Aula e Ginásio Poliesportivo Coberto Padrão FNDE.',
        tipoServico: 'EXECUCAO',
        areaTecnica: 'Edificações / Construção Civil',
        local: 'Caucaia',
        uf: 'CE',
        periodoInicio: new Date('2023-03-01'),
        periodoFim: new Date('2024-05-15'),
        responsavelTecnico: 'Eng. Carlos Mendes — CREA-CE 32110-D',
        palavrasChave: 'escola, fnde, ginasio, estrutura metalica, concreto armado, edificacao',
        quantitativos: JSON.stringify([
          { descricao: 'Área construída total', quantidade: '4.250', unidade: 'm²' },
          { descricao: 'Estrutura em concreto armado e cobertura metálica', quantidade: '1.800', unidade: 'm²' },
        ]),
        ativo: true,
      }
    ]
  });

  console.log('✅ Acervo Técnico criado (UFC + Pórtico)')

  // ─── DOCUMENTOS DE HABILITAÇÃO / COMPLIANCE (MÓDULO 3) ───────────
  const vencHoje = new Date();
  const venc7d = new Date(); venc7d.setDate(vencHoje.getDate() + 5);
  const venc20d = new Date(); venc20d.setDate(vencHoje.getDate() + 18);
  const venc60d = new Date(); venc60d.setDate(vencHoje.getDate() + 65);
  const vencPassado = new Date(); vencPassado.setDate(vencHoje.getDate() - 10);

  await prisma.complianceDocument.createMany({
    data: [
      {
        orgId: ufc.id,
        nome: 'Certidão Negativa de Débitos Federais e Previdenciários (PGFN)',
        tipo: 'CND_FEDERAL',
        emissor: 'Receita Federal do Brasil / PGFN',
        numero: 'PGFN-2026-994812',
        emissao: new Date('2026-03-01'),
        vencimento: venc60d,
        status: 'VIGENTE',
        uploadedBy: adm.id,
      },
      {
        orgId: ufc.id,
        nome: 'Certificado de Regularidade do FGTS (CRF)',
        tipo: 'FGTS',
        emissor: 'Caixa Econômica Federal',
        numero: 'CRF-2026-08149',
        emissao: new Date('2026-08-01'),
        vencimento: venc20d,
        status: 'VIGENTE',
        uploadedBy: adm.id,
      },
      {
        orgId: ufc.id,
        nome: 'Certidão Negativa de Débitos Trabalhistas (CNDT)',
        tipo: 'TRABALHISTA',
        emissor: 'Tribunal Superior do Trabalho — TST',
        numero: 'CNDT-114890/2026',
        emissao: new Date('2026-03-10'),
        vencimento: venc7d,
        status: 'RENOVAR',
        observacoes: 'Vencendo em breve. Solicitar renovação automática no site do TST.',
        uploadedBy: adm.id,
      },
      {
        orgId: portico.id,
        nome: 'Certidão Negativa de Débitos Estaduais (SEFAZ/CE)',
        tipo: 'CERTIDAO_ESTADUAL',
        emissor: 'Secretaria da Fazenda do Estado do Ceará',
        numero: 'SEFAZ-CE-88412-2026',
        emissao: new Date('2026-04-15'),
        vencimento: venc60d,
        status: 'VIGENTE',
        uploadedBy: adm.id,
      },
      {
        orgId: portico.id,
        nome: 'Certidão Negativa de Débitos Municipais (ISS/IPTU)',
        tipo: 'CERTIDAO_MUNICIPAL',
        emissor: 'Secretaria Municipal de Finanças — SEFIN Fortaleza',
        numero: 'SEFIN-FTZ-009124',
        emissao: new Date('2026-02-01'),
        vencimento: vencPassado,
        status: 'VENCIDO',
        observacoes: 'Certidão vencida. Renovar imediatamente para não travar habilitação.',
        uploadedBy: adm.id,
      },
      {
        orgId: portico.id,
        nome: 'Balanço Patrimonial Registrado na Junta Comercial (JUCEC)',
        tipo: 'BALANCO_PATRIMONIAL',
        emissor: 'JUCEC — Exercício 2025',
        numero: 'REG-JUCEC-2026-114',
        emissao: new Date('2026-04-30'),
        semVencimento: true,
        status: 'VIGENTE',
        uploadedBy: adm.id,
      }
    ]
  });

  console.log('✅ Documentos de Compliance criados')

  // ─── RECURSOS & PRAZOS (MÓDULO 4) ─────────────────────────────────
  const prazoUrgente = new Date(); prazoUrgente.setDate(prazoUrgente.getDate() + 2);
  const prazoSemana = new Date(); prazoSemana.setDate(prazoSemana.getDate() + 6);

  await prisma.recursoCaso.createMany({
    data: [
      {
        licitacaoId: lic1.id,
        tipo: 'ESCLARECIMENTO',
        posicao: 'NOSSA_EMPRESA',
        prazo: prazoUrgente,
        responsavel: 'Ana Paula Souza',
        status: 'EM_ANDAMENTO',
        resumo: 'Pedido de esclarecimento referente à especificação técnica da motobomba submersível e diâmetro de recalque no item 4.2.',
        fundamento: 'Art. 164 da Lei nº 14.133/2021 — Direito de petição para esclarecimento de dúvidas editalícias.',
        proximaAcao: 'Protocolar via comprasnet até as 18h do dia de vencimento.',
        setor: 'TECNICO',
      },
      {
        licitacaoId: lic1.id,
        tipo: 'IMPUGNACAO',
        posicao: 'ADVERSARIO',
        prazo: prazoSemana,
        responsavel: 'Carlos Mendes',
        concorrente: 'Engenharia Delta Ltda',
        status: 'ABERTO',
        resumo: 'Concorrente impugnou exigência de visita técnica obrigatória alegando restrição à competitividade.',
        fundamento: 'Acórdão 1443/2023-TCU Plenário — Visita técnica só pode ser obrigatória em casos de alta complexidade comprovada.',
        proximaAcao: 'Acompanhar decisão do pregoeiro para ver se haverá suspensão da sessão.',
        setor: 'JURIDICO',
      },
      {
        licitacaoId: lic2.id,
        tipo: 'INTENCAO_RECURSAL',
        posicao: 'NOSSA_EMPRESA',
        prazo: prazoSemana,
        responsavel: 'Carlos Mendes',
        concorrente: 'Construtora Vale Verde',
        status: 'ABERTO',
        resumo: 'Interposição de recurso contra aceitação da proposta da 1ª colocada com indício de inexequibilidade de preços no item CBUQ.',
        fundamento: 'Art. 59, III da Lei 14.133/2021 — Proposta com valor manifestamente inexequível com BDI zero.',
        proximaAcao: 'Montar memorial de cálculo comprovando inviabilidade orçamentária do concorrente.',
        setor: 'ORCAMENTO',
      }
    ]
  });

  console.log('✅ Recursos & Prazos criados')

  // ─── PROFISSIONAIS & ENGENHEIROS ─────────────────────────────────
  await prisma.professional.createMany({
    data: [
      {
        orgId: ufc.id,
        nome: 'Eng. Roberto Silva',
        funcao: 'Engenheiro Civil Sanitarista Sênior',
        conselho: 'CREA-CE',
        numeroConselho: '45892-D',
        formacao: 'Engenharia Civil e Sanitária',
        vinculo: 'CLT',
        ativo: true
      },
      {
        orgId: portico.id,
        nome: 'Eng. Carlos Mendes',
        funcao: 'Engenheiro de Infraestrutura Rodoviária',
        conselho: 'CREA-CE',
        numeroConselho: '32110-D',
        formacao: 'Engenharia Civil',
        vinculo: 'SOCIO',
        ativo: true
      }
    ]
  });

  console.log('✅ Profissionais e Engenheiros criados')

  // ─── OPORTUNIDADES PNCP (ENTRADA AXXIA) ───────────────────────────
  await prisma.pncpOportunidade.createMany({
    data: [
      {
        numeroControle: 'PNCP-2026-009812',
        modalidade: 'Concorrência Eletrônica',
        orgao: 'Secretaria dos Recursos Hídricos do Estado do Ceará — SRH',
        municipio: 'Fortaleza',
        uf: 'CE',
        objeto: 'Serviços técnicos especializados de supervisão, fiscalização e apoio ao gerenciamento da implantação do Ramal do Salgado.',
        dataHoraSessao: new Date('2026-09-22T09:00:00Z'),
        valorEstimado: 8900000.0,
        pncpUrl: 'https://pncp.gov.br/app/editais/925142/2026/0098',
        status: 'NOVA',
        recomendacao: 'UFC',
        justificativa: 'Objeto de supervisão e apoio à fiscalização técnica aderente ao acervo de consultoria da UFC Engenharia.',
      },
      {
        numeroControle: 'PNCP-2026-004412',
        modalidade: 'Concorrência Eletrônica',
        orgao: 'Superintendência de Obras Públicas — SOP/CE',
        municipio: 'Juazeiro do Norte',
        uf: 'CE',
        objeto: 'Execução de obras de duplicação, restauração e pavimentação em CBUQ do Anel Viário do Cariri.',
        dataHoraSessao: new Date('2026-09-30T10:00:00Z'),
        valorEstimado: 34500000.0,
        pncpUrl: 'https://pncp.gov.br/app/editais/840120/2026/0044',
        status: 'NOVA',
        recomendacao: 'PORTICO',
        justificativa: 'Execução de obras pesadas de pavimentação asfáltica aderente ao parque de máquinas e acervo da Pórtico Construções.',
      }
    ]
  });

  console.log('✅ Oportunidades PNCP / AXXIA criadas')

  // ─── ACOMPANHANDO RESULTADO / KANBAN ──────────────────────────────
  await prisma.tenderFollowup.createMany({
    data: [
      {
        licitacaoId: lic2.id,
        fase: 'EM_ELABORACAO',
        tipo: 'PROPOSTA_AJUSTADA',
        proximaAcao: 'Adequar planilha orçamentária ao lance vencedor de R$ 17.850.000',
        prazo: prazoUrgente,
        responsavel: 'Fernanda Lima',
        status: 'ATIVO',
        observacoes: 'Pregoeiro abriu prazo de 2h úteis após a sessão para envio da proposta readequada.',
      },
      {
        licitacaoId: lic1.id,
        fase: 'PENDENTE',
        tipo: 'HABILITACAO_DOCUMENTAL',
        proximaAcao: 'Separar documentos de habilitação e atestados autenticados em PDF',
        prazo: prazoSemana,
        responsavel: 'Ana Paula Souza',
        status: 'ATIVO',
      }
    ]
  });

  console.log('✅ Acompanhamento de Resultado (Kanban) criado')

  console.log(`
╔════════════════════════════════════════════════╗
║       SEED CONCLUÍDO COM SUCESSO! 🎉           ║
╠════════════════════════════════════════════════╣
║  📧 diretoria@ctrl.com  | senha: 123456        ║
║  📧 coordenador@ctrl.com | senha: 123456       ║
║  📧 campo@ctrl.com      | senha: 123456        ║
║  📧 adm@ctrl.com        | senha: 123456        ║
╚════════════════════════════════════════════════╝
  `)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
