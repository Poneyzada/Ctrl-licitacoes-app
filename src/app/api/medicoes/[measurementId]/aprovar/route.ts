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
    if (role !== 'COORDENADOR' && role !== 'DIRETORIA') {
      return NextResponse.json({ error: 'Sem permissão para aprovar medições' }, { status: 403 })
    }

    const { measurementId } = await params

    const measurement = await prisma.measurement.findUnique({
      where: { id: measurementId },
      select: { id: true, status: true, contractId: true, amount: true, period: true },
    })

    if (!measurement) {
      return NextResponse.json({ error: 'Medição não encontrada' }, { status: 404 })
    }

    if (measurement.status !== 'EM_ANALISE') {
      return NextResponse.json(
        { error: 'Somente medições em análise podem ser aprovadas' },
        { status: 400 }
      )
    }

    const updated = await prisma.measurement.update({
      where: { id: measurementId },
      data: {
        status: 'APROVADO',
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'APPROVE',
        entity: 'Measurement',
        entityId: measurementId,
        contractId: measurement.contractId,
        metadata: JSON.stringify({
          period: measurement.period,
          amount: measurement.amount,
        }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[POST /api/medicoes/[id]/aprovar]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
