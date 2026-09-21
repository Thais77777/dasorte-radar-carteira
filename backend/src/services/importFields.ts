export type FieldType = 'string' | 'decimal' | 'date' | 'int';

export interface FieldDef {
  key: string; // nome do campo no modelo PDV
  label: string; // nome da coluna na planilha
  type: FieldType;
  required?: boolean;
}

// Espelha exatamente as 31 colunas da base oficial (seção 3).
export const PDV_FIELD_DEFS: FieldDef[] = [
  { key: 'codigoPdv', label: 'PDV', type: 'string', required: true },
  { key: 'nome', label: 'Nome', type: 'string', required: true },
  { key: 'cidade', label: 'Cidade', type: 'string' },
  { key: 'telefone', label: 'Telefone', type: 'string' },
  { key: 'canal', label: 'Canal', type: 'string' },
  { key: 'modalidade', label: 'Modalidade', type: 'string' },
  { key: 'supervisorPlanilha', label: 'Supervisor', type: 'string' },
  { key: 'consultorPlanilha', label: 'Consultor', type: 'string' },
  { key: 'statusVendas', label: 'Status Vendas', type: 'string' },
  { key: 'adimplencia', label: 'Adimplência', type: 'string' },
  { key: 'maturidade', label: 'Maturidade', type: 'string' },
  { key: 'statusRetencao', label: 'Status de Retenção', type: 'string' },
  { key: 'valor', label: 'Valor', type: 'string' },
  { key: 'prioridade', label: 'Prioridade', type: 'string' },
  { key: 'segmento', label: 'Segmento', type: 'string' },
  { key: 'ultimaTransacao', label: 'Última Transação', type: 'date' },
  { key: 'diasSemTransacao', label: 'Dias sem Transação', type: 'int' },
  { key: 'dataUltimaVendaRaspadinha', label: 'Data Últ. Venda Raspadinha', type: 'date' },
  { key: 'valorUltimaVendaRaspadinha', label: 'Valor Últ. Venda Raspadinha', type: 'decimal' },
  { key: 'dataUltimaCompraRaspadinha', label: 'Data Últ. Compra Raspadinha', type: 'date' },
  { key: 'valorUltimaCompraRaspadinha', label: 'Valor Últ. Compra Raspadinha', type: 'decimal' },
  { key: 'dataUltimaVendaTrem', label: 'Data Últ. Venda Trem das 11', type: 'date' },
  { key: 'valorUltimaVendaTrem', label: 'Valor Últ. Venda Trem das 11', type: 'decimal' },
  { key: 'estoque', label: 'Estoque', type: 'decimal' },
  { key: 'totalPacotesRaspadinha', label: 'Total Pacotes Raspadinha', type: 'decimal' },
  { key: 'totalVendasRaspadinha', label: 'Total Vendas Raspadinha', type: 'decimal' },
  { key: 'selloutTotal', label: 'Sellout Total', type: 'decimal' },
  { key: 'selloutMedioMensal', label: 'Sellout Médio Mensal', type: 'decimal' },
  { key: 'dataAtivacao', label: 'Data Ativação', type: 'date' },
  { key: 'mesesDeBase', label: 'Meses de Base', type: 'decimal' },
  { key: 'diasComMovimento', label: 'Dias com Movimento', type: 'int' },
];

// Campos estratégicos — nunca calculados, apenas importados (seção 5/33)
export const STRATEGIC_FIELDS = ['maturidade', 'statusRetencao', 'valor', 'prioridade', 'segmento'];

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Sugere o mapeamento de colunas comparando cabeçalhos da planilha aos rótulos esperados. */
export function suggestMapping(headers: string[]): Record<string, string | null> {
  const normalizedHeaders = headers.map((h) => ({ original: h, normalized: normalize(h) }));
  const mapping: Record<string, string | null> = {};
  for (const field of PDV_FIELD_DEFS) {
    const target = normalize(field.label);
    const match = normalizedHeaders.find((h) => h.normalized === target);
    mapping[field.key] = match ? match.original : null;
  }
  return mapping;
}

const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30)).getTime();

export function parseDateValue(raw: unknown): Date | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw === 'number') {
    const ms = EXCEL_EPOCH + raw * 86400000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(raw).trim();
  if (!str) return null;
  // dd/mm/yyyy
  const br = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (br) {
    const [, d, m, y] = br;
    const year = y.length === 2 ? Number(y) + 2000 : Number(y);
    const date = new Date(Date.UTC(year, Number(m) - 1, Number(d)));
    return isNaN(date.getTime()) ? null : date;
  }
  const iso = new Date(str);
  return isNaN(iso.getTime()) ? null : iso;
}

export function parseDecimalValue(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return raw;
  let str = String(raw).trim();
  if (!str) return null;
  str = str.replace(/[^\d,.-]/g, '');
  if (str.includes(',') && str.includes('.')) {
    // formato BR: 1.234,56
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

export function parseIntValue(raw: unknown): number | null {
  const dec = parseDecimalValue(raw);
  return dec === null ? null : Math.round(dec);
}

export function parseStringValue(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  return str === '' ? null : str;
}
