import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { RoleName } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { isManagement } from '../utils/scope';

const router = Router();

router.use(requireAuth);

// GET /api/users — lista de usuários (para atribuição de carteira, filtros etc.)
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true, role: true, supervisorId: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
});

router.post('/', requireRole(RoleName.ADMIN), async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(RoleName),
    supervisorId: z.string().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: parsed.data.role,
      supervisorId: parsed.data.supervisorId ?? null,
    },
    select: { id: true, name: true, email: true, role: true, supervisorId: true },
  });
  res.status(201).json(user);
});

router.put('/:id', requireRole(RoleName.ADMIN), async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    role: z.nativeEnum(RoleName).optional(),
    supervisorId: z.string().optional().nullable(),
    active: z.boolean().optional(),
    password: z.string().min(6).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const data: any = { ...parsed.data };
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    delete data.password;
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, name: true, email: true, role: true, supervisorId: true, active: true },
  });
  res.json(user);
});

// GET /api/team — visão do supervisor/gestor: equipe + indicadores por CS
router.get('/overview', requireRole(RoleName.ADMIN, RoleName.GESTOR, RoleName.SUPERVISOR), async (req, res) => {
  const requester = req.user!;

  const teamWhere = requester.role === RoleName.SUPERVISOR ? { supervisorId: requester.sub } : {};
  const team = await prisma.user.findMany({
    where: { role: RoleName.CS, active: true, ...teamWhere },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  const results = await Promise.all(
    team.map(async (member) => {
      const assignmentFilter = {
        assignments: { some: { ativo: true, responsavelId: member.id } },
      };
      const [total, criticos, alta, risco, churn, semContato, tarefasAtrasadas, selloutAgg] = await Promise.all([
        prisma.pDV.count({ where: assignmentFilter }),
        prisma.pDV.count({ where: { ...assignmentFilter, prioridade: 'Crítica' } }),
        prisma.pDV.count({ where: { ...assignmentFilter, prioridade: 'Alta' } }),
        prisma.pDV.count({ where: { ...assignmentFilter, statusRetencao: 'Risco' } }),
        prisma.pDV.count({ where: { ...assignmentFilter, statusRetencao: 'Churn' } }),
        prisma.pDV.count({
          where: { ...assignmentFilter, contactability: { status: { in: ['NUNCA_CONTATADO', 'SEM_TELEFONE'] } } },
        }),
        prisma.task.count({ where: { responsavelId: member.id, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] }, prazo: { lt: new Date() } } }),
        prisma.pDV.aggregate({ where: assignmentFilter, _sum: { selloutTotal: true } }),
      ]);
      return {
        ...member,
        totalPdvs: total,
        criticos,
        alta,
        risco,
        churn,
        semContato,
        tarefasAtrasadas,
        selloutTotal: selloutAgg._sum.selloutTotal ? Number(selloutAgg._sum.selloutTotal) : 0,
      };
    })
  );

  res.json(results);
});

export default router;
