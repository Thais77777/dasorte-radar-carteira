import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { ImportBatch, Paginated } from '../types';
import { formatDateTime } from '../lib/format';

export default function Historico() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['import-history', page],
    queryFn: async () => (await api.get<Paginated<ImportBatch>>('/import/history', { params: { page, pageSize: 20 } })).data,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Histórico de Importações</h1>
        <p className="text-sm text-slate-500">Toda importação realizada fica registrada e auditável.</p>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500">{isLoading ? 'Carregando...' : `${data?.pagination.total ?? 0} importações`}</div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Data</th>
              <th className="px-4 py-2.5">Usuário</th>
              <th className="px-4 py-2.5">Arquivo</th>
              <th className="px-4 py-2.5">Total</th>
              <th className="px-4 py-2.5">Novos</th>
              <th className="px-4 py-2.5">Atualizados</th>
              <th className="px-4 py-2.5">Duplicados</th>
              <th className="px-4 py-2.5">Erros</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data?.data ?? []).map((batch) => (
              <tr key={batch.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-500">{formatDateTime(batch.createdAt)}</td>
                <td className="px-4 py-2.5">{batch.usuario.name}</td>
                <td className="px-4 py-2.5">{batch.arquivo}</td>
                <td className="px-4 py-2.5">{batch.totalLinhas}</td>
                <td className="px-4 py-2.5 text-emerald-600">{batch.novosRegistros}</td>
                <td className="px-4 py-2.5 text-blue-600">{batch.atualizados}</td>
                <td className="px-4 py-2.5 text-orange-600">{batch.duplicados}</td>
                <td className="px-4 py-2.5 text-red-600">{batch.invalidos}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.data.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">Nenhuma importação realizada ainda.</p>}
        {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} />}
      </Card>
    </div>
  );
}
