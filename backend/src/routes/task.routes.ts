import { Router } from 'express';
import { z } from 'zod';
import { RoleName, TaskStatus, TaskTipo, TimelineEventType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { assertPdvVisible } from '../utils/scope';
import { logTimelineEvent } from '../utils/timeline';
import { serialize } from '../utils/serialize';
import { getPagination, paginatedResponse } from '../utils/pagination';

const router = Router();
router.use(requireAuth);

function startEndOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// GET /api/tasks — Minhas Ações / Tarefas (seção 15, 21)
router.get('/', async (req, res) => {
  const requester = req.user!;
  const pagination = getPagination(req, 25, 200);

  const where: any = {};

  // por padrão cada usuário vê as próprias tarefas; gestores/admin/supervisor podem filtrar por responsavelId
  const managementRoles: RoleName[] = [RoleName.ADMIN, RoleName.GESTOR, RoleName.SUPERVISOR];
  const topRoles: RoleName[] = [RoleName.ADMIN, RoleName.GESTOR];
  if (req.query.responsavelId && managementRoles.includes(requester.role)) {
    where.responsavelId = req.query.responsavelId;
  } else if (!topRoles.includes(requester.role)) {
    where.responsavelId = requester.sub;
  }

  if (req.query.status && typeof req.query.status === 'string') {
    where.status = { in: req.query.status.split(',') };
  }

  const filtro = req.query.filtro as string | undefined;
  const { start, end } = startEndOfToday();
  if (filtro === 'hoje') {
    where.prazo = { gte: start, lte: end };
    where.status = { in: ['PENDENTE', 'EM_ANDAMENTO'] };
  } else if (filtro === 'atrasadas') {
    where.prazo = { lt: start };
    where.status = { in: ['PENDENTE', 'EM_ANDAMENTO'] };
  } else if (filtro === 'proximas') {
    where.prazo = { gt: end };
    where.status = { in: ['PENDENTE', 'EM_ANDAMENTO'] };
  } else if (filtro === 'concluidas') {
    where.status = 'CONCLUIDA';
  }

  const [data, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ prazo: 'asc' }],
      skip: pagination.skip,
      take: pagination.take,
      include: {
        pdv: { select: { id: true, codigoPdv: true, nome: true, cidade: true, prioridade: true, statusRetencao: true, telefone: true } },
        responsavel: { select: { id: true, name: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);
  res.json(paginatedResponse(serialize(data), total, pagination));
});

// GET /api/tasks/summary — contadores para cards
router.get('/summary', async (req, res) => {
  const requester = req.user!;
  const topRoles: RoleName[] = [RoleName.ADMIN, RoleName.GESTOR];
  const scopeWhere: any = topRoles.includes(requester.role) ? {} : { responsavelId: requester.sub };
  const { start, end } = startEndOfToday();

  const [hoje, atrasadas, proximas, concluidas] = await Promise.all([
    prisma.task.count({ where: { ...scopeWhere, prazo: { gte: start, lte: end }, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } } }),
    prisma.task.count({ where: { ...scopeWhere, prazo: { lt: start }, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } } }),
    prisma.task.count({ where: { ...scopeWhere, prazo: { gt: end }, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } } }),
    prisma.task.count({ where: { ...scopeWhere, status: 'CONCLUIDA' } }),
  ]);
  res.json({ hoje, atrasadas, proximas, concluidas });
});

// POST /api/tasks — criar tarefa manualmente (seção 21)
router.post('/', async (req, res) => {
  const schema = z.object({
    pdvId: z.string(),
    responsavelId: z.string().optional(),
    titulo: z.string().min(1),
    descricao: z.string().optional().nullable(),
    tipo: z.nativeEnum(TaskTipo).optional(),
    prioridadeOperacional: z.string().optional().nullable(),
    prazo: z.string().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const visible = await assertPdvVisible(req.user!, parsed.data.pdvId);
  if (!visible) return res.status(403).json({ error: 'Você não tem acesso a este PDV.' });

  const task = await prisma.task.create({
    data: {
      pdvId: parsed.data.pdvId,
      responsavelId: parsed.data.responsavelId ?? req.user!.sub,
      criadoPorId: req.user!.sub,
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao,
      tipo: parsed.data.tipo ?? 'OUTRO',
      prioridadeOperacional: parsed.data.prioridadeOperacional,
      prazo: parsed.data.prazo ? new Date(parsed.data.prazo) : null,
    },
  });

  await logTimelineEvent({ pdvId: task.pdvId, usuarioId: req.user!.sub, tipo: TimelineEventType.TAREFA_CRIADA, descricao: `Tarefa criada: ${task.titulo}`, metadata: { taskId: task.id } });
  res.status(201).json(serialize(task));
});

// PUT /api/tasks/:id — atualizar status/concluir
router.put('/:id', async (req, res) => {
  const schema = z.object({
    status: z.nativeEnum(TaskStatus).optional(),
    titulo: z.string().optional(),
    descricao: z.string().optional().nullable(),
    prazo: z.string().optional().nullable(),
    responsavelId: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Tarefa não encontrada.' });
  const visible = await assertPdvVisible(req.user!, existing.pdvId);
  if (!visible) return res.status(403).json({ error: 'Você não tem acesso a este PDV.' });

  const data: any = { ...parsed.data };
  if (parsed.data.prazo) data.prazo = new Date(parsed.data.prazo);
  if (parsed.data.status === 'CONCLUIDA') data.completedAt = new Date();

  const task = await prisma.task.update({ where: { id: req.params.id }, data });

  if (parsed.data.status === 'CONCLUIDA') {
    await logTimelineEvent({ pdvId: task.pdvId, usuarioId: req.user!.sub, tipo: TimelineEventType.TAREFA_CONCLUIDA, descricao: `Tarefa concluída: ${task.titulo}`, metadata: { taskId: task.id } });
  } else if (parsed.data.status === 'CANCELADA') {
    await logTimelineEvent({ pdvId: task.pdvId, usuarioId: req.user!.sub, tipo: TimelineEventType.TAREFA_CANCELADA, descricao: `Tarefa cancelada: ${task.titulo}`, metadata: { taskId: task.id } });
  }

  res.json(serialize(task));
});

export default router;
