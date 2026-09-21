import { Router } from 'express';
import { z } from 'zod';
import { CanalContato, ContactabilidadeStatus, ResultadoContato, TaskTipo, TimelineEventType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { assertPdvVisible } from '../utils/scope';
import { logTimelineEvent } from '../utils/timeline';
import { serialize } from '../utils/serialize';
import { getPagination, paginatedResponse } from '../utils/pagination';

const router = Router();
router.use(requireAuth);

const RESULT_TO_STATUS: Record<ResultadoContato, ContactabilidadeStatus> = {
  CONTATO_REALIZADO: ContactabilidadeStatus.CONTATO_REALIZADO,
  SEM_RESPOSTA: ContactabilidadeStatus.SEM_RESPOSTA,
  NUMERO_INVALIDO: ContactabilidadeStatus.CONTATO_INVALIDO,
  WHATSAPP_NAO_ENTREGUE: ContactabilidadeStatus.CONTATO_INVALIDO,
  RETORNO_SOLICITADO: ContactabilidadeStatus.AGUARDANDO_RESPOSTA,
  CONTATO_RECUPERADO: ContactabilidadeStatus.CONTATO_RECUPERADO,
};

const RESULT_LABEL: Record<ResultadoContato, string> = {
  CONTATO_REALIZADO: 'Contato realizado',
  SEM_RESPOSTA: 'Sem resposta',
  NUMERO_INVALIDO: 'Número inválido',
  WHATSAPP_NAO_ENTREGUE: 'WhatsApp não entregue',
  RETORNO_SOLICITADO: 'Retorno solicitado',
  CONTATO_RECUPERADO: 'Contato recuperado',
};

const CANAL_LABEL: Record<CanalContato, string> = {
  LIGACAO: 'Ligação',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  VISITA: 'Visita',
  OUTRO: 'Outro',
};

// POST /api/contacts — registrar contato (seção 19)
router.post('/', async (req, res) => {
  const schema = z.object({
    pdvId: z.string(),
    canal: z.nativeEnum(CanalContato),
    resultado: z.nativeEnum(ResultadoContato),
    observacao: z.string().optional().nullable(),
    proximaAcao: z.string().optional().nullable(),
    proximaAcaoData: z.string().datetime().optional().nullable().or(z.literal('')),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  const { pdvId, canal, resultado, observacao, proximaAcao } = parsed.data;
  const proximaAcaoData = parsed.data.proximaAcaoData ? new Date(parsed.data.proximaAcaoData) : null;

  const visible = await assertPdvVisible(req.user!, pdvId);
  if (!visible) return res.status(403).json({ error: 'Você não tem acesso a este PDV.' });

  const attempt = await prisma.contactAttempt.create({
    data: { pdvId, usuarioId: req.user!.sub, canal, resultado, observacao, proximaAcao, proximaAcaoData },
  });

  const regua = await prisma.appConfig.findUnique({ where: { key: 'regua_contactabilidade' } });
  const reguaLength = Array.isArray(regua?.value) ? (regua!.value as any[]).length : 5;

  const contactability = await prisma.contactability.upsert({
    where: { pdvId },
    create: { pdvId, status: RESULT_TO_STATUS[resultado], ultimoContato: new Date(), numeroTentativas: 1, ultimoCanal: canal, ultimoResultado: resultado, proximaAcao, proximaAcaoData },
    update: { ultimoContato: new Date(), numeroTentativas: { increment: 1 }, ultimoCanal: canal, ultimoResultado: resultado, proximaAcao, proximaAcaoData, status: RESULT_TO_STATUS[resultado] },
  });

  if (resultado !== ResultadoContato.CONTATO_REALIZADO && contactability.numeroTentativas >= reguaLength) {
    await prisma.contactability.update({ where: { pdvId }, data: { status: ContactabilidadeStatus.ESCALAR_CONTATO } });
  }

  await logTimelineEvent({
    pdvId,
    usuarioId: req.user!.sub,
    tipo: TimelineEventType.CONTATO_REGISTRADO,
    descricao: `${CANAL_LABEL[canal]}: ${RESULT_LABEL[resultado]}${observacao ? ` — ${observacao}` : ''}`,
    metadata: { canal, resultado, observacao },
  });

  let createdTask = null;
  if (proximaAcao && proximaAcaoData) {
    createdTask = await prisma.task.create({
      data: {
        pdvId,
        responsavelId: req.user!.sub,
        criadoPorId: req.user!.sub,
        titulo: proximaAcao,
        tipo: canal as unknown as TaskTipo,
        prazo: proximaAcaoData,
        status: 'PENDENTE',
      },
    });
    await logTimelineEvent({
      pdvId,
      usuarioId: req.user!.sub,
      tipo: TimelineEventType.TAREFA_CRIADA,
      descricao: `Tarefa criada: ${proximaAcao}`,
      metadata: { taskId: createdTask.id },
    });
  }

  res.status(201).json(serialize({ attempt, contactability, task: createdTask }));
});

// GET /api/contacts/:pdvId — histórico de tentativas de contato de um PDV
router.get('/:pdvId', async (req, res) => {
  const visible = await assertPdvVisible(req.user!, req.params.pdvId);
  if (!visible) return res.status(403).json({ error: 'Você não tem acesso a este PDV.' });

  const pagination = getPagination(req, 20);
  const where = { pdvId: req.params.pdvId };
  const [data, total] = await Promise.all([
    prisma.contactAttempt.findMany({ where, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.take, include: { usuario: { select: { id: true, name: true } } } }),
    prisma.contactAttempt.count({ where }),
  ]);
  res.json(paginatedResponse(serialize(data), total, pagination));
});

export default router;
