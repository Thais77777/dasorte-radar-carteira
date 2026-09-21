import { Request } from 'express';
import { Prisma } from '@prisma/client';

const STRING_FILTERS: Array<keyof Prisma.PDVWhereInput> = [
  'cidade',
  'canal',
  'modalidade',
  'statusVendas',
  'adimplencia',
  'maturidade',
  'statusRetencao',
  'valor',
  'prioridade',
  'segmento',
];

/** Monta o where do Prisma a partir dos query params de filtro (seção 31). */
export function buildPdvFilters(req: Request): Prisma.PDVWhereInput {
  const q = req.query;
  const AND: Prisma.PDVWhereInput[] = [];

  for (const field of STRING_FILTERS) {
    const value = q[field as string];
    if (value && typeof value === 'string') {
      const values = value.split(',').filter(Boolean);
      if (values.length > 0) {
        AND.push({ [field]: { in: values } } as Prisma.PDVWhereInput);
      }
    }
  }

  if (q.codigoPdv && typeof q.codigoPdv === 'string') {
    AND.push({ codigoPdv: { contains: q.codigoPdv, mode: 'insensitive' } });
  }
  if (q.nome && typeof q.nome === 'string') {
    AND.push({ nome: { contains: q.nome, mode: 'insensitive' } });
  }
  if (q.supervisor && typeof q.supervisor === 'string') {
    AND.push({ supervisorPlanilha: { contains: q.supervisor, mode: 'insensitive' } });
  }
  if (q.consultor && typeof q.consultor === 'string') {
    AND.push({ consultorPlanilha: { contains: q.consultor, mode: 'insensitive' } });
  }

  if (q.responsavelId && typeof q.responsavelId === 'string') {
    AND.push({ assignments: { some: { ativo: true, responsavelId: q.responsavelId } } });
  }

  if (q.contactabilidade && typeof q.contactabilidade === 'string') {
    const values = q.contactabilidade.split(',').filter(Boolean);
    AND.push({ contactability: { status: { in: values as any } } });
  }
  if (q.semTelefone === 'true') {
    AND.push({ OR: [{ telefone: null }, { telefone: '' }] });
  }

  if (q.dataAtivacaoInicio && typeof q.dataAtivacaoInicio === 'string') {
    AND.push({ dataAtivacao: { gte: new Date(q.dataAtivacaoInicio) } });
  }
  if (q.dataAtivacaoFim && typeof q.dataAtivacaoFim === 'string') {
    AND.push({ dataAtivacao: { lte: new Date(q.dataAtivacaoFim) } });
  }

  if (q.tarefaAtrasada === 'true') {
    AND.push({ tasks: { some: { status: { in: ['PENDENTE', 'EM_ANDAMENTO'] }, prazo: { lt: new Date() } } } });
  }
  if (q.acaoPendente === 'true') {
    AND.push({ contactability: { proximaAcao: { not: null } } });
  }

  const search = q.search ?? q.q;
  if (search && typeof search === 'string' && search.trim().length > 0) {
    const term = search.trim();
    AND.push({
      OR: [
        { codigoPdv: { contains: term, mode: 'insensitive' } },
        { nome: { contains: term, mode: 'insensitive' } },
        { cidade: { contains: term, mode: 'insensitive' } },
        { telefone: { contains: term, mode: 'insensitive' } },
        { supervisorPlanilha: { contains: term, mode: 'insensitive' } },
        { consultorPlanilha: { contains: term, mode: 'insensitive' } },
      ],
    });
  }

  return AND.length > 0 ? { AND } : {};
}

const PRIORIDADE_ORDER = ['Crítica', 'Alta', 'Média', 'Baixa', 'Monitorar'];
const RETENCAO_ORDER = ['Churn', 'Risco', 'Tendência', 'Saudável'];
const VALOR_ORDER = ['Alto', 'Médio', 'Baixo'];

/** Ordenação operacional da fila (seção 16) — usa os campos já importados. */
export function buildPdvOrderBy(req: Request): Prisma.PDVOrderByWithRelationInput[] {
  const sortBy = String(req.query.sortBy ?? 'prioridade');
  const direction = req.query.sortDir === 'asc' ? 'asc' : 'desc';

  switch (sortBy) {
    case 'diasSemTransacao':
      return [{ diasSemTransacao: direction }];
    case 'selloutTotal':
      return [{ selloutTotal: direction }];
    case 'selloutMedioMensal':
      return [{ selloutMedioMensal: direction }];
    case 'nome':
      return [{ nome: direction }];
    case 'ultimaTransacao':
      return [{ ultimaTransacao: direction }];
    case 'prioridade':
    case 'statusRetencao':
    case 'valor':
    default:
      // ordenação textual simples; refinamento por prioridade/status/valor
      // é feito em memória no client de fila quando necessário
      return [{ prioridade: 'asc' }, { statusRetencao: 'asc' }];
  }
}

export const RANK_ORDERS = { PRIORIDADE_ORDER, RETENCAO_ORDER, VALOR_ORDER };
