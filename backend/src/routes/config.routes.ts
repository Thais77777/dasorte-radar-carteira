import { Router } from 'express';
import { z } from 'zod';
import { RoleName } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const DEFAULT_REGUA = [
  { tentativa: 1, canal: 'LIGACAO', descricao: 'Ligação' },
  { tentativa: 2, canal: 'WHATSAPP', descricao: 'WhatsApp' },
  { tentativa: 3, canal: 'LIGACAO', descricao: 'Ligação em outro horário' },
  { tentativa: 4, canal: 'WHATSAPP', descricao: 'WhatsApp' },
  { tentativa: 5, canal: 'LIGACAO', descricao: 'Ligação' },
];

// GET /api/config/regua-contactabilidade
router.get('/regua-contactabilidade', async (_req, res) => {
  const config = await prisma.appConfig.findUnique({ where: { key: 'regua_contactabilidade' } });
  res.json(config?.value ?? DEFAULT_REGUA);
});

router.put('/regua-contactabilidade', requireRole(RoleName.ADMIN), async (req, res) => {
  const schema = z.array(
    z.object({ tentativa: z.number(), canal: z.string(), descricao: z.string() })
  );
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Régua inválida.' });

  const config = await prisma.appConfig.upsert({
    where: { key: 'regua_contactabilidade' },
    update: { value: parsed.data },
    create: { key: 'regua_contactabilidade', value: parsed.data },
  });
  res.json(config.value);
});

export default router;
