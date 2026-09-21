import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { PdvQueueTable } from '../components/pdv/PdvQueueTable';
import { PdvFilterBar, PdvFilters } from '../components/pdv/PdvFilterBar';
import { usePdvList } from '../hooks/usePdvList';
import { api } from '../api/client';

const PRESETS: Array<{ label: string; filters: PdvFilters }> = [
  { label: 'Alto Valor + Risco + sem contato', filters: { valor: 'Alto', statusRetencao: 'Risco', contactabilidade: 'NUNCA_CONTATADO' } },
  { label: 'Críticos + Churn', filters: { prioridade: 'Crítica', statusRetencao: 'Churn' } },
  { label: 'PDVs sem telefone', filters: { contactabilidade: 'SEM_TELEFONE' } },
  { label: 'Alta prioridade + sem resposta', filters: { prioridade: 'Alta', contactabilidade: 'SEM_RESPOSTA' } },
];

export default function Inteligencia() {
  const [filters, setFilters] = useState<PdvFilters>({});
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePdvList({ ...filters, page, pageSize: 25 });

  async function handleExport() {
    const params = new URLSearchParams({ ...(filters as Record<string, string>), format: 'csv' });
    const token = localStorage.getItem('dasorte_token');
    const res = await api.get(`/export/pdvs?${params.toString()}`, { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lista-filtrada.csv';
    a.click();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Inteligência & Performance</h1>
        <p className="text-sm text-slate-500">Monte listas cruzando os campos já classificados na base.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button key={preset.label} variant="secondary" size="sm" onClick={() => { setFilters(preset.filters); setPage(1); }}>
            {preset.label}
          </Button>
        ))}
      </div>

      <Card className="p-4">
        <PdvFilterBar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="text-sm text-slate-500">{isLoading ? 'Carregando...' : `${data?.pagination.total ?? 0} PDVs na lista`}</span>
          <Button variant="secondary" size="sm" onClick={handleExport}>Exportar lista (CSV)</Button>
        </div>
        <PdvQueueTable pdvs={data?.data ?? []} />
        {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} />}
      </Card>
    </div>
  );
}
