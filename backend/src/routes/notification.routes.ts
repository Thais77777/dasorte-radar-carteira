import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { getPagination, paginatedResponse } from '../utils/pagination';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const pagination = getPagination(req, 20);
  const where = { usuarioId: req.user!.sub };
  const [data, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.take }),
    prisma.notification.count({ where }),
  ]);
  res.json(paginatedResponse(data, total, pagination));
});

router.put('/:id/read', async (req, res) => {
  const notification = await prisma.notification.updateMany({
    where: { id: req.params.id, usuarioId: req.user!.sub },
    data: { lida: true },
  });
  res.json({ updated: notification.count });
});

router.put('/read-all', async (req, res) => {
  await prisma.notification.updateMany({ where: { usuarioId: req.user!.sub, lida: false }, data: { lida: true } });
  res.json({ ok: true });
});

export default router;
