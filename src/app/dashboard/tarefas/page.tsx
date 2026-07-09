import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate, formatDateTime } from '@/lib/utils'
import { CheckSquare, Clock, AlertTriangle, CheckCircle, Plus } from 'lucide-react'
import Link from 'next/link'

async function getTasks(userId: string, role: string) {
  const whereFilter = role === 'DIRETORIA'
    ? {}
    : { assignedTo: userId }

  const tasks = await prisma.task.findMany({
    where: whereFilter,
    include: {
      contract: { select: { title: true, number: true } },
      creator: { select: { name: true } },
      assignee: { select: { name: true } },
    },
    orderBy: [
      { status: 'asc' },
      { dueDate: 'asc' },
    ],
  })

  return tasks
}

export default async function TarefasPage() {
  const session = await auth()
  const userId = session?.user?.id as string
  const role = session?.user?.role as string

  const tasks = await getTasks(userId, role)

  const open = tasks.filter((t) => t.status === 'ABERTA')
  const inProgress = tasks.filter((t) => t.status === 'EM_ANDAMENTO')
  const done = tasks.filter((t) => t.status === 'CONCLUIDA')

  const priorityConfig: Record<string, { label: string; color: string }> = {
    URGENTE: { label: 'Urgente', color: '#f87171' },
    ALTA: { label: 'Alta', color: '#fbbf24' },
    MEDIA: { label: 'Média', color: '#a5b4fc' },
    BAIXA: { label: 'Baixa', color: '#6ee7b7' },
  }

  const statusConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    ABERTA: { label: 'Abertas', icon: <Clock size={16} color="#a5b4fc" /> },
    EM_ANDAMENTO: { label: 'Em Andamento', icon: <AlertTriangle size={16} color="#fbbf24" /> },
    CONCLUIDA: { label: 'Concluídas', icon: <CheckCircle size={16} color="#34d399" /> },
  }

  const TaskCard = ({ task }: { task: (typeof tasks)[0] }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'CONCLUIDA'
    const priority = priorityConfig[task.priority]

    return (
      <div className={`task-card ${task.status === 'CONCLUIDA' ? 'task-done' : ''} ${isOverdue ? 'task-overdue' : ''}`}>
        <div className="task-card-header">
          <div className="task-priority-dot" style={{ background: priority.color }} />
          <div className="task-card-title">{task.title}</div>
          <span className="badge badge-neutral-dark" style={{ background: `${priority.color}20`, color: priority.color, fontSize: '0.65rem' }}>
            {priority.label}
          </span>
        </div>

        {task.description && (
          <p className="task-card-desc">{task.description}</p>
        )}

        <div className="task-card-footer">
          <div className="flex gap-2 items-center flex-wrap">
            {task.contract && (
              <span className="task-tag">
                📋 {task.contract.number}
              </span>
            )}
            <span className="task-tag">
              👤 {task.creator.name}
            </span>
          </div>
          {task.dueDate && (
            <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
              {isOverdue ? '⚠️ ' : '📅 '}{formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    )
  }

  const groups = [
    { key: 'ABERTA', tasks: open },
    { key: 'EM_ANDAMENTO', tasks: inProgress },
    { key: 'CONCLUIDA', tasks: done },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Minhas Tarefas</h1>
          <p className="page-subtitle">
            {open.length + inProgress.length} pendentes · {done.length} concluídas
          </p>
        </div>
        {(role === 'DIRETORIA' || role === 'COORDENADOR') && (
          <button className="btn btn-primary">
            <Plus size={16} />
            Nova Tarefa
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
            <Clock size={18} color="#a5b4fc" />
          </div>
          <div className="stat-value">{open.length}</div>
          <div className="stat-label">Abertas</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <AlertTriangle size={18} color="#fbbf24" />
          </div>
          <div className="stat-value">{inProgress.length}</div>
          <div className="stat-label">Em Andamento</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <CheckCircle size={18} color="#34d399" />
          </div>
          <div className="stat-value">{done.length}</div>
          <div className="stat-label">Concluídas</div>
        </div>
      </div>

      {/* Kanban */}
      <div className="kanban-grid">
        {groups.map(({ key, tasks: groupTasks }) => {
          const config = statusConfig[key]
          return (
            <div key={key} className="kanban-column">
              <div className="kanban-header">
                {config.icon}
                <span className="kanban-label">{config.label}</span>
                <span className="kanban-count">{groupTasks.length}</span>
              </div>
              <div className="kanban-body">
                {groupTasks.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 0' }}>
                    <p className="text-xs">Nenhuma tarefa aqui</p>
                  </div>
                ) : (
                  groupTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        .kanban-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .kanban-grid { grid-template-columns: 1fr; }
        }

        .kanban-column {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .kanban-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.02);
        }

        .kanban-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
        }

        .kanban-count {
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          padding: 2px 8px;
          border-radius: 99px;
        }

        .kanban-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 80px;
        }

        .task-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 14px;
          transition: all var(--transition-base);
        }

        .task-card:hover {
          border-color: var(--border-color-strong);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .task-card.task-done {
          opacity: 0.6;
        }

        .task-card.task-overdue {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.04);
        }

        .task-card-header {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
        }

        .task-priority-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .task-card-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
          line-height: 1.4;
        }

        .task-card-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 10px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .task-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }

        .task-tag {
          font-size: 0.7rem;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-muted);
          padding: 2px 8px;
          border-radius: 99px;
          white-space: nowrap;
        }

        .task-due {
          font-size: 0.7rem;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .task-due.overdue {
          color: #f87171;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
