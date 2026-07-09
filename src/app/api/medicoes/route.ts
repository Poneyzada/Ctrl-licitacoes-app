import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const role = session.user.role as string
    if (role === 'OPERADOR_CAMPO') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const contractId = searchParams.get('contractId')

    if (!contractId) {
      return NextResponse.json({ error: 'contractId é obrigatório' }, { status: 400 })
    }

    const measurements = await prisma.measurement.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
      include: {
        approver: { select: { id: true, name: true } },
        invoice: true,
      },
    })

    return NextResponse.json(measurements)
  } catch (error) {
    console.error('[GET /api/medicoes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const role = session.user.role as string
    if (role === 'OPERADOR_CAMPO') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const { contractId, period, amount, description, dueDate } = body

    if (!contractId || !period || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: contractId, period, amount' },
        { status: 400 }
      )
    }

    const amountNum = Number(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    // Verify contract exists
    const contract = await prisma.contract.findUnique({
      where: { id: contractId, deletedAt: null },
      select: { id: true },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    }

    const measurement = await prisma.measurement.create({
      data: {
        contractId,
        period,
        amount: amountNum,
        description: description?.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: 'EM_ANALISE',
      },
      include: {
        approver: { select: { name: true } },
        invoice: true,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Measurement',
        entityId: measurement.id,
        contractId,
        metadata: JSON.stringify({
          period,
          amount: amountNum,
        }),
      },
    })

    return NextResponse.json(measurement, { status: 201 })
  } catch (error) {
    console.error('[POST /api/medicoes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
