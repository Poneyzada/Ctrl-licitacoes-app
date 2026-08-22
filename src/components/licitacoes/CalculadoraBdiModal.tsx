'use client';

import React, { useState } from 'react';
import { Calculator, X, DollarSign, AlertTriangle, CheckCircle2, Percent, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function CalculadoraBdiModal({ 
  valorEstimadoEdital, 
  onClose 
}: { 
  valorEstimadoEdital?: number; 
  onClose: () => void 
}) {
  const [valorEdital, setValorEdital] = useState<number>(valorEstimadoEdital || 1000000);
  const [custoDireto, setCustoDireto] = useState<number>((valorEstimadoEdital || 1000000) * 0.78);
  
  // Parâmetros do BDI (% Acórdão 2622/2013 - TCU)
  const [ac, setAc] = useState<number>(4.0); // Administração Central
  const [sg, setSg] = useState<number>(0.8); // Seguros e Garantias
  const [r, setR] = useState<number>(1.0);  // Risco
  const [df, setDf] = useState<number>(1.2); // Despesas Financeiras
  const [lucro, setLucro] = useState<number>(7.5); // Lucro Bruto
  const [tributos, setTributos] = useState<number>(8.65); // PIS + COFINS + ISS

  // Cálculo da fórmula do TCU:
  // BDI = [((1 + (AC + S + R + G)) * (1 + DF) * (1 + L)) / (1 - I)] - 1
  const calcBdi = () => {
    const acDecimal = ac / 100;
    const sgDecimal = sg / 100;
    const rDecimal = r / 100;
    const dfDecimal = df / 100;
    const lDecimal = lucro / 100;
    const iDecimal = tributos / 100;

    const num = (1 + acDecimal + sgDecimal + rDecimal) * (1 + dfDecimal) * (1 + lDecimal);
    const den = 1 - iDecimal;
    if (den <= 0) return 0;
    return ((num / den) - 1) * 100;
  };

  const bdiPercent = calcBdi();
  const precoFinalCalculado = custoDireto * (1 + bdiPercent / 100);
  
  // Trava de Inexequibilidade da Lei 14.133 (Art. 59, § 4º - 75% do valor orçado)
  const limiteInexequibilidade = valorEdital * 0.75;
  const isInexequivel = precoFinalCalculado < limiteInexequibilidade;
  const descontoPercentual = valorEdital > 0 ? ((valorEdital - precoFinalCalculado) / valorEdital) * 100 : 0;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="card"
        style={{
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color-strong)',
          borderRadius: 'var(--radius-xl)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Calculator size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Calculadora de BDI & Trava de Inexequibilidade</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fórmula oficial do Acórdão TCU 2.622/2013 e Art. 59 da Lei 14.133/2021</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Radar de Inexequibilidade - Alert Banner */}
        <div style={{
          background: isInexequivel ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.12)',
          border: `1px solid ${isInexequivel ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.3)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: isInexequivel ? '#f87171' : '#34d399', textTransform: 'uppercase' }}>
              {isInexequivel ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              {isInexequivel ? 'Alerta de Proposta Inexequível (Risco de Desclassificação)' : 'Proposta em Faixa Segura de Exequibilidade'}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: '2px' }}>
              Piso Legal (75% da Estimativa): <strong>{formatCurrency(limiteInexequibilidade)}</strong> • Desconto Ofertado: <strong>{descontoPercentual.toFixed(2)}%</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Preço Final da Proposta</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: isInexequivel ? '#f87171' : '#60a5fa' }}>
              {formatCurrency(precoFinalCalculado)}
            </div>
          </div>
        </div>

        {/* Inputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '22px' }}>
          <div className="form-group">
            <label className="form-label">Valor Estimado do Edital (R$)</label>
            <input 
              type="number" 
              value={valorEdital} 
              onChange={(e) => setValorEdital(Number(e.target.value))}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Custo Direto Orçado (R$)</label>
            <input 
              type="number" 
              value={custoDireto} 
              onChange={(e) => setCustoDireto(Number(e.target.value))}
              className="form-control"
            />
          </div>
        </div>

        {/* Composições do BDI */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
          Composição Paramétrica do BDI (Taxas em %)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          <div className="form-group">
            <label className="form-label" title="Administração Central">Adm. Central (%)</label>
            <input type="number" step="0.1" value={ac} onChange={(e) => setAc(Number(e.target.value))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label" title="Seguro e Garantia">Seguro/Garantia (%)</label>
            <input type="number" step="0.1" value={sg} onChange={(e) => setSg(Number(e.target.value))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label" title="Margem de Risco">Risco (%)</label>
            <input type="number" step="0.1" value={r} onChange={(e) => setR(Number(e.target.value))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label" title="Despesas Financeiras">Desp. Financeira (%)</label>
            <input type="number" step="0.1" value={df} onChange={(e) => setDf(Number(e.target.value))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label" title="Margem de Lucro Bruto">Lucro Bruto (%)</label>
            <input type="number" step="0.1" value={lucro} onChange={(e) => setLucro(Number(e.target.value))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label" title="Tributos PIS, COFINS, ISS">Tributos (%)</label>
            <input type="number" step="0.1" value={tributos} onChange={(e) => setTributos(Number(e.target.value))} className="form-control" />
          </div>
        </div>

        {/* Total BDI Calculated Box */}
        <div style={{ 
          background: 'var(--bg-elevated)', 
          padding: '16px 20px', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Taxa BDI Efetiva Aplicada
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary)' }}>
              {bdiPercent.toFixed(2)}%
            </div>
          </div>

          <button onClick={onClose} className="btn btn-primary">
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
