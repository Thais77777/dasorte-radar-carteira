import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { RoleName } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { requireAuth } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, name: true, email: true, role: true, supervisorId: true, active: true },
  });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json(user);
});

// POST /api/auth/bootstrap-admin — utilitário temporário para criar o primeiro
// administrador em produção sem acesso direto ao banco. Fica inerte (404) a
// menos que a env var BOOTSTRAP_SECRET esteja definida no serviço; remova essa
// env var (ou o endpoint) depois do primeiro uso.
router.post('/bootstrap-admin', async (req, res) => {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret) return res.status(404).json({ error: 'Não encontrado.' });

  const provided = req.header('x-bootstrap-secret') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  const matches = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!matches) return res.status(403).json({ error: 'Segredo inválido.' });

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: RoleName.ADMIN, active: true },
    create: { email, name: parsed.data.name, passwordHash, role: RoleName.ADMIN },
  });

  res.status(201).json({ ok: true, userId: user.id, email: user.email });
});

export default router;
