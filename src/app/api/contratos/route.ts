import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// ─── GET ────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const userId = session.user.id as string
  const role   = session.user.role as string
  const isGlobal = role === 'DIRETORIA' || role === 'COORDENADOR'

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const scope  = searchParams.get('scope')

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(!isGlobal && { assignments: { some: { userId } } }),
      ...(status && { status }),
      ...(scope  && { scope  }),
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
        },
        _count: {
          select: { measurements: true, milestones: true, tasks: true, guarantees: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error('GET /api/contratos error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────
const CreateContractSchema = z.object({
  title:       z.string().min(3, 'Titulo deve ter ao menos 3 caracteres'),
  number:      z.string().min(1, 'Numero obrigatorio'),
  organ:       z.string().min(1, 'Orgao obrigatorio'),
  scope:       z.enum(['OBRA', 'SERVICO', 'GERENCIAMENTO']),
  startDate:   z.string().refine(v => !isNaN(Date.parse(v)), 'Data de inicio invalida'),
  endDate:     z.string().optional().nullable(),
  baseDate:    z.string().refine(v => !isNaN(Date.parse(v)), 'Data-base invalida'),
  totalValue:  z.number().positive('Valor deve ser positivo'),
  address:     z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const role = session.user.role as string
  if (role !== 'DIRETORIA' && role !== 'COORDENADOR') {
    return NextResponse.json({ error: 'Sem permissao para criar contratos' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = CreateContractSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, number, organ, scope, startDate, endDate, baseDate, totalValue, address, description } = parsed.data

    // Check unique number
    const existing = await prisma.contract.findUnique({ where: { number } })
    if (existing) {
      return NextResponse.json(
        { error: `Contrato com numero "${number}" ja existe` },
        { status: 409 }
      )
    }

    const contract = await prisma.contract.create({
      data: {
        title,
        number,
        organ,
        scope,
        startDate:  new Date(startDate),
        endDate:    endDate ? new Date(endDate) : null,
        baseDate:   new Date(baseDate),
        totalValue,
        address:    address    ?? null,
        description:description ?? null,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId:    session.user.id as string,
        action:    'CREATE',
        entity:    'Contract',
        entityId:  contract.id,
        contractId:contract.id,
        metadata:  JSON.stringify({ title, number, scope }),
      },
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error: unknown) {
    console.error('POST /api/contratos error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Numero de contrato ja existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}