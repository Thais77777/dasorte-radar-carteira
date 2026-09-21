import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card, CardHeader, CardTitle, CardBody, StatCard } from '../components/ui/Card';
import { SimpleBarChart } from '../components/charts/SimpleBarChart';
import { PdvQueueTable } from '../components/pdv/PdvQueueTable';
import { Pagination } from '../components/ui/Pagination';
import { Select } from '../components/ui/Input';
import { VALOR_HEX } from '../lib/badges';
import { formatCurrency } from '../lib/format';
import { usePdvList } from '../hooks/usePdvList';

interface SelloutData {
  selloutTotal: number;
  porValor: Array<{ label: string; total: number }>;
  porCidade: Array<{ label: string; total: number }>;
}

export default function Financeiro() {
  const [adimplencia, setAdimplencia] = useState('Inadimplente');
  const [page, setPage] = useState(1);

  const { data: sellout, isLoading } = useQuery({
    queryKey: ['dashboard-financeiro', adimplencia],
    queryFn: async () => (await api.get<SelloutData>('/dashboard/sellout', { params: { adimplencia: adimplencia || undefined } })).data,
  });

  const { data: list, isLoading: listLoading } = usePdvList({ adimplencia: adimplencia || undefined, page, pageSize: 25 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-sm text-slate-500">Visão de adimplência e sellout associado.</p>
        </div>
        <Select className="w-56" value={adimplencia} onChange={(e) => { setAdimplencia(e.target.value); setPage(1); }}>
          <option value="">Todos</option>
          <option value="Adimplente">Adimplente</option>
          <option value="Inadimplente">Inadimplente</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="PDVs no filtro" value={list?.pagination.total ?? '—'} />
        <StatCard label="Sellout associado" value={isLoading ? '—' : formatCurrency(sellout?.selloutTotal)} tone="info" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Distribuição por Valor</CardTitle></CardHeader>
          <CardBody><SimpleBarChart data={sellout?.porValor ?? []} colorMap={VALOR_HEX} valueFormatter={formatCurrency} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Distribuição Geográfica</CardTitle></CardHeader>
          <CardBody><SimpleBarChart data={sellout?.porCidade ?? []} valueFormatter={formatCurrency} /></CardBody>
        </Card>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500">{listLoading ? 'Carregando...' : `${list?.pagination.total ?? 0} PDVs`}</div>
        <PdvQueueTable pdvs={list?.data ?? []} />
        {list && <Pagination page={list.pagination.page} totalPages={list.pagination.totalPages} total={list.pagination.total} onChange={setPage} />}
      </Card>
    </div>
  );
}
