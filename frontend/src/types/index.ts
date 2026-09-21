export type RoleName = 'ADMIN' | 'GESTOR' | 'SUPERVISOR' | 'CS' | 'ANALISTA_DADOS' | 'ANALISTA_FINANCEIRO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  supervisorId?: string | null;
}

export interface Contactability {
  id: string;
  pdvId: string;
  status: string;
  ultimoContato: string | null;
  numeroTentativas: number;
  ultimoCanal: string | null;
  ultimoResultado: string | null;
  proximaAcao: string | null;
  proximaAcaoData: string | null;
}

export interface Assignment {
  id: string;
  responsavel: { id: string; name: string } | null;
  backup: { id: string; name: string } | null;
}

export interface PDV {
  id: string;
  codigoPdv: string;
  nome: string;
  cidade: string | null;
  telefone: string | null;
  canal: string | null;
  modalidade: string | null;
  supervisorPlanilha: string | null;
  consultorPlanilha: string | null;
  statusVendas: string | null;
  adimplencia: string | null;
  maturidade: string | null;
  statusRetencao: string | null;
  valor: string | null;
  prioridade: string | null;
  segmento: string | null;
  ultimaTransacao: string | null;
  diasSemTransacao: number | null;
  dataUltimaVendaRaspadinha: string | null;
  valorUltimaVendaRaspadinha: number | null;
  dataUltimaCompraRaspadinha: string | null;
  valorUltimaCompraRaspadinha: number | null;
  dataUltimaVendaTrem: string | null;
  valorUltimaVendaTrem: number | null;
  estoque: number | null;
  totalPacotesRaspadinha: number | null;
  totalVendasRaspadinha: number | null;
  selloutTotal: number | null;
  selloutMedioMensal: number | null;
  dataAtivacao: string | null;
  mesesDeBase: number | null;
  diasComMovimento: number | null;
  contactability?: Contactability | null;
  assignments?: Assignment[];
  tasks?: Task[];
}

export interface Task {
  id: string;
  pdvId: string;
  titulo: string;
  descricao?: string | null;
  tipo: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  prazo: string | null;
  completedAt: string | null;
  responsavel?: { id: string; name: string };
  pdv?: { id: string; codigoPdv: string; nome: string; cidade: string | null; prioridade: string | null; statusRetencao: string | null; telefone: string | null };
}

export interface TimelineEvent {
  id: string;
  pdvId: string;
  tipo: string;
  descricao: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  usuario?: { id: string; name: string } | null;
}

export interface ContactAttempt {
  id: string;
  pdvId: string;
  canal: string;
  resultado: string;
  observacao: string | null;
  proximaAcao: string | null;
  proximaAcaoData: string | null;
  createdAt: string;
  usuario?: { id: string; name: string };
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ImportBatch {
  id: string;
  arquivo: string;
  totalLinhas: number;
  novosRegistros: number;
  atualizados: number;
  duplicados: number;
  invalidos: number;
  createdAt: string;
  usuario: { id: string; name: string };
  erros?: Array<{ linha: number; erro: string }>;
}
