'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, AlertCircle } from 'lucide-react'

interface UserItem {
  id: string
  name: string
  role: string
}

interface ContractItem {
  id: string
  title: string
  number: string
}

interface CreateTaskButtonProps {
  users: UserItem[]
  contracts: ContractItem[]
}

export default function CreateTaskButton({ users, contracts }: CreateTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [contractId, setContractId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'>('MEDIA')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          assignedTo,
          contractId: contractId || null,
          dueDate: dueDate || null,
          priority,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao criar tarefa')
      }

      // Limpa formulário e fecha
      setTitle('')
      setDescription('')
      setAssignedTo('')
      setContractId('')
      setDueDate('')
      setPriority('MEDIA')
      setIsOpen(false)
      
      // Atualiza os dados da página
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={16} />
        Nova Tarefa
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal task-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nova Tarefa</h3>
              <button className="btn-close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="error-alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="task-title">Título da Tarefa *</label>
                  <input
                    id="task-title"
                    className="form-control"
                    type="text"
                    required
                    placeholder="Ex: Revisar medição técnica"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="task-desc">Descrição</label>
                  <textarea
                    id="task-desc"
                    className="form-control"
                    rows={3}
                    placeholder="Adicione detalhes sobre o que precisa ser feito..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="task-assignee">Responsável *</label>
                    <select
                      id="task-assignee"
                      className="form-control"
                      required
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                    >
                      <option value="">Selecione um usuário</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="task-priority">Prioridade *</label>
                    <select
                      id="task-priority"
                      className="form-control"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                    >
                      <option value="BAIXA">Baixa</option>
                      <option value="MEDIA">Média</option>
                      <option value="ALTA">Alta</option>
                      <option value="URGENTE">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="task-contract">Contrato Relacionado</label>
                    <select
                      id="task-contract"
                      className="form-control"
                      value={contractId}
                      onChange={(e) => setContractId(e.target.value)}
                    >
                      <option value="">Nenhum contrato</option>
                      {contracts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.number} - {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="task-duedate">Prazo de Entrega</label>
                    <input
                      id="task-duedate"
                      className="form-control"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={loading}
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={loading || !title.trim() || !assignedTo}
                >
                  {loading ? 'Criando...' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .task-modal {
          background: var(--bg-surface);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 580px;
          border: 1px solid var(--border-color-strong);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: #f87171;
          font-size: 0.8125rem;
          margin-bottom: 16px;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
      `}</style>
    </>
  )
}
