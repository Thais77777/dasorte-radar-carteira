import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export interface ParsedFile {
  headers: string[];
  rows: Record<string, unknown>[];
}

export async function parseUploadedFile(buffer: Buffer, filename: string): Promise<ParsedFile> {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    const text = buffer.toString('utf-8');
    const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true });
    const headers = parsed.meta.fields ?? [];
    return { headers, rows: parsed.data };
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];
    if (!sheet) return { headers: [], rows: [] };

    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value ?? '').trim();
    });

    const rows: Record<string, unknown>[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const obj: Record<string, unknown> = {};
      let hasValue = false;
      headers.forEach((header, idx) => {
        if (!header) return;
        const cell = row.getCell(idx + 1);
        let value: unknown = cell.value;
        if (value && typeof value === 'object' && 'result' in (value as any)) {
          value = (value as any).result; // fórmulas
        }
        if (value && typeof value === 'object' && 'text' in (value as any)) {
          value = (value as any).text; // rich text
        }
        obj[header] = value ?? null;
        if (value !== null && value !== undefined && value !== '') hasValue = true;
      });
      if (hasValue) rows.push(obj);
    });

    return { headers: headers.filter(Boolean), rows };
  }

  throw Object.assign(new Error('Formato de arquivo não suportado. Utilize .xlsx, .xls ou .csv. (Arquivos .ods devem ser exportados como .xlsx antes da importação.)'), { status: 400 });
}
