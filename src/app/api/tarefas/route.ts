import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateTaskSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().optional().nullable(),
  assignedTo: z.string().min(1, 'Selecione o responsável'),
  contractId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const role = session.user.role as string
  if (role !== 'DIRETORIA' && role !== 'COORDENADOR') {
    return NextResponse.json({ error: 'Sem permissão para criar tarefas' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const result = CreateTaskSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const data = result.data

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        assignedTo: data.assignedTo,
        assignedBy: session.user.id as string,
        contractId: data.contractId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority,
        status: 'ABERTA',
      },
      include: {
        contract: { select: { title: true, number: true } },
        assignee: { select: { name: true } },
      }
    })

    // Cria log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'CREATE',
        entity: 'Task',
        entityId: task.id,
        contractId: data.contractId || null,
        metadata: JSON.stringify({
          title: task.title,
          assignedTo: task.assignee.name,
          priority: task.priority,
        }),
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('POST /api/tarefas error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
