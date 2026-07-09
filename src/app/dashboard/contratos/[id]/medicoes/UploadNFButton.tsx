'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2 } from 'lucide-react'

export default function UploadNFButton({ measurementId }: { measurementId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [nfNumber, setNfNumber] = useState('')
  const [dueAt, setDueAt] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/medicoes/${measurementId}/nf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfNumber, dueAt: dueAt || undefined }),
      })
      if (res.ok) {
        setShowModal(false)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Erro ao enviar NF')
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        className="btn btn-warning btn-sm"
        onClick={() => setShowModal(true)}
        title="Upload Nota Fiscal"
      >
        <Upload size={14} />
        Upload NF
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">📄 Enviar Nota Fiscal</h3>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setShowModal(false)}
                style={{ padding: '4px 8px', fontSize: '1.25rem' }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-4">
                <label className="form-label">Número da NF *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: 000123"
                  value={nfNumber}
                  onChange={(e) => setNfNumber(e.target.value)}
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Vencimento da NF</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-warning" disabled={loading}>
                  {loading ? (
                    <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                  ) : (
                    <Upload size={14} />
                  )}
                  Enviar NF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
