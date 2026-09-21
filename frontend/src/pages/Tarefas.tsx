import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card, StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Paginated, Task } from '../types';
import { formatDate } from '../lib/format';
import { prioridadeColor } from '../lib/badges';
import { Badge } from '../components/ui/Badge';

const TABS = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'atrasadas', label: 'Atrasadas' },
  { value: 'proximas', label: 'Próximas' },
  { value: 'concluidas', label: 'Concluídas' },
];

export default function Tarefas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtro = searchParams.get('filtro') ?? 'hoje';
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({ queryKey: ['tasks-summary'], queryFn: async () => (await api.get('/tasks/summary')).data });

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filtro, page],
    queryFn: async () => (await api.get<Paginated<Task>>('/tasks', { params: { filtro, page, pageSize: 25 } })).data,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.put(`/tasks/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-summary'] });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Tarefas</h1>
        <p className="text-sm text-slate-500">Acompanhamento das ações agendadas para a carteira.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Hoje" value={summary?.hoje ?? '—'} />
        <StatCard label="Atrasadas" value={summary?.atrasadas ?? '—'} tone="danger" />
        <StatCard label="Próximas" value={summary?.proximas ?? '—'} tone="info" />
        <StatCard label="Concluídas" value={summary?.concluidas ?? '—'} tone="success" />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setSearchParams({ filtro: tab.value });
              setPage(1);
            }}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${filtro === tab.value ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500">{isLoading ? 'Carregando...' : `${data?.pagination.total ?? 0} tarefas`}</div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">PDV</th>
              <th className="px-4 py-2.5">Título</th>
              <th className="px-4 py-2.5">Tipo</th>
              <th className="px-4 py-2.5">Prazo</th>
              <th className="px-4 py-2.5">Responsável</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data?.data ?? []).map((task) => (
              <tr key={task.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link to={`/pdv/${task.pdvId}`} className="font-medium text-slate-800 hover:text-brand-600 hover:underline">
                    {task.pdv?.codigoPdv}
                  </Link>
                  {task.pdv?.prioridade && <Badge className={`ml-2 ${prioridadeColor(task.pdv.prioridade)}`}>{task.pdv.prioridade}</Badge>}
                </td>
                <td className="px-4 py-2.5">{task.titulo}</td>
                <td className="px-4 py-2.5 text-slate-500">{task.tipo}</td>
                <td className="px-4 py-2.5 text-slate-500">{formatDate(task.prazo)}</td>
                <td className="px-4 py-2.5 text-slate-500">{task.responsavel?.name}</td>
                <td className="px-4 py-2.5 text-slate-500">{task.status}</td>
                <td className="px-4 py-2.5">
                  {task.status !== 'CONCLUIDA' && task.status !== 'CANCELADA' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ id: task.id, status: 'CONCLUIDA' })}>
                        Concluir
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: task.id, status: 'CANCELADA' })}>
                        Cancelar
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.data.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">Nenhuma tarefa encontrada.</p>}
        {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} />}
      </Card>
    </div>
  );
}
