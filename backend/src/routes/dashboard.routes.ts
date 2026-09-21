import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { getPdvWhereScope } from '../utils/scope';
import { buildPdvFilters } from '../services/pdvFilters';
import { serialize } from '../utils/serialize';

const router = Router();
router.use(requireAuth);

async function groupCount(field: string, where: Prisma.PDVWhereInput) {
  const rows = await (prisma.pDV as any).groupBy({ by: [field], where, _count: { _all: true } });
  return rows
    .map((r: any) => ({ label: r[field] ?? 'Não informado', total: r._count._all }))
    .sort((a: any, b: any) => b.total - a.total);
}

async function groupSum(field: string, sumField: string, where: Prisma.PDVWhereInput) {
  const rows = await (prisma.pDV as any).groupBy({ by: [field], where, _sum: { [sumField]: true } });
  return rows
    .map((r: any) => ({ label: r[field] ?? 'Não informado', total: r._sum[sumField] ? Number(r._sum[sumField]) : 0 }))
    .sort((a: any, b: any) => b.total - a.total);
}

// GET /api/dashboard — cards executivos (seção 10)
router.get('/', async (req, res) => {
  const scope = await getPdvWhereScope(req.user!);
  const requesterScope = ['ADMIN', 'GESTOR'].includes(req.user!.role) ? {} : { responsavelId: req.user!.sub };
  const now = new Date();

  const [
    total,
    ativos,
    saudaveis,
    tendencia,
    risco,
    churn,
    critica,
    alta,
    selloutAgg,
    semContato,
    acoesPendentes,
    tarefasAtrasadas,
  ] = await Promise.all([
    prisma.pDV.count({ where: scope }),
    prisma.pDV.count({ where: { AND: [scope, { statusVendas: 'Ativo' }] } }),
    prisma.pDV.count({ where: { AND: [scope, { statusRetencao: 'Saudável' }] } }),
    prisma.pDV.count({ where: { AND: [scope, { statusRetencao: 'Tendência' }] } }),
    prisma.pDV.count({ where: { AND: [scope, { statusRetencao: 'Risco' }] } }),
    prisma.pDV.count({ where: { AND: [scope, { statusRetencao: 'Churn' }] } }),
    prisma.pDV.count({ where: { AND: [scope, { prioridade: 'Crítica' }] } }),
    prisma.pDV.count({ where: { AND: [scope, { prioridade: 'Alta' }] } }),
    prisma.pDV.aggregate({ where: scope, _sum: { selloutTotal: true, selloutMedioMensal: true } }),
    prisma.pDV.count({ where: { AND: [scope, { contactability: { status: { in: ['NUNCA_CONTATADO', 'SEM_TELEFONE'] } } }] } }),
    prisma.task.count({ where: { ...requesterScope, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } } }),
    prisma.task.count({ where: { ...requesterScope, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] }, prazo: { lt: now } } }),
  ]);

  res.json({
    totalPdvs: total,
    pdvsAtivos: ativos,
    pdvsSaudaveis: saudaveis,
    pdvsTendencia: tendencia,
    pdvsRisco: risco,
    pdvsChurn: churn,
    prioridadeCritica: critica,
    prioridadeAlta: alta,
    selloutTotal: selloutAgg._sum.selloutTotal ? Number(selloutAgg._sum.selloutTotal) : 0,
    selloutMedioMensal: selloutAgg._sum.selloutMedioMensal ? Number(selloutAgg._sum.selloutMedioMensal) : 0,
    pdvsSemContactabilidade: semContato,
    acoesPendentes,
    tarefasAtrasadas,
  });
});

// GET /api/dashboard/retention (seção 11)
router.get('/retention', async (req, res) => {
  const scope = await getPdvWhereScope(req.user!);
  const [porStatus, porPrioridade, porMaturidade, porValor, porSegmento, churnPorCidade, churnPorSupervisor, churnPorConsultor, selloutPorStatus] = await Promise.all([
    groupCount('statusRetencao', scope),
    groupCount('prioridade', scope),
    groupCount('maturidade', scope),
    groupCount('valor', scope),
    groupCount('segmento', scope),
    groupCount('cidade', { AND: [scope, { statusRetencao: 'Churn' }] }),
    groupCount('supervisorPlanilha', { AND: [scope, { statusRetencao: 'Churn' }] }),
    groupCount('consultorPlanilha', { AND: [scope, { statusRetencao: 'Churn' }] }),
    groupSum('statusRetencao', 'selloutTotal', scope),
  ]);
  res.json(serialize({ porStatus, porPrioridade, porMaturidade, porValor, porSegmento, churnPorCidade: churnPorCidade.slice(0, 15), churnPorSupervisor: churnPorSupervisor.slice(0, 15), churnPorConsultor: churnPorConsultor.slice(0, 15), selloutPorStatus }));
});

// GET /api/dashboard/sellout (seção 12) — aceita os mesmos filtros da fila de PDVs
router.get('/sellout', async (req, res) => {
  const baseScope = await getPdvWhereScope(req.user!);
  const filters = buildPdvFilters(req);
  const scope: Prisma.PDVWhereInput = { AND: [baseScope, filters] };
  const [agg, maiores, menores, porCidade, porSupervisor, porConsultor, porPrioridade, porStatus, porValor] = await Promise.all([
    prisma.pDV.aggregate({ where: scope, _sum: { selloutTotal: true, selloutMedioMensal: true }, _avg: { selloutMedioMensal: true } }),
    prisma.pDV.findMany({ where: scope, orderBy: { selloutTotal: 'desc' }, take: 10, select: { id: true, codigoPdv: true, nome: true, cidade: true, selloutTotal: true } }),
    prisma.pDV.findMany({ where: { AND: [scope, { selloutTotal: { not: null } }] }, orderBy: { selloutTotal: 'asc' }, take: 10, select: { id: true, codigoPdv: true, nome: true, cidade: true, selloutTotal: true } }),
    groupSum('cidade', 'selloutTotal', scope),
    groupSum('supervisorPlanilha', 'selloutTotal', scope),
    groupSum('consultorPlanilha', 'selloutTotal', scope),
    groupSum('prioridade', 'selloutTotal', scope),
    groupSum('statusRetencao', 'selloutTotal', scope),
    groupSum('valor', 'selloutTotal', scope),
  ]);
  res.json(
    serialize({
      selloutTotal: agg._sum.selloutTotal ? Number(agg._sum.selloutTotal) : 0,
      selloutMedioMensal: agg._sum.selloutMedioMensal ? Number(agg._sum.selloutMedioMensal) : 0,
      maiores,
      menores,
      porCidade: porCidade.slice(0, 15),
      porSupervisor: porSupervisor.slice(0, 15),
      porConsultor: porConsultor.slice(0, 15),
      porPrioridade,
      porStatus,
      porValor,
    })
  );
});

// GET /api/dashboard/contactability (seção 13)
router.get('/contactability', async (req, res) => {
  const scope = await getPdvWhereScope(req.user!);

  const [comTelefone, semTelefone, statusCounts, totalAcionados, totalRespondidos] = await Promise.all([
    prisma.pDV.count({ where: { AND: [scope, { telefone: { not: null } }, { NOT: { telefone: '' } }] } }),
    prisma.pDV.count({ where: { AND: [scope, { OR: [{ telefone: null }, { telefone: '' }] }] } }),
    (prisma.contactability as any).groupBy({ by: ['status'], where: { pdv: scope }, _count: { _all: true } }),
    prisma.contactAttempt.count({ where: { pdv: scope } }),
    prisma.contactAttempt.count({ where: { pdv: scope, resultado: { in: ['CONTATO_REALIZADO', 'CONTATO_RECUPERADO', 'RETORNO_SOLICITADO'] } } }),
  ]);

  const total = comTelefone + semTelefone;
  const statusMap: Record<string, number> = {};
  statusCounts.forEach((r: any) => (statusMap[r.status] = r._count._all));

  res.json({
    comTelefone,
    semTelefone,
    nuncaContatados: statusMap['NUNCA_CONTATADO'] ?? 0,
    aguardandoResposta: statusMap['AGUARDANDO_RESPOSTA'] ?? 0,
    semResposta: statusMap['SEM_RESPOSTA'] ?? 0,
    contatoRecuperado: statusMap['CONTATO_RECUPERADO'] ?? 0,
    contatoInvalido: statusMap['CONTATO_INVALIDO'] ?? 0,
    contatoRealizado: statusMap['CONTATO_REALIZADO'] ?? 0,
    escalarContato: statusMap['ESCALAR_CONTATO'] ?? 0,
    taxaContactabilidade: total > 0 ? comTelefone / total : 0,
    taxaResposta: totalAcionados > 0 ? totalRespondidos / totalAcionados : 0,
  });
});

export default router;
