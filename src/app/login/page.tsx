'use client'

import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, FileText, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou senha inválidos. Verifique suas credenciais.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  const fillDemo = (role: string) => {
    const demos: Record<string, { email: string; password: string }> = {
      diretoria: { email: 'diretoria@ctrl.com', password: '123456' },
      coordenador: { email: 'coordenador@ctrl.com', password: '123456' },
      campo: { email: 'campo@ctrl.com', password: '123456' },
      adm: { email: 'adm@ctrl.com', password: '123456' },
    }
    setEmail(demos[role].email)
    setPassword(demos[role].password)
    setError('')
  }

  return (
    <div className="login-page">
      {/* Background animado */}
      <div className="login-bg">
        <div className="login-bg-orb orb-1" />
        <div className="login-bg-orb orb-2" />
        <div className="login-bg-orb orb-3" />
      </div>

      {/* Grid de fundo */}
      <div className="login-grid" />

      <div className="login-container">
        {/* Logo e título */}
        <div className="login-brand">
          <div className="login-logo">
            <FileText size={28} color="#fff" />
          </div>
          <div>
            <h1 className="login-title">Ctrl-Licitação</h1>
            <p className="login-subtitle">Gestão de Contratos Públicos</p>
          </div>
        </div>

        {/* Card de login */}
        <div className="login-card">
          <div className="login-card-header">
            <h2>Bem-vindo de volta</h2>
            <p>Acesse sua conta para continuar</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div className="input-icon-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="form-input with-icon"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <div className="input-icon-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input with-icon with-icon-right"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon-right-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="loader" style={{ width: 16, height: 16 }} />
                  Entrando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          {/* Acesso rápido de demonstração */}
          <div className="login-demo">
            <div className="login-demo-label">
              <span>Acesso rápido (demonstração)</span>
            </div>
            <div className="login-demo-grid">
              <button className="demo-btn demo-diretoria" onClick={() => fillDemo('diretoria')}>
                <span className="demo-dot" />
                Diretoria
              </button>
              <button className="demo-btn demo-coordenador" onClick={() => fillDemo('coordenador')}>
                <span className="demo-dot" />
                Coordenador
              </button>
              <button className="demo-btn demo-campo" onClick={() => fillDemo('campo')}>
                <span className="demo-dot" />
                Op. Campo
              </button>
              <button className="demo-btn demo-adm" onClick={() => fillDemo('adm')}>
                <span className="demo-dot" />
                Op. Adm
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="login-footer">
          Lei 14.133/2021 · Nova Lei de Licitações e Contratos
        </p>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: #080f1f;
        }

        .login-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.12;
          animation: orbFloat 8s ease-in-out infinite alternate;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: #3b82f6;
          top: -150px;
          left: -150px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: #6366f1;
          bottom: -100px;
          right: -100px;
          animation-delay: -3s;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: #10b981;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -6s;
        }

        @keyframes orbFloat {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(20px, -20px); }
        }

        .login-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
        }

        .login-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: slideUp 0.4s ease;
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .login-logo {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.02em;
          margin-bottom: 0;
        }

        .login-subtitle {
          font-size: 0.8125rem;
          color: #64748b;
        }

        .login-card {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
        }

        .login-card::before {
          content: '';
          display: block;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          margin: -32px -32px 32px;
          border-radius: 20px 20px 0 0;
        }

        .login-card-header {
          margin-bottom: 28px;
        }

        .login-card-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 4px;
        }

        .login-card-header p {
          font-size: 0.875rem;
          color: #64748b;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .input-icon-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }

        .form-input.with-icon {
          padding-left: 38px;
        }

        .form-input.with-icon-right {
          padding-right: 38px;
        }

        .input-icon-right-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s ease;
        }

        .input-icon-right-btn:hover { color: #94a3b8; }

        .login-demo {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .login-demo-label {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .login-demo-label span {
          font-size: 0.75rem;
          color: #475569;
          white-space: nowrap;
          font-weight: 500;
        }

        .login-demo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .demo-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: #94a3b8;
          transition: all 0.15s ease;
          text-align: left;
        }

        .demo-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
          transform: translateY(-1px);
        }

        .demo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .demo-diretoria .demo-dot { background: #3b82f6; }
        .demo-coordenador .demo-dot { background: #6366f1; }
        .demo-campo .demo-dot { background: #10b981; }
        .demo-adm .demo-dot { background: #f59e0b; }

        .login-footer {
          text-align: center;
          font-size: 0.75rem;
          color: #334155;
        }
      `}</style>
    </div>
  )
}
