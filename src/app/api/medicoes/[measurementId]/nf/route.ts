import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ measurementId: string }>
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const role = session.user.role as string
    if (role !== 'OPERADOR_ADM' && role !== 'DIRETORIA') {
      return NextResponse.json({ error: 'Sem permissão para registrar NF' }, { status: 403 })
    }

    const { measurementId } = await params
    const body = await req.json()
    const { nfNumber, dueAt } = body

    if (!nfNumber?.trim()) {
      return NextResponse.json({ error: 'Número da NF é obrigatório' }, { status: 400 })
    }

    const measurement = await prisma.measurement.findUnique({
      where: { id: measurementId },
      select: { id: true, status: true, contractId: true, amount: true, period: true },
    })

    if (!measurement) {
      return NextResponse.json({ error: 'Medição não encontrada' }, { status: 404 })
    }

    if (measurement.status !== 'APROVADO') {
      return NextResponse.json(
        { error: 'Somente medições aprovadas podem receber NF' },
        { status: 400 }
      )
    }

    // Upsert invoice record
    const invoice = await prisma.invoice.upsert({
      where: { measurementId },
      create: {
        measurementId,
        nfNumber: nfNumber.trim(),
        issuedAt: new Date(),
        dueAt: dueAt ? new Date(dueAt) : undefined,
        amount: measurement.amount,
      },
      update: {
        nfNumber: nfNumber.trim(),
        issuedAt: new Date(),
        dueAt: dueAt ? new Date(dueAt) : undefined,
      },
    })

    // Update measurement status to FATURADO
    await prisma.measurement.update({
      where: { id: measurementId },
      data: { status: 'FATURADO' },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Invoice',
        entityId: invoice.id,
        contractId: measurement.contractId,
        metadata: JSON.stringify({
          nfNumber: nfNumber.trim(),
          period: measurement.period,
          amount: measurement.amount,
        }),
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('[POST /api/medicoes/[id]/nf]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
