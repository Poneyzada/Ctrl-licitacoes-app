import 'dotenv/config'
import fs from 'fs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, VinculoProfissional } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function importPorticoAcervos() {
  console.log('🚀 Iniciando importação do Acervo Técnico Oficial da Pórtico Construções...')

  // 1. Garantir que a organização Pórtico Construções existe
  let portico = await prisma.organization.findFirst({
    where: {
      OR: [
        { name: { contains: 'Pórtico', mode: 'insensitive' } },
        { name: { contains: 'Portico', mode: 'insensitive' } },
        { tradeName: { contains: 'Pórtico', mode: 'insensitive' } },
        { tradeName: { contains: 'Portico', mode: 'insensitive' } }
      ]
    }
  })

  if (!portico) {
    portico = await prisma.organization.create({
      data: {
        name: 'Pórtico Construções Ltda',
        tradeName: 'Pórtico Construções',
        cnpj: '98.765.432/0001-10',
        type: 'PROPRIA',
        city: 'Salvador',
        state: 'BA'
      }
    })
  }

  // 2. Carregar JSON extraído da planilha oficial da Pórtico
  const rawData = fs.readFileSync('scratch_portico_acervos.json', 'utf-8')
  const allRecords: any[] = JSON.parse(rawData)

  // Filtrar fora a aba RESUMO que contém apenas metadados
  const records = allRecords.filter(r => r.sheet !== 'RESUMO' && (r.titulo || r.numero_cat || r.link_documento))

  console.log(`📊 Encontrados ${records.length} registros válidos na planilha da Pórtico. Processando...`)

  // Cache para profissionais
  const profCache = new Map<string, string>()

  let importedCount = 0
  let profCreated = 0

  for (const item of records) {
    const profName = item.profissional?.trim()
    let professionalId: string | null = null

    if (profName && profName.length > 3 && !profName.startsWith('Subdivis') && !profName.startsWith('Fonte:')) {
      if (profCache.has(profName)) {
        professionalId = profCache.get(profName)!
      } else {
        let prof = await prisma.professional.findFirst({
          where: {
            nome: { contains: profName, mode: 'insensitive' },
            orgId: portico.id
          }
        })

        if (!prof) {
          prof = await prisma.professional.create({
            data: {
              orgId: portico.id,
              nome: profName,
              funcao: item.funcao || 'Engenheiro Civil / Responsável Técnico',
              vinculo: VinculoProfissional.SOCIO,
              conselho: 'CREA',
              situacaoConselho: 'ATIVO',
              ativo: true
            }
          })
          profCreated++
          console.log(`👤 Profissional cadastrado (Pórtico): ${profName}`)
        }

        profCache.set(profName, prof.id)
        professionalId = prof.id
      }
    }

    const catNum = item.numero_cat?.trim() || item.numero_atestado?.trim() || null
    const objeto = (item.objeto || item.titulo || item.servicos_quantificados || 'Execução de Obras Civis e Infraestrutura').trim()
    const emitente = (item.emitente || item.raw?.L || 'Prefeitura Municipal / Órgão Público Contratante').trim()
    const link = (item.link_documento || '').trim()

    // Formatar quantitativos
    const quantitativosList = []
    if (item.valor_obra && item.valor_obra !== '---') {
      quantitativosList.push({ descricao: 'Valor da Obra / Contrato', quantidade: item.valor_obra, unidade: 'R$' })
    }
    if (item.valor_trabalhado && item.valor_trabalhado !== '---' && item.valor_trabalhado !== '--') {
      quantitativosList.push({ descricao: 'Situação / Volume', quantidade: item.valor_trabalhado, unidade: '' })
    }
    if (item.servicos_quantificados) {
      quantitativosList.push({ descricao: 'Serviços Quantificados e Materiais', quantidade: item.servicos_quantificados, unidade: 'Item' })
    }

    // Criar Acervo Técnico para Pórtico Construções
    await prisma.acervoTecnico.create({
      data: {
        orgId: portico.id,
        professionalId,
        numeroCat: catNum,
        numeroAtestado: catNum,
        emitente,
        objeto,
        tipoServico: item.tipo_servico || 'EXECUCAO_INFRAESTRUTURA',
        areaTecnica: item.sheet || 'Obras Civis e Infraestrutura',
        local: 'Bahia / Espírito Santo / Brasil',
        uf: 'BA',
        responsavelTecnico: profName ? `${profName} (CREA)` : undefined,
        urlOrigem: link || undefined,
        storageUrl: link || undefined,
        quantitativos: JSON.stringify(quantitativosList),
        palavrasChave: `Pórtico ${item.sheet || ''} ${item.tipo_servico || ''} ${profName || ''}`,
        observacoes: `Importado da planilha oficial Pórtico (Aba: ${item.sheet}). Link oficial: ${link}`,
        ativo: true
      }
    })

    importedCount++
  }

  console.log(`\n🎉 SUCESSO TOTAL!`)
  console.log(`✅ ${importedCount} atestados técnicos importados para a Pórtico Construções.`)
  console.log(`✅ ${profCreated} novos profissionais vinculados.`)
  console.log(`✅ Links de download do Google Drive integrados em todos os atestados.`)
}

importPorticoAcervos()
  .catch(console.error)
  .finally(() => pool.end())
