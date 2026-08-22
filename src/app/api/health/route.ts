import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const hasDbUrl = !!process.env.DATABASE_URL
    const dbUrlPrefix = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 16) + '...' : 'none'
    const hasSecret = !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)
    
    let userCount = 0
    let usersList: string[] = []
    let dbStatus = 'disconnected'
    let dbError = null

    try {
      const users = await prisma.user.findMany({
        select: { email: true, role: true, active: true },
      })
      userCount = users.length
      usersList = users.map((u) => `${u.email} (${u.role})`)
      dbStatus = 'connected'
    } catch (e: any) {
      dbStatus = 'error'
      dbError = e.message || String(e)
    }

    return NextResponse.json({
      status: 'ok',
      environment: {
        hasDbUrl,
        dbUrlPrefix,
        hasSecret,
      },
      database: {
        status: dbStatus,
        error: dbError,
        userCount,
        users: usersList,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message },
      { status: 500 }
    )
  }
}
