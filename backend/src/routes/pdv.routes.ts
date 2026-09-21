import { Router } from 'express';
import { z } from 'zod';
import { RoleName, TimelineEventType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { getPdvWhereScope, assertPdvVisible } from '../utils/scope';
import { buildPdvFilters, RANK_ORDERS } from '../services/pdvFilters';
import { getPagination, paginatedResponse } from '../utils/pagination';
import { serialize } from '../utils/serialize';
import { logTimelineEvent } from '../utils/timeline';

const router = Router();
router.use(requireAuth);

const RANKED_SORT_FIELDS = ['prioridade', 'statusRetencao', 'valor'] as const;

function rankIndex(order: string[], value: string | null | undefined): number {
  if (!value) return order.length;
  const idx = order.indexOf(value);
  return idx === -1 ? order.length : idx;
}

// GET /api/pdvs — fila de trabalho: filtros + busca + ordenação + paginação server-side
router.get('/', async (req, res) => {
  const scope = await getPdvWhereScope(req.user!);
  const filters = buildPdvFilters(req);
  const where = { AND: [scope, filters] };
  const pagination = getPagination(req, 25, 200);

  const sortBy = String(req.query.sortBy ?? 'prioridade');
  // padrão: ordem crescente de rank (Crítica/Churn/Alto primeiro); sortDir=desc inverte
  const sortDir = req.query.sortDir === 'desc' ? -1 : 1;

  const total = await prisma.pDV.count({ where });

  if ((RANKED_SORT_FIELDS as readonly string[]).includes(sortBy)) {
    // ordenação pela hierarquia de negócio já existente na base (não recalculada)
    const order = sortBy === 'prioridade' ? RANK_ORDERS.PRIORIDADE_ORDER : sortBy === 'statusRetencao' ? RANK_ORDERS.RETENCAO_ORDER : RANK_ORDERS.VALOR_ORDER;

    const rows = await prisma.pDV.findMany({
      where,
      select: { id: true, prioridade: true, statusRetencao: true, valor: true, diasSemTransacao: true },
    });
    rows.sort((a, b) => sortDir * (rankIndex(order, (a as any)[sortBy]) - rankIndex(order, (b as any)[sortBy])));
    const pageIds = rows.slice(pagination.skip, pagination.skip + pagination.take).map((r) => r.id);

    const records = await prisma.pDV.findMany({
      where: { id: { in: pageIds } },
      include: { contactability: true, assignments: { where: { ativo: true }, include: { responsavel: { select: { id: true, name: true } }, backup: { select: { id: true, name: true } } } } },
    });
    const byId = new Map(records.map((r) => [r.id, r]));
    const ordered = pageIds.map((id) => byId.get(id)).filter(Boolean);
    return res.json(paginatedResponse(serialize(ordered), total, pagination));
  }

  const orderByMap: Record<string, any> = {
    diasSemTransacao: { diasSemTransacao: sortDir === 1 ? 'asc' : 'desc' },
    selloutTotal: { selloutTotal: sortDir === 1 ? 'asc' : 'desc' },
    selloutMedioMensal: { selloutMedioMensal: sortDir === 1 ? 'asc' : 'desc' },
    nome: { nome: sortDir === 1 ? 'asc' : 'desc' },
    ultimaTransacao: { ultimaTransacao: sortDir === 1 ? 'asc' : 'desc' },
  };

  const records = await prisma.pDV.findMany({
    where,
    orderBy: orderByMap[sortBy] ?? { updatedAt: 'desc' },
    skip: pagination.skip,
    take: pagination.take,
    include: { contactability: true, assignments: { where: { ativo: true }, include: { responsavel: { select: { id: true, name: true } }, backup: { select: { id: true, name: true } } } } },
  });

  res.json(paginatedResponse(serialize(records), total, pagination));
});

// GET /api/pdvs/:id — perfil completo (seção 17)
router.get('/:id', async (req, res) => {
  const visible = await assertPdvVisible(req.user!, req.params.id);
  if (!visible) return res.status(403).json({ error: 'Você não tem acesso a este PDV.' });

  const pdv = await prisma.pDV.findUnique({
    where: { id: req.params.id },
    include: {
      contactability: true,
      assignments: {
        where: { ativo: true },
        include: { responsavel: { select: { id: true, name: true } }, backup: { select: { id: true, name: true } } },
      },
      tasks: { where: { status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } }, orderBy: { prazo: 'asc' }, take: 10, include: { responsavel: { select: { id: true, name: true } } } },
    },
  });
  if (!pdv) return res.status(404).json({ error: 'PDV não encontrado.' });
  res.json(serialize(pdv));
});

// PUT /api/pdvs/:id — correção de dados operacionais/cadastrais (nunca classificação estratégica)
router.put('/:id', async (req, res) => {
  const visible = await assertPdvVisible(req.user!, req.params.id);
  if (!visible) return res.status(403).json({ error: 'Você não tem acesso a este PDV.' });

  const schema = z.object({
    telefone: z.string().optional().nullable(),
    canal: z.string().optional().nullable(),
    modalidade: z.string().optional().nullable(),
    cidade: z.string().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const before = await prisma.pDV.findUnique({ where: { id: req.params.id } });
  const pdv = await prisma.pDV.update({ where: { id: req.params.id }, data: parsed.data });

  const changedFields = Object.keys(parsed.data).filter((k) => (before as any)?.[k] !== (parsed.data as any)[k]);
  if (changedFields.length > 0) {
    await logTimelineEvent({
      pdvId: pdv.id,
      usuarioId: req.user!.sub,
      tipo: TimelineEventType.ATUALIZACAO_CADASTRAL,
      descricao: `Dados cadastrais atualizados: ${changedFields.join(', ')}`,
      metadata: { changedFields },
    });
  }
  res.json(serialize(pdv));
});

// GET /api/pdvs/:id/timeline
router.get('/:id/timeline', async (req, res) => {
  const visible = await assertPdvVisible(req.user!, req.params.id);
  if (!visible) return res.status(403).json({ error: 'Você não tem acesso a este PDV.' });

  const pagination = getPagination(req, 30, 100);
  const where = { pdvId: req.params.id };
  const [data, total] = await Promise.all([
    prisma.timelineEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
      include: { usuario: { select: { id: true, name: true } } },
    }),
    prisma.timelineEvent.count({ where }),
  ]);
  res.json(paginatedResponse(serialize(data), total, pagination));
});

// POST /api/pdvs/:id/assign — atribuir/transferir responsável e backup (seção 22, 43)
router.post('/:id/assign', async (req, res) => {
  const requester = req.user!;
  if (requester.role !== RoleName.ADMIN && requester.role !== RoleName.GESTOR && requester.role !== RoleName.SUPERVISOR) {
    return res.status(403).json({ error: 'Você não tem permissão para atribuir carteira.' });
  }
  const visible = await assertPdvVisible(requester, req.params.id);
  if (!visible) return res.status(403).json({ error: 'Você não tem acesso a este PDV.' });

  const schema = z.object({ responsavelId: z.string().optional().nullable(), backupId: z.string().optional().nullable() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const current = await prisma.pDVAssignment.findFirst({ where: { pdvId: req.params.id, ativo: true }, include: { responsavel: true, backup: true } });

  await prisma.$transaction([
    prisma.pDVAssignment.updateMany({ where: { pdvId: req.params.id, ativo: true }, data: { ativo: false, fimVigencia: new Date() } }),
    prisma.pDVAssignment.create({
      data: {
        pdvId: req.params.id,
        responsavelId: parsed.data.responsavelId ?? null,
        backupId: parsed.data.backupId ?? null,
      },
    }),
  ]);

  const [newResp, newBackup] = await Promise.all([
    parsed.data.responsavelId ? prisma.user.findUnique({ where: { id: parsed.data.responsavelId } }) : null,
    parsed.data.backupId ? prisma.user.findUnique({ where: { id: parsed.data.backupId } }) : null,
  ]);

  await logTimelineEvent({
    pdvId: req.params.id,
    usuarioId: requester.sub,
    tipo: TimelineEventType.RESPONSAVEL_ALTERADO,
    descricao: `Responsável alterado de "${current?.responsavel?.name ?? 'ninguém'}" para "${newResp?.name ?? 'ninguém'}"${newBackup ? ` (backup: ${newBackup.name})` : ''}`,
    metadata: { from: current?.responsavelId ?? null, to: parsed.data.responsavelId ?? null },
  });

  res.json({ ok: true });
});

export default router;
