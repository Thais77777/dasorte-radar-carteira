// Cores funcionais consistentes (seção 37) — nunca recalcula, só mapeia cor de exibição.

const PRIORIDADE_COLORS: Record<string, string> = {
  'Crítica': 'bg-red-100 text-red-700 border-red-200',
  'Alta': 'bg-orange-100 text-orange-700 border-orange-200',
  'Média': 'bg-amber-100 text-amber-700 border-amber-200',
  'Baixa': 'bg-sky-100 text-sky-700 border-sky-200',
  'Monitorar': 'bg-slate-100 text-slate-600 border-slate-200',
};

const RETENCAO_COLORS: Record<string, string> = {
  'Saudável': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Tendência': 'bg-amber-100 text-amber-700 border-amber-200',
  'Risco': 'bg-orange-100 text-orange-700 border-orange-200',
  'Churn': 'bg-red-100 text-red-700 border-red-200',
};

const VALOR_COLORS: Record<string, string> = {
  'Alto': 'bg-violet-100 text-violet-700 border-violet-200',
  'Médio': 'bg-blue-100 text-blue-700 border-blue-200',
  'Baixo': 'bg-slate-100 text-slate-600 border-slate-200',
};

const CONTACT_COLORS: Record<string, string> = {
  SEM_TELEFONE: 'bg-slate-100 text-slate-600 border-slate-200',
  NUNCA_CONTATADO: 'bg-slate-100 text-slate-600 border-slate-200',
  AGUARDANDO_RESPOSTA: 'bg-amber-100 text-amber-700 border-amber-200',
  SEM_RESPOSTA: 'bg-orange-100 text-orange-700 border-orange-200',
  CONTATO_REALIZADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CONTATO_RECUPERADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CONTATO_INVALIDO: 'bg-red-100 text-red-700 border-red-200',
  ESCALAR_CONTATO: 'bg-red-100 text-red-700 border-red-200',
};

const CONTACT_LABELS: Record<string, string> = {
  SEM_TELEFONE: 'Sem telefone',
  NUNCA_CONTATADO: 'Nunca contatado',
  AGUARDANDO_RESPOSTA: 'Aguardando resposta',
  SEM_RESPOSTA: 'Sem resposta',
  CONTATO_REALIZADO: 'Contato realizado',
  CONTATO_RECUPERADO: 'Contato recuperado',
  CONTATO_INVALIDO: 'Contato inválido',
  ESCALAR_CONTATO: 'Escalar contato',
};

export function prioridadeColor(value?: string | null) {
  return (value && PRIORIDADE_COLORS[value]) || 'bg-slate-100 text-slate-600 border-slate-200';
}
export function retencaoColor(value?: string | null) {
  return (value && RETENCAO_COLORS[value]) || 'bg-slate-100 text-slate-600 border-slate-200';
}
export function valorColor(value?: string | null) {
  return (value && VALOR_COLORS[value]) || 'bg-slate-100 text-slate-600 border-slate-200';
}
export function contactColor(value?: string | null) {
  return (value && CONTACT_COLORS[value]) || 'bg-slate-100 text-slate-600 border-slate-200';
}
export function contactLabel(value?: string | null) {
  return (value && CONTACT_LABELS[value]) || value || '—';
}

// Versões em hex para uso em gráficos (Recharts não aceita classes Tailwind)
export const PRIORIDADE_HEX: Record<string, string> = {
  'Crítica': '#dc2626',
  'Alta': '#ea580c',
  'Média': '#d97706',
  'Baixa': '#0284c7',
  'Monitorar': '#64748b',
};

export const RETENCAO_HEX: Record<string, string> = {
  'Saudável': '#059669',
  'Tendência': '#d97706',
  'Risco': '#ea580c',
  'Churn': '#dc2626',
};

export const VALOR_HEX: Record<string, string> = {
  'Alto': '#7c3aed',
  'Médio': '#2563eb',
  'Baixo': '#64748b',
};
