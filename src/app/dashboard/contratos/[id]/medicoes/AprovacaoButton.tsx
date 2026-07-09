'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function AprovacaoButton({ measurementId }: { measurementId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAprovar = async () => {
    if (!confirm('Confirmar aprovação desta medição?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/medicoes/${measurementId}/aprovar`, {
        method: 'POST',
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Erro ao aprovar medição')
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="btn btn-success btn-sm"
      onClick={handleAprovar}
      disabled={loading}
      title="Aprovar Medição"
    >
      {loading ? (
        <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
      ) : (
        <CheckCircle size={14} />
      )}
      Aprovar
    </button>
  )
}
