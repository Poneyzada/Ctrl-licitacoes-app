'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, FileText, Calendar, DollarSign, MapPin, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

const SCOPE_OPTIONS = [
  { value: 'OBRA',          label: 'Obra',          color: '#60a5fa' },
  { value: 'SERVICO',       label: 'Servico',        color: '#34d399' },
  { value: 'GERENCIAMENTO', label: 'Gerenciamento',  color: '#c084fc' },
]

function formatCurrencyInput(value: string): string {
  const nums = value.replace(/\D/g, '')
  if (!nums) return ''
  const number = parseInt(nums, 10) / 100
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseCurrencyToFloat(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
}

type FormData = {
  title:       string
  number:      string
  organ:       string
  scope:       string
  startDate:   string
  endDate:     string
  baseDate:    string
  totalValue:  string
  address:     string
  description: string
}

const INITIAL: FormData = {
  title: '', number: '', organ: '', scope: 'OBRA',
  startDate: '', endDate: '', baseDate: '', totalValue: '',
  address: '', description: '',
}

export default function NovoContratoPage() {
  const router = useRouter()
  const [form, setForm]       = useState<FormData>(INITIAL)
  const [errors, setErrors]   = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    if (name === 'totalValue') {
      setForm(prev => ({ ...prev, totalValue: formatCurrencyInput(value) }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.title.trim())    errs.title    = 'Titulo obrigatorio'
    if (!form.number.trim())   errs.number   = 'Numero obrigatorio'
    if (!form.organ.trim())    errs.organ    = 'Orgao obrigatorio'
    if (!form.startDate)       errs.startDate = 'Data de inicio obrigatoria'
    if (!form.baseDate)        errs.baseDate  = 'Data-base obrigatoria'
    if (!form.totalValue)      errs.totalValue = 'Valor obrigatorio'
    if (form.endDate && form.startDate && form.endDate < form.startDate)
      errs.endDate = 'Termino deve ser apos inicio'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)
    if (!validate()) return
    setLoading(true)
    try {
      const body = {
        title:      form.title.trim(),
        number:     form.number.trim(),
        organ:      form.organ.trim(),
        scope:      form.scope,
        startDate:  form.startDate,
        endDate:    form.endDate || undefined,
        baseDate:   form.baseDate,
        totalValue: parseCurrencyToFloat(form.totalValue),
        address:    form.address.trim() || undefined,
        description:form.description.trim() || undefined,
      }
      const res = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error || 'Erro ao criar contrato')
        return
      }
      router.push(`/dashboard/contratos/${data.id}`)
    } catch {
      setApiError('Erro de conexao. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const selectedScope = SCOPE_OPTIONS.find(s => s.value === form.scope)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <Link href="/dashboard/contratos" className="btn btn-ghost btn-sm btn-icon">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Novo Contrato</h1>
          <p className="page-subtitle">Preencha os dados do contrato</p>
        </div>
      </div>

      {/* Error banner */}
      {apiError && (
        <div className="alert alert-danger mb-6" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-layout">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Basic info card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <FileText size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Identificacao
                </h3>
              </div>

              <div className="form-group">
                <label className="form-label">Titulo do Contrato *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className={`form-input ${errors.title ? 'input-error' : ''}`}
                  placeholder="Ex: Construcao de Escola Municipal"
                  disabled={loading}
                />
                {errors.title && <span className="field-error">{errors.title}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Numero do Contrato *</label>
                  <input
                    type="text"
                    name="number"
                    value={form.number}
                    onChange={handleChange}
                    className={`form-input ${errors.number ? 'input-error' : ''}`}
                    placeholder="Ex: 001/2025"
                    disabled={loading}
                  />
                  {errors.number && <span className="field-error">{errors.number}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Escopo *</label>
                  <select
                    name="scope"
                    value={form.scope}
                    onChange={handleChange}
                    className="form-select"
                    disabled={loading}
                  >
                    {SCOPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedScope?.color }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedScope?.label}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Building2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Orgao Contratante *
                </label>
                <input
                  type="text"
                  name="organ"
                  value={form.organ}
                  onChange={handleChange}
                  className={`form-input ${errors.organ ? 'input-error' : ''}`}
                  placeholder="Ex: Prefeitura Municipal de Sao Paulo"
                  disabled={loading}
                />
                {errors.organ && <span className="field-error">{errors.organ}</span>}
              </div>
            </div>

            {/* Dates card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Calendar size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Datas
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Data de Inicio *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className={`form-input ${errors.startDate ? 'input-error' : ''}`}
                    disabled={loading}
                  />
                  {errors.startDate && <span className="field-error">{errors.startDate}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Termino Previsto</label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    className={`form-input ${errors.endDate ? 'input-error' : ''}`}
                    disabled={loading}
                  />
                  {errors.endDate && <span className="field-error">{errors.endDate}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Data-Base para Reajuste *</label>
                <input
                  type="date"
                  name="baseDate"
                  value={form.baseDate}
                  onChange={handleChange}
                  className={`form-input ${errors.baseDate ? 'input-error' : ''}`}
                  disabled={loading}
                />
                {errors.baseDate && <span className="field-error">{errors.baseDate}</span>}
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Usada para calcular o prazo de reajuste anual do contrato.
                </p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Financial */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <DollarSign size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Financeiro
                </h3>
              </div>

              <div className="form-group">
                <label className="form-label">Valor Total do Contrato *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, pointerEvents: 'none'
                  }}>R$</span>
                  <input
                    type="text"
                    name="totalValue"
                    value={form.totalValue}
                    onChange={handleChange}
                    className={`form-input ${errors.totalValue ? 'input-error' : ''}`}
                    placeholder="0,00"
                    style={{ paddingLeft: 36 }}
                    inputMode="numeric"
                    disabled={loading}
                  />
                </div>
                {errors.totalValue && <span className="field-error">{errors.totalValue}</span>}
              </div>

              {form.totalValue && (
                <div className="alert alert-info" style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                  Valor: <strong>R$ {form.totalValue}</strong>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <MapPin size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Localizacao e Descricao
                </h3>
              </div>

              <div className="form-group">
                <label className="form-label">Endereco da Obra/Servico</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ex: Rua das Flores, 123 - Centro, SP"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descricao</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Descreva o escopo e objeto do contrato..."
                  rows={5}
                  style={{ resize: 'vertical', minHeight: 100 }}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/dashboard/contratos" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                Cancelar
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 2, justifyContent: 'center', gap: 8 }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Criando...
                  </>
                ) : (
                  'Criar Contrato'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      <style>{`
        .form-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .form-layout { grid-template-columns: 1fr; }
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group:last-child {
          margin-bottom: 0;
        }
        .form-textarea {
          width: 100%;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: inherit;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .form-textarea:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .input-error {
          border-color: var(--color-danger) !important;
        }
        .field-error {
          display: block;
          font-size: 0.72rem;
          color: var(--color-danger);
          margin-top: 4px;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}