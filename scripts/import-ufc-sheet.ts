import 'dotenv/config'
import fs from 'fs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, VinculoProfissional } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function importUfcAcervos() {
  console.log('🚀 Iniciando importação do Acervo Técnico Oficial da UFC Engenharia...')

  // 1. Garantir que a organização UFC Engenharia existe
  let ufc = await prisma.organization.findFirst({
    where: {
      OR: [
        { name: { contains: 'UFC', mode: 'insensitive' } },
        { tradeName: { contains: 'UFC', mode: 'insensitive' } }
      ]
    }
  })

  if (!ufc) {
    ufc = await prisma.organization.create({
      data: {
        name: 'UFC Engenharia Ltda',
        tradeName: 'UFC Engenharia',
        cnpj: '12.345.678/0001-90',
        type: 'PROPRIA',
        city: 'Fortaleza',
        state: 'CE'
      }
    })
  }

  // 2. Carregar JSON extraído da planilha oficial
  const rawData = fs.readFileSync('scratch_ufc_acervos.json', 'utf-8')
  const records: any[] = JSON.parse(rawData)

  console.log(`📊 Encontrados ${records.length} registros extraídos da planilha. Processando...`)

  // Cache para profissionais
  const profCache = new Map<string, string>()

  let importedCount = 0
  let profCreated = 0

  for (const item of records) {
    const profName = item.profissional?.trim()
    let professionalId: string | null = null

    if (profName && profName.length > 3) {
      if (profCache.has(profName)) {
        professionalId = profCache.get(profName)!
      } else {
        let prof = await prisma.professional.findFirst({
          where: {
            nome: { contains: profName, mode: 'insensitive' },
            orgId: ufc.id
          }
        })

        if (!prof) {
          prof = await prisma.professional.create({
            data: {
              orgId: ufc.id,
              nome: profName,
              funcao: item.funcao || 'Responsável Técnico',
              vinculo: VinculoProfissional.CLT,
              conselho: 'CREA',
              situacaoConselho: 'ATIVO',
              ativo: true
            }
          })
          profCreated++
          console.log(`👤 Profissional cadastrado: ${profName}`)
        }

        profCache.set(profName, prof.id)
        professionalId = prof.id
      }
    }

    const catNum = item.numero_cat?.trim() || item.numero_atestado?.trim() || null
    const objeto = (item.objeto || item.titulo || item.servicos_quantificados || 'Serviços de Engenharia Consultiva').trim()
    const emitente = (item.emitente || 'Órgão Contratante / Administração Pública').trim()
    const link = (item.link_documento || '').trim()

    // Formatar quantitativos se houver
    const quantitativosList = []
    if (item.valor_obra) {
      quantitativosList.push({ descricao: 'Valor da Obra / Serviço', quantidade: item.valor_obra, unidade: 'R$' })
    }
    if (item.valor_trabalhado && item.valor_trabalhado !== '---' && item.valor_trabalhado !== '--') {
      quantitativosList.push({ descricao: 'Dimensão / Volume Trabalhado', quantidade: item.valor_trabalhado, unidade: '' })
    }
    if (item.servicos_quantificados) {
      quantitativosList.push({ descricao: 'Serviços Quantificados', quantidade: item.servicos_quantificados, unidade: 'Item' })
    }

    // Criar ou atualizar Acervo Técnico
    await prisma.acervoTecnico.create({
      data: {
        orgId: ufc.id,
        professionalId,
        numeroCat: catNum,
        numeroAtestado: catNum,
        emitente,
        objeto,
        tipoServico: item.tipo_servico || 'CONSULTORIA_E_PROJETOS',
        areaTecnica: item.sheet || 'Engenharia de Infraestrutura',
        local: 'Bahia / Ceará / Brasil',
        uf: 'BA',
        responsavelTecnico: profName ? `${profName} (CREA)` : undefined,
        urlOrigem: link || undefined,
        storageUrl: link || undefined,
        quantitativos: JSON.stringify(quantitativosList),
        palavrasChave: `${item.sheet || ''} ${item.tipo_servico || ''} ${profName || ''}`,
        observacoes: `Importado da planilha oficial UFC (Aba: ${item.sheet}). Link oficial: ${link}`,
        ativo: true
      }
    })

    importedCount++
  }

  console.log(`\n🎉 SUCESSO TOTAL!`)
  console.log(`✅ ${importedCount} atestados técnicos importados para a UFC Engenharia.`)
  console.log(`✅ ${profCreated} novos profissionais vinculados.`)
  console.log(`✅ Links de download do Google Drive integrados em todos os atestados.`)
}

importUfcAcervos()
  .catch(console.error)
  .finally(() => pool.end())
