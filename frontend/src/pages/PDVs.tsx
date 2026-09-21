import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { PdvQueueTable } from '../components/pdv/PdvQueueTable';
import { PdvFilterBar, PdvFilters } from '../components/pdv/PdvFilterBar';
import { usePdvList } from '../hooks/usePdvList';
import { api } from '../api/client';

export default function PDVs() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<PdvFilters>(() => Object.fromEntries(searchParams.entries()));
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('prioridade');

  const { data, isLoading } = usePdvList({ ...filters, page, pageSize: 25, sortBy });

  async function handleExport(format: 'csv' | 'xlsx') {
    const params = new URLSearchParams({ ...(filters as Record<string, string>), format });
    const token = localStorage.getItem('dasorte_token');
    const res = await api.get(`/export/pdvs?${params.toString()}`, { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdvs.${format}`;
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">PDVs</h1>
          <p className="text-sm text-slate-500">Base completa de pontos de venda importados.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleExport('csv')}>
            Exportar CSV
          </Button>
          <Button variant="secondary" onClick={() => handleExport('xlsx')}>
            Exportar Excel
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <PdvFilterBar
          filters={filters}
          onChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
        />
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="text-sm text-slate-500">{isLoading ? 'Carregando...' : `${data?.pagination.total ?? 0} PDVs encontrados`}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Ordenar por</span>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-48">
              <option value="prioridade">Prioridade</option>
              <option value="statusRetencao">Status de Retenção</option>
              <option value="valor">Valor</option>
              <option value="diasSemTransacao">Dias sem Transação</option>
              <option value="selloutTotal">Sellout Total</option>
              <option value="nome">Nome</option>
            </Select>
          </div>
        </div>
        <PdvQueueTable pdvs={data?.data ?? []} />
        {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} />}
      </Card>
    </div>
  );
}
