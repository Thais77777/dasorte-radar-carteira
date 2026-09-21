import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ContactabilidadeStatus, RoleName, TimelineEventType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { parseUploadedFile } from '../services/fileParser';
import { PDV_FIELD_DEFS, STRATEGIC_FIELDS, suggestMapping, parseDateValue, parseDecimalValue, parseIntValue, parseStringValue } from '../services/importFields';
import { logTimelineEvent } from '../utils/timeline';
import { serialize } from '../utils/serialize';
import { getPagination, paginatedResponse } from '../utils/pagination';

const router = Router();
router.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/import/preview — upload + leitura + preview + mapeamento sugerido (seção 7)
router.post('/preview', requireRole(RoleName.ADMIN, RoleName.GESTOR), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    const { headers, rows } = await parseUploadedFile(req.file.buffer, req.file.originalname);
    if (headers.length === 0) return res.status(400).json({ error: 'Não foi possível identificar cabeçalhos no arquivo.' });

    const mapping = suggestMapping(headers);
    res.json({
      filename: req.file.originalname,
      headers,
      fieldDefs: PDV_FIELD_DEFS,
      suggestedMapping: mapping,
      totalRows: rows.length,
      sampleRows: rows.slice(0, 10),
      rows,
    });
  } catch (err) {
    next(err);
  }
});

function castValue(type: string, raw: unknown): unknown {
  switch (type) {
    case 'date':
      return parseDateValue(raw);
    case 'decimal':
      return parseDecimalValue(raw);
    case 'int':
      return parseIntValue(raw);
    default:
      return parseStringValue(raw);
  }
}

// POST /api/import/confirm — validação + importação + relatório (seções 7, 8, 9, 33)
router.post('/confirm', requireRole(RoleName.ADMIN, RoleName.GESTOR), async (req, res, next) => {
  try {
    const schema = z.object({
      filename: z.string(),
      mapping: z.record(z.string().nullable()),
      rows: z.array(z.record(z.any())),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const { filename, mapping, rows } = parsed.data;

    if (!mapping['codigoPdv']) {
      return res.status(400).json({ error: 'É obrigatório mapear a coluna "PDV" (chave única).' });
    }

    const seenCodes = new Set<string>();
    const errors: Array<{ linha: number; erro: string }> = [];
    let novos = 0;
    let atualizados = 0;
    let duplicados = 0;
    let invalidos = 0;

    const importBatch = await prisma.importBatch.create({
      data: {
        usuarioId: req.user!.sub,
        arquivo: filename,
        totalLinhas: rows.length,
        novosRegistros: 0,
        atualizados: 0,
        duplicados: 0,
        invalidos: 0,
        columnMapping: mapping,
      },
    });

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const linhaNumero = i + 2; // considerando cabeçalho na linha 1

      const codigoPdvHeader = mapping['codigoPdv']!;
      const codigoPdv = parseStringValue(rawRow[codigoPdvHeader]);
      if (!codigoPdv) {
        invalidos++;
        errors.push({ linha: linhaNumero, erro: 'Campo PDV (chave única) ausente.' });
        continue;
      }
      if (seenCodes.has(codigoPdv)) {
        duplicados++;
        errors.push({ linha: linhaNumero, erro: `PDV "${codigoPdv}" duplicado dentro do próprio arquivo — apenas a última ocorrência foi considerada.` });
      }
      seenCodes.add(codigoPdv);

      const data: Record<string, unknown> = {};
      for (const field of PDV_FIELD_DEFS) {
        const header = mapping[field.key];
        if (!header) continue;
        data[field.key] = castValue(field.type, rawRow[header]);
      }

      if (!data.nome) {
        invalidos++;
        errors.push({ linha: linhaNumero, erro: `PDV "${codigoPdv}": campo Nome ausente.` });
        continue;
      }

      try {
        const existing = await prisma.pDV.findUnique({ where: { codigoPdv } });

        if (existing) {
          const changedFields: Array<{ campo: string; de: unknown; para: unknown }> = [];
          for (const [key, value] of Object.entries(data)) {
            const before = (existing as any)[key];
            const beforeCmp = before instanceof Date ? before.toISOString() : before?.toString?.() ?? before;
            const afterCmp = value instanceof Date ? value.toISOString() : (value as any)?.toString?.() ?? value;
            if (beforeCmp !== afterCmp) {
              changedFields.push({ campo: key, de: before, para: value });
            }
          }

          const updated = await prisma.pDV.update({ where: { id: existing.id }, data: data as any });
          atualizados++;

          if (changedFields.length > 0) {
            await prisma.importChange.createMany({
              data: changedFields.map((c) => ({
                importBatchId: importBatch.id,
                pdvId: existing.id,
                campo: c.campo,
                valorAnterior: c.de === null || c.de === undefined ? null : String(c.de),
                valorNovo: c.para === null || c.para === undefined ? null : String(c.para),
              })),
            });

            const strategicChanges = changedFields.filter((c) => STRATEGIC_FIELDS.includes(c.campo));
            if (strategicChanges.length > 0) {
              await logTimelineEvent({
                pdvId: existing.id,
                usuarioId: req.user!.sub,
                tipo: TimelineEventType.CLASSIFICACAO_ALTERADA,
                descricao: `Classificação alterada pela nova importação: ${strategicChanges.map((c) => `${c.campo} "${c.de ?? '-'}" → "${c.para ?? '-'}"`).join('; ')}`,
                metadata: { changes: strategicChanges },
              });
            }
            await logTimelineEvent({
              pdvId: existing.id,
              usuarioId: req.user!.sub,
              tipo: TimelineEventType.IMPORTACAO,
              descricao: `PDV atualizado pela importação (${changedFields.length} campo(s) alterado(s))`,
              metadata: { importBatchId: importBatch.id },
            });
          }

          await prisma.performanceSnapshot.create({
            data: {
              pdvId: existing.id,
              importBatchId: importBatch.id,
              selloutTotal: updated.selloutTotal,
              selloutMedioMensal: updated.selloutMedioMensal,
              estoque: updated.estoque,
              diasSemTransacao: updated.diasSemTransacao,
              statusRetencao: updated.statusRetencao,
              prioridade: updated.prioridade,
              valor: updated.valor,
              maturidade: updated.maturidade,
            },
          });
        } else {
          const created = await prisma.pDV.create({ data: { codigoPdv, ...data } as any });
          novos++;

          await prisma.contactability.create({
            data: {
              pdvId: created.id,
              status: created.telefone ? ContactabilidadeStatus.NUNCA_CONTATADO : ContactabilidadeStatus.SEM_TELEFONE,
            },
          });

          await logTimelineEvent({
            pdvId: created.id,
            usuarioId: req.user!.sub,
            tipo: TimelineEventType.IMPORTACAO,
            descricao: 'PDV importado pela primeira vez.',
            metadata: { importBatchId: importBatch.id },
          });

          await prisma.performanceSnapshot.create({
            data: {
              pdvId: created.id,
              importBatchId: importBatch.id,
              selloutTotal: created.selloutTotal,
              selloutMedioMensal: created.selloutMedioMensal,
              estoque: created.estoque,
              diasSemTransacao: created.diasSemTransacao,
              statusRetencao: created.statusRetencao,
              prioridade: created.prioridade,
              valor: created.valor,
              maturidade: created.maturidade,
            },
          });
        }
      } catch (err: any) {
        invalidos++;
        errors.push({ linha: linhaNumero, erro: `PDV "${codigoPdv}": ${err.message ?? 'erro ao processar.'}` });
      }
    }

    const finalBatch = await prisma.importBatch.update({
      where: { id: importBatch.id },
      data: { novosRegistros: novos, atualizados, duplicados, invalidos, erros: errors.slice(0, 500) },
    });

    res.status(201).json(serialize({ ...finalBatch, errosDetalhados: errors.slice(0, 500) }));
  } catch (err) {
    next(err);
  }
});

// GET /api/import/history — histórico de importações (seção 9)
router.get('/history', async (req, res) => {
  const pagination = getPagination(req, 20);
  const [data, total] = await Promise.all([
    prisma.importBatch.findMany({
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
      include: { usuario: { select: { id: true, name: true } } },
    }),
    prisma.importBatch.count(),
  ]);
  res.json(paginatedResponse(serialize(data), total, pagination));
});

router.get('/history/:id', async (req, res) => {
  const batch = await prisma.importBatch.findUnique({
    where: { id: req.params.id },
    include: { usuario: { select: { id: true, name: true } }, changes: { take: 500, include: { pdv: { select: { codigoPdv: true, nome: true } } } } },
  });
  if (!batch) return res.status(404).json({ error: 'Importação não encontrada.' });
  res.json(serialize(batch));
});

export default router;
