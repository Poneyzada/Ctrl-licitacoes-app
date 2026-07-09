import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Limpar dados existentes
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

  const hash = await bcrypt.hash('123456', 12)

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

  await prisma.auditLog.createMany({
    data: [
      {
        userId: diretoria.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: diretoria.id,
        metadata: JSON.stringify({ ip: '192.168.1.1' }),
      },
      {
        userId: diretoria.id,
        action: 'APPROVE',
        entity: 'Tender',
        entityId: contrato1.id,
        contractId: contrato1.id,
        metadata: JSON.stringify({ decision: 'APROVADO', note: 'Aderência 94%' }),
      },
      {
        userId: coordenador.id,
        action: 'APPROVE',
        entity: 'Measurement',
        entityId: med1.id,
        contractId: contrato1.id,
        metadata: JSON.stringify({ amount: 320000, period: '2024-07' }),
      },
      {
        userId: campo.id,
        action: 'CREATE',
        entity: 'DailyLog',
        contractId: contrato1.id,
        metadata: JSON.stringify({ date: new Date().toISOString(), weather: 'ENSOLARADO' }),
      },
      {
        userId: adm.id,
        action: 'CREATE',
        entity: 'Invoice',
        entityId: med3.id,
        contractId: contrato1.id,
        metadata: JSON.stringify({ nfNumber: 'NF-003041', amount: 390000 }),
      },
    ],
  })

  console.log('✅ Logs de auditoria criados')

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
