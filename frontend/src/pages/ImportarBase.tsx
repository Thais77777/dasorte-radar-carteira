import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';

interface FieldDef {
  key: string;
  label: string;
  type: string;
  required?: boolean;
}

interface PreviewResponse {
  filename: string;
  headers: string[];
  fieldDefs: FieldDef[];
  suggestedMapping: Record<string, string | null>;
  totalRows: number;
  sampleRows: Record<string, unknown>[];
  rows: Record<string, unknown>[];
}

interface ImportReport {
  id: string;
  totalLinhas: number;
  novosRegistros: number;
  atualizados: number;
  duplicados: number;
  invalidos: number;
  errosDetalhados: Array<{ linha: number; erro: string }>;
}

export default function ImportarBase() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [report, setReport] = useState<ImportReport | null>(null);
  const queryClient = useQueryClient();

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<PreviewResponse>('/import/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data;
    },
    onSuccess: (data) => {
      setPreview(data);
      setMapping(data.suggestedMapping);
      setReport(null);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!preview) throw new Error('Nenhum arquivo carregado.');
      const res = await api.post<ImportReport>('/import/confirm', { filename: preview.filename, mapping, rows: preview.rows });
      return res.data;
    },
    onSuccess: (data) => {
      setReport(data);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pdvs'] });
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
    },
  });

  const requiredMissing = preview?.fieldDefs.filter((f) => f.required && !mapping[f.key]) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Importar Base</h1>
        <p className="text-sm text-slate-500">
          Faça upload da planilha (.xlsx, .xls ou .csv). A coluna <strong>PDV</strong> é a chave única — registros existentes são atualizados, novos são
          criados, e todo o histórico operacional é preservado.
        </p>
      </div>

      {!preview && !report && (
        <Card>
          <CardBody className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) previewMutation.mutate(file);
              }}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            />
            {previewMutation.isPending && <p className="text-sm text-slate-500">Lendo arquivo...</p>}
            {previewMutation.isError && <p className="text-sm text-red-600">Não foi possível ler o arquivo. Verifique o formato e tente novamente.</p>}
          </CardBody>
        </Card>
      )}

      {preview && (
        <>
          <Card>
            <CardHeader><CardTitle>Mapeamento de colunas ({preview.totalRows} registros encontrados)</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {preview.fieldDefs.map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <Select
                      value={mapping[field.key] ?? ''}
                      onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value || null }))}
                    >
                      <option value="">Não importar</option>
                      {preview.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
              {requiredMissing.length > 0 && (
                <p className="mt-3 text-sm text-red-600">Campos obrigatórios não mapeados: {requiredMissing.map((f) => f.label).join(', ')}</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Preview (10 primeiras linhas)</CardTitle></CardHeader>
            <CardBody className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead className="bg-slate-50 font-semibold uppercase text-slate-500">
                  <tr>
                    {preview.fieldDefs
                      .filter((f) => mapping[f.key])
                      .map((f) => (
                        <th key={f.key} className="px-3 py-2">
                          {f.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.sampleRows.map((row, i) => (
                    <tr key={i}>
                      {preview.fieldDefs
                        .filter((f) => mapping[f.key])
                        .map((f) => (
                          <td key={f.key} className="px-3 py-2">
                            {String(row[mapping[f.key]!] ?? '')}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Cancelar
            </Button>
            <Button disabled={requiredMissing.length > 0 || confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
              {confirmMutation.isPending ? 'Importando...' : `Confirmar importação de ${preview.totalRows} registros`}
            </Button>
          </div>
          {confirmMutation.isError && <p className="text-sm text-red-600">Falha ao importar. Tente novamente.</p>}
        </>
      )}

      {report && (
        <Card>
          <CardHeader><CardTitle>Relatório da importação</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <ReportStat label="Total de linhas" value={report.totalLinhas} />
              <ReportStat label="Novos PDVs" value={report.novosRegistros} tone="success" />
              <ReportStat label="Atualizados" value={report.atualizados} tone="info" />
              <ReportStat label="Duplicados" value={report.duplicados} tone="warning" />
              <ReportStat label="Inválidos" value={report.invalidos} tone="danger" />
            </div>
            {report.errosDetalhados.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Detalhes ({report.errosDetalhados.length}):</p>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-100">
                  {report.errosDetalhados.map((e, i) => (
                    <p key={i} className="border-b border-slate-50 px-3 py-1.5 text-xs text-slate-600 last:border-0">
                      Linha {e.linha}: {e.erro}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <Button
              onClick={() => {
                setReport(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              Importar outro arquivo
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function ReportStat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'success' | 'info' | 'warning' | 'danger' }) {
  const toneClasses: Record<string, string> = {
    default: 'text-slate-900',
    success: 'text-emerald-600',
    info: 'text-blue-600',
    warning: 'text-orange-600',
    danger: 'text-red-600',
  };
  return (
    <div className="rounded-lg border border-slate-100 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}
