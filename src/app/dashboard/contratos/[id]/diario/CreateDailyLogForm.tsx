'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

interface Milestone {
  id: string
  title: string
  status: string
}

interface Props {
  contractId: string
  milestones: Milestone[]
}

const WEATHER_OPTIONS = [
  { value: 'ENSOLARADO', label: 'Ensolarado', icon: '☀️' },
  { value: 'NUBLADO', label: 'Nublado', icon: '⛅' },
  { value: 'CHUVOSO', label: 'Chuvoso', icon: '🌧️' },
  { value: 'TEMPESTADE', label: 'Tempestade', icon: '⛈️' },
]

export default function CreateDailyLogForm({ contractId, milestones }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    date: today,
    milestoneId: '',
    weather: 'ENSOLARADO',
    progressPct: '',
    description: '',
    workforce: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/diario/${contractId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          milestoneId: form.milestoneId || undefined,
          weather: form.weather,
          progressPct: Number(form.progressPct),
          description: form.description,
          workforce: form.workforce ? Number(form.workforce) : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao salvar registro')
      }

      setSuccess(true)
      setForm({ date: today, milestoneId: '', weather: 'ENSOLARADO', progressPct: '', description: '', workforce: '' })
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .dlf-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border: 2px dashed var(--border-color-strong);
          border-radius: var(--radius-lg);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-base);
          font-family: var(--font-sans);
        }
        .dlf-toggle:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
          background: rgba(59,130,246,0.06);
        }
        .dlf-form {
          background: var(--bg-surface);
          border: 1px solid var(--border-color-strong);
          border-radius: var(--radius-lg);
          padding: 24px;
          animation: slideUp 0.2s ease;
        }
        .dlf-form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .weather-radio-group {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .weather-radio-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 8px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color-strong);
          background: var(--bg-elevated);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-align: center;
        }
        .weather-radio-label:has(input:checked) {
          border-color: var(--color-primary);
          background: rgba(59,130,246,0.1);
          color: var(--color-primary);
        }
        .weather-radio-label input {
          display: none;
        }
        .weather-emoji {
          font-size: 1.5rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 640px) {
          .weather-radio-group { grid-template-columns: repeat(2, 1fr); }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {success && (
        <div className="alert alert-success mb-4">
          ✅ Registro adicionado com sucesso!
        </div>
      )}

      {!isOpen ? (
        <button className="dlf-toggle" onClick={() => setIsOpen(true)}>
          <Plus size={18} />
          Adicionar Registro ao Diário
        </button>
      ) : (
        <div className="dlf-form">
          <div className="dlf-form-header">
            <h3 className="font-semibold text-primary" style={{ fontSize: '1rem' }}>
              📝 Novo Registro
            </h3>
            <button
              onClick={() => { setIsOpen(false); setError(null) }}
              className="btn btn-ghost btn-sm btn-icon"
              style={{ padding: '4px 8px', fontSize: '1.25rem', lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row mb-4">
              <div className="form-group">
                <label className="form-label">Data *</label>
                <input
                  type="date"
                  name="date"
                  className="form-input"
                  value={form.date}
                  onChange={handleChange}
                  max={today}
                  required
                />
              </div>

              {milestones.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Marco Vinculado</label>
                  <select
                    name="milestoneId"
                    className="form-select"
                    value={form.milestoneId}
                    onChange={handleChange}
                  >
                    <option value="">— Nenhum —</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Weather */}
            <div className="form-group mb-4">
              <label className="form-label">Condição Climática *</label>
              <div className="weather-radio-group">
                {WEATHER_OPTIONS.map((w) => (
                  <label key={w.value} className="weather-radio-label">
                    <input
                      type="radio"
                      name="weather"
                      value={w.value}
                      checked={form.weather === w.value}
                      onChange={handleChange}
                    />
                    <span className="weather-emoji">{w.icon}</span>
                    <span>{w.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row mb-4">
              <div className="form-group">
                <label className="form-label">Progresso (%) *</label>
                <input
                  type="number"
                  name="progressPct"
                  className="form-input"
                  placeholder="0 – 100"
                  min={0}
                  max={100}
                  step={0.1}
                  value={form.progressPct}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mão de Obra (pessoas)</label>
                <input
                  type="number"
                  name="workforce"
                  className="form-input"
                  placeholder="Ex: 12"
                  min={0}
                  value={form.workforce}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Descrição das Atividades *</label>
              <textarea
                name="description"
                className="form-textarea"
                placeholder="Descreva as atividades realizadas, ocorrências, observações..."
                value={form.description}
                onChange={handleChange}
                rows={4}
                required
                style={{ minHeight: 120 }}
              />
            </div>

            {error && (
              <div className="alert alert-danger mb-4">
                ⚠️ {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setIsOpen(false); setError(null) }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Salvar Registro
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
