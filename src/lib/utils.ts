export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function daysUntil(date: Date | string): number {
  const target = new Date(date)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function daysSince(date: Date | string): number {
  const target = new Date(date)
  const now = new Date()
  const diff = now.getTime() - target.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getReajusteCountdown(baseDate: Date | string): {
  days: number
  percentage: number
  status: 'safe' | 'warning' | 'danger' | 'overdue'
  nextDate: Date
} {
  const base = new Date(baseDate)
  const now = new Date()

  // Próxima data de reajuste (12 meses a partir da data-base, repetindo anualmente)
  const nextDate = new Date(base)
  while (nextDate <= now) {
    nextDate.setFullYear(nextDate.getFullYear() + 1)
  }

  const days = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = 365
  const elapsed = totalDays - days
  const percentage = Math.min(100, Math.max(0, (elapsed / totalDays) * 100))

  let status: 'safe' | 'warning' | 'danger' | 'overdue'
  if (days < 0) status = 'overdue'
  else if (days <= 30) status = 'danger'
  else if (days <= 90) status = 'warning'
  else status = 'safe'

  return { days, percentage, status, nextDate }
}

export function getWeatherIcon(weather: string): string {
  const icons: Record<string, string> = {
    ENSOLARADO: '☀️',
    NUBLADO: '⛅',
    CHUVOSO: '🌧️',
    TEMPESTADE: '⛈️',
    PARCIALMENTE_NUBLADO: '🌤️',
  }
  return icons[weather] || '🌡️'
}

export function getWeatherLabel(weather: string): string {
  const labels: Record<string, string> = {
    ENSOLARADO: 'Ensolarado',
    NUBLADO: 'Nublado',
    CHUVOSO: 'Chuvoso',
    TEMPESTADE: 'Tempestade',
    PARCIALMENTE_NUBLADO: 'Parcialmente Nublado',
  }
  return labels[weather] || weather
}

export function getMeasurementStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    EM_ANALISE: 'Em Análise',
    APROVADO: 'Aprovado',
    FATURADO: 'Faturado',
    PAGO: 'Pago',
    ATRASADO: 'Atrasado',
  }
  return labels[status] || status
}

export function getTenderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    TRIAGEM: 'Em Triagem',
    APROVADO: 'Aprovado',
    RECUSADO: 'Recusado',
    IMPUGNADO: 'Impugnado',
  }
  return labels[status] || status
}

export function getContractScopeLabel(scope: string): string {
  const labels: Record<string, string> = {
    OBRA: 'Obra',
    SERVICO: 'Serviço',
    GERENCIAMENTO: 'Gerenciamento',
  }
  return labels[scope] || scope
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const TIPOS_SERVICO_OPTIONS = [
  { value: 'ASSESSORAMENTO_GERENCIAMENTO', label: 'Assessoramento e Gerenciamento' },
  { value: 'SUPERVISAO_FISCALIZACAO', label: 'Fiscalização e Supervisão de Obras' },
  { value: 'OBRAS_RODOVIARIAS', label: 'Obras de Infraestrutura Rodoviária' },
  { value: 'PAVIMENTACAO_INFRAESTRUTURA', label: 'Pavimentação e Execução de Infraestrutura' },
  { value: 'EXECUCAO_EDIFICACOES', label: 'Execução e Projetos de Edificações / Obras Civis' },
  { value: 'ELABORACAO_PROJETOS', label: 'Elaboração de Projetos e Contratação Integrada' },
  { value: 'SERVICOS_HIDRICOS', label: 'Serviços Hídricos e Saneamento Básico' },
];

export function getTipoServicoLabel(tipo: string | null | undefined): string {
  if (!tipo) return 'Serviço de Engenharia';
  const match = TIPOS_SERVICO_OPTIONS.find(o => o.value === tipo);
  if (match) return match.label;
  
  // Compatibilidade com valores legados
  const legacy: Record<string, string> = {
    'EXECUCAO_INFRAESTRUTURA': 'Pavimentação e Execução de Infraestrutura',
    'EXECUCAO': 'Execução de Obras Civis',
    'PROJETO_INFRAESTRUTURA': 'Projetos e Infraestrutura Rodoviária',
    'CONTRATACAO_INTEGRADA': 'Elaboração de Projetos e Contratação Integrada',
    'FISCALIZACAO': 'Fiscalização e Supervisão de Obras',
    'SUPERVISAO': 'Fiscalização e Supervisão de Obras',
    'ASSESSORAMENTO': 'Assessoramento e Gerenciamento',
    'GERENCIAMENTO': 'Assessoramento e Gerenciamento',
  };
  return legacy[tipo] || tipo.replace(/_/g, ' ');
}
