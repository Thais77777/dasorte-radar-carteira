import { Router } from 'express';
import ExcelJS from 'exceljs';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { getPdvWhereScope } from '../utils/scope';
import { buildPdvFilters } from '../services/pdvFilters';

const router = Router();
router.use(requireAuth);

const PDV_COLUMNS: Array<{ header: string; key: string }> = [
  { header: 'PDV', key: 'codigoPdv' },
  { header: 'Nome', key: 'nome' },
  { header: 'Cidade', key: 'cidade' },
  { header: 'Telefone', key: 'telefone' },
  { header: 'Canal', key: 'canal' },
  { header: 'Modalidade', key: 'modalidade' },
  { header: 'Supervisor', key: 'supervisorPlanilha' },
  { header: 'Consultor', key: 'consultorPlanilha' },
  { header: 'Status Vendas', key: 'statusVendas' },
  { header: 'Adimplência', key: 'adimplencia' },
  { header: 'Maturidade', key: 'maturidade' },
  { header: 'Status de Retenção', key: 'statusRetencao' },
  { header: 'Valor', key: 'valor' },
  { header: 'Prioridade', key: 'prioridade' },
  { header: 'Segmento', key: 'segmento' },
  { header: 'Última Transação', key: 'ultimaTransacao' },
  { header: 'Dias sem Transação', key: 'diasSemTransacao' },
  { header: 'Sellout Total', key: 'selloutTotal' },
  { header: 'Sellout Médio Mensal', key: 'selloutMedioMensal' },
  { header: 'Estoque', key: 'estoque' },
];

async function fetchPdvsForExport(req: any) {
  const scope = await getPdvWhereScope(req.user!);
  const filters = buildPdvFilters(req);
  return prisma.pDV.findMany({
    where: { AND: [scope, filters] },
    take: 20000,
    orderBy: { updatedAt: 'desc' },
    include: { contactability: true },
  });
}

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/export/pdvs?format=csv|xlsx — carteira / risco / churn / contactabilidade (seção 32)
router.get('/pdvs', async (req, res) => {
  const format = (req.query.format as string) === 'xlsx' ? 'xlsx' : 'csv';
  const pdvs = await fetchPdvsForExport(req);

  if (format === 'csv') {
    const header = PDV_COLUMNS.map((c) => c.header).join(',');
    const rows = pdvs.map((p) => PDV_COLUMNS.map((c) => toCsvValue((p as any)[c.key])).join(','));
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pdvs.csv"');
    return res.send('﻿' + csv);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('PDVs');
  sheet.columns = PDV_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: 18 }));
  pdvs.forEach((p) => sheet.addRow(p));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="pdvs.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

// GET /api/export/tasks — exportar tarefas
router.get('/tasks', async (req, res) => {
  const requester = req.user!;
  const where: any = ['ADMIN', 'GESTOR'].includes(requester.role) ? {} : { responsavelId: requester.sub };
  const tasks = await prisma.task.findMany({ where, take: 20000, include: { pdv: { select: { codigoPdv: true, nome: true } }, responsavel: { select: { name: true } } } });

  const header = 'PDV,Nome,Título,Tipo,Status,Prazo,Responsável';
  const rows = tasks.map((t) =>
    [t.pdv.codigoPdv, t.pdv.nome, t.titulo, t.tipo, t.status, t.prazo?.toISOString().slice(0, 10) ?? '', t.responsavel.name].map(toCsvValue).join(',')
  );
  const csv = [header, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="tarefas.csv"');
  res.send('﻿' + csv);
});

export default router;
