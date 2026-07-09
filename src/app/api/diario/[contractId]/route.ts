import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ contractId: string }>
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { contractId } = await params

    const logs = await prisma.dailyLog.findMany({
      where: { contractId },
      orderBy: { date: 'desc' },
      include: {
        creator: { select: { id: true, name: true } },
        milestone: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('[GET /api/diario]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const role = session.user.role as string
    if (role === 'OPERADOR_ADM') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { contractId } = await params

    // Verify contract exists
    const contract = await prisma.contract.findUnique({
      where: { id: contractId, deletedAt: null },
      select: { id: true, physicalProgress: true },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const { date, milestoneId, weather, progressPct, description, workforce } = body

    // Validate required fields
    if (!date || !weather || progressPct === undefined || progressPct === null || !description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: date, weather, progressPct, description' },
        { status: 400 }
      )
    }

    const pct = Number(progressPct)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return NextResponse.json(
        { error: 'progressPct deve ser um número entre 0 e 100' },
        { status: 400 }
      )
    }

    const validWeather = ['ENSOLARADO', 'NUBLADO', 'CHUVOSO', 'TEMPESTADE']
    if (!validWeather.includes(weather)) {
      return NextResponse.json({ error: 'Condição climática inválida' }, { status: 400 })
    }

    // Create the daily log
    const dailyLog = await prisma.dailyLog.create({
      data: {
        contractId,
        milestoneId: milestoneId || undefined,
        date: new Date(date),
        weather,
        progressPct: pct,
        description: description.trim(),
        workforce: workforce != null ? Number(workforce) : undefined,
        photos: '[]',
        createdBy: session.user.id,
      },
      include: {
        creator: { select: { name: true } },
        milestone: { select: { title: true } },
      },
    })

    // Update contract physicalProgress if this log's progress is higher
    if (pct > contract.physicalProgress) {
      await prisma.contract.update({
        where: { id: contractId },
        data: { physicalProgress: pct },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'DailyLog',
        entityId: dailyLog.id,
        contractId,
        metadata: JSON.stringify({
          date,
          weather,
          progressPct: pct,
          workforce: workforce ?? null,
        }),
      },
    })

    return NextResponse.json(dailyLog, { status: 201 })
  } catch (error) {
    console.error('[POST /api/diario]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
