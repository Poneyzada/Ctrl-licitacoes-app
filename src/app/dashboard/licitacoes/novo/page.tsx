'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  FileText,
  Building2,
  Hash,
  Calendar,
  Link2,
  AlignLeft,
  Loader2,
} from 'lucide-react'

interface FormData {
  title: string
  number: string
  organ: string
  publicationDate: string
  deadline: string
  editalUrl: string
  notes: string
}

interface FormErrors {
  title?: string
  number?: string
  organ?: string
  publicationDate?: string
  editalUrl?: string
}

export default function NovaLicitacaoPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<FormData>({
    title: '',
    number: '',
    organ: '',
    publicationDate: '',
    deadline: '',
    editalUrl: '',
    notes: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Titulo e obrigatorio'
    if (!formData.number.trim()) newErrors.number = 'Numero do edital e obrigatorio'
    if (!formData.organ.trim()) newErrors.organ = 'Orgao e obrigatorio'
    if (!formData.publicationDate) newErrors.publicationDate = 'Data de publicacao e obrigatoria'

    if (formData.editalUrl && !formData.editalUrl.startsWith('http')) {
      newErrors.editalUrl = 'Insira uma URL valida (deve comecar com http)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setApiError(null)

    try {
      const response = await fetch('/api/licitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          number: formData.number.trim(),
          organ: formData.organ.trim(),
          publicationDate: formData.publicationDate,
          deadline: formData.deadline || undefined,
          editalUrl: formData.editalUrl.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${response.status}`)
      }

      router.push('/dashboard/licitacoes')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
      setIsLoading(false)
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="animate-fade-in">
      <style>{`
        .nova-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .nova-form-full { grid-column: 1 / -1; }
        .field-error {
          font-size: 0.75rem;
          color: var(--color-danger);
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .form-input-error {
          border-color: var(--color-danger) !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
        }
        .form-section-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .input-with-icon {
          padding-left: 38px !important;
        }
        .textarea-icon {
          position: absolute;
          left: 12px;
          top: 14px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .form-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 4px;
        }
        @media (max-width: 640px) {
          .nova-form-grid { grid-template-columns: 1fr; }
          .nova-form-full { grid-column: 1; }
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/licitacoes" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
          <ArrowLeft size={15} />
          Voltar para Licitacoes
        </Link>
        <h1 className="page-title">Nova Licitacao</h1>
        <p className="page-subtitle">
          Preencha os dados do edital para iniciar a triagem.
        </p>
      </div>

      <div style={{ maxWidth: 800 }}>
        {apiError && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            <span>&#9888;</span>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-section-title">
              <FileText size={14} />
              Identificacao do Edital
            </div>

            <div className="nova-form-grid">
              {/* Titulo */}
              <div className="form-group nova-form-full">
                <label className="form-label" htmlFor="title">
                  Titulo da Licitacao <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div className="input-wrapper">
                  <FileText size={15} className="input-icon" />
                  <input
                    id="title"
                    name="title"
                    type="text"
                    className={`form-input input-with-icon${errors.title ? ' form-input-error' : ''}`}
                    placeholder="Ex: Contratacao de servicos de pavimentacao..."
                    value={formData.title}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                {errors.title && <span className="field-error">&#9888; {errors.title}</span>}
              </div>

              {/* Numero */}
              <div className="form-group">
                <label className="form-label" htmlFor="number">
                  Numero do Edital <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div className="input-wrapper">
                  <Hash size={15} className="input-icon" />
                  <input
                    id="number"
                    name="number"
                    type="text"
                    className={`form-input input-with-icon${errors.number ? ' form-input-error' : ''}`}
                    placeholder="Ex: PE-001/2026"
                    value={formData.number}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                {errors.number && <span className="field-error">&#9888; {errors.number}</span>}
              </div>

              {/* Orgao */}
              <div className="form-group">
                <label className="form-label" htmlFor="organ">
                  Orgao Contratante <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div className="input-wrapper">
                  <Building2 size={15} className="input-icon" />
                  <input
                    id="organ"
                    name="organ"
                    type="text"
                    className={`form-input input-with-icon${errors.organ ? ' form-input-error' : ''}`}
                    placeholder="Ex: Prefeitura Municipal de Sao Paulo"
                    value={formData.organ}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                {errors.organ && <span className="field-error">&#9888; {errors.organ}</span>}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-section-title">
              <Calendar size={14} />
              Datas e Prazos
            </div>

            <div className="nova-form-grid">
              {/* Data de publicacao */}
              <div className="form-group">
                <label className="form-label" htmlFor="publicationDate">
                  Data de Publicacao <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div className="input-wrapper">
                  <Calendar size={15} className="input-icon" />
                  <input
                    id="publicationDate"
                    name="publicationDate"
                    type="date"
                    className={`form-input input-with-icon${errors.publicationDate ? ' form-input-error' : ''}`}
                    value={formData.publicationDate}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                {errors.publicationDate && (
                  <span className="field-error">&#9888; {errors.publicationDate}</span>
                )}
              </div>

              {/* Prazo */}
              <div className="form-group">
                <label className="form-label" htmlFor="deadline">Prazo de Entrega da Proposta</label>
                <div className="input-wrapper">
                  <Calendar size={15} className="input-icon" />
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    className="form-input input-with-icon"
                    value={formData.deadline}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <p className="form-hint">Opcional</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-section-title">
              <Link2 size={14} />
              Documentacao e Observacoes
            </div>

            <div className="nova-form-grid">
              {/* URL Edital */}
              <div className="form-group nova-form-full">
                <label className="form-label" htmlFor="editalUrl">Link do Edital (URL)</label>
                <div className="input-wrapper">
                  <Link2 size={15} className="input-icon" />
                  <input
                    id="editalUrl"
                    name="editalUrl"
                    type="url"
                    className={`form-input input-with-icon${errors.editalUrl ? ' form-input-error' : ''}`}
                    placeholder="https://comprasnet.gov.br/..."
                    value={formData.editalUrl}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                {errors.editalUrl
                  ? <span className="field-error">&#9888; {errors.editalUrl}</span>
                  : <p className="form-hint">Opcional — link para o edital no portal de transparencia</p>
                }
              </div>

              {/* Observacoes */}
              <div className="form-group nova-form-full">
                <label className="form-label" htmlFor="notes">Observacoes</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <AlignLeft size={15} className="textarea-icon" />
                  <textarea
                    id="notes"
                    name="notes"
                    className="form-textarea"
                    style={{ paddingLeft: 38, minHeight: 120 }}
                    placeholder="Anotacoes sobre a licitacao, pontos de atencao, contexto..."
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <p className="form-hint">Opcional — sera salvo como descricao interna</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link href="/dashboard/licitacoes" className="btn btn-secondary" style={{ pointerEvents: isLoading ? 'none' : 'auto' }}>
              Cancelar
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Cadastrar Licitacao
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}