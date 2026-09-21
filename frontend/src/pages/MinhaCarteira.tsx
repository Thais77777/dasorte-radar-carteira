import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/Card';
import { PdvQueueTable } from '../components/pdv/PdvQueueTable';
import { Pagination } from '../components/ui/Pagination';
import { usePdvList } from '../hooks/usePdvList';

export default function MinhaCarteira() {
  const [page, setPage] = useState(1);
  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: async () => (await api.get('/dashboard')).data });
  const { data: taskSummary } = useQuery({ queryKey: ['tasks-summary'], queryFn: async () => (await api.get('/tasks/summary')).data });
  const { data, isLoading } = usePdvList({ page, pageSize: 25, sortBy: 'prioridade' });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Minha Carteira</h1>
        <p className="text-sm text-slate-500">Todos os PDVs sob sua responsabilidade.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard label="Total" value={dashboard?.totalPdvs ?? '—'} />
        <StatCard label="Críticos" value={dashboard?.prioridadeCritica ?? '—'} tone="danger" />
        <StatCard label="Alta" value={dashboard?.prioridadeAlta ?? '—'} tone="warning" />
        <StatCard label="Tendência" value={dashboard?.pdvsTendencia ?? '—'} tone="warning" />
        <StatCard label="Risco" value={dashboard?.pdvsRisco ?? '—'} tone="warning" />
        <StatCard label="Churn" value={dashboard?.pdvsChurn ?? '—'} tone="danger" />
        <StatCard label="Sem contato" value={dashboard?.pdvsSemContactabilidade ?? '—'} />
        <StatCard label="Tarefas atrasadas" value={taskSummary?.atrasadas ?? '—'} tone="danger" />
      </div>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500">{isLoading ? 'Carregando...' : `${data?.pagination.total ?? 0} PDVs na carteira`}</div>
        <PdvQueueTable pdvs={data?.data ?? []} />
        {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} />}
      </Card>
    </div>
  );
}
