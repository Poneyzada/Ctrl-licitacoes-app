import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/licitacoes — list all tenders with their contracts
export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const tenders = await prisma.tender.findMany({
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            number: true,
            organ: true,
            scope: true,
            status: true,
            startDate: true,
            endDate: true,
            totalValue: true,
            physicalProgress: true,
          },
        },
        decider: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tenders)
  } catch (error) {
    console.error('[GET /api/licitacoes]', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar licitacoes' },
      { status: 500 }
    )
  }
}

// POST /api/licitacoes — create a new tender (+ its linked contract)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { title, number, organ, publicationDate, deadline, editalUrl, notes } = body

    // Basic validation
    if (!title || !number || !organ || !publicationDate) {
      return NextResponse.json(
        { error: 'Campos obrigatorios ausentes: title, number, organ, publicationDate' },
        { status: 400 }
      )
    }

    // Check for duplicate contract number
    const existing = await prisma.contract.findUnique({ where: { number } })
    if (existing) {
      return NextResponse.json(
        { error: `Ja existe um contrato com o numero "${number}"` },
        { status: 409 }
      )
    }

    const startDate = new Date(publicationDate)
    const endDate = deadline ? new Date(deadline) : null

    // Create Contract first (required by the Tender foreign key)
    // We use sensible defaults for required Contract fields that are not
    // known at tender-triagem time (totalValue, baseDate, scope, etc.)
    const contract = await prisma.contract.create({
      data: {
        title,
        number,
        organ,
        scope: 'SERVICO',           // default — can be updated later
        status: 'ATIVO',
        startDate,
        endDate: endDate ?? undefined,
        baseDate: startDate,        // base date for reajuste = publication date
        totalValue: 0,              // will be filled after approval
        physicalProgress: 0,
        description: notes ?? null,
      },
    })

    // Create the Tender linked to the contract
    const tender = await prisma.tender.create({
      data: {
        contractId: contract.id,
        title,
        editalUrl: editalUrl ?? null,
        status: 'TRIAGEM',
      },
      include: {
        contract: true,
      },
    })

    return NextResponse.json(tender, { status: 201 })
  } catch (error) {
    console.error('[POST /api/licitacoes]', error)

    // Prisma unique constraint violation
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Numero de edital ja cadastrado' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno ao criar licitacao' },
      { status: 500 }
    )
  }
}