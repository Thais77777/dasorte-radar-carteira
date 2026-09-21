import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { PdvQueueTable } from '../components/pdv/PdvQueueTable';
import { PdvFilterBar, PdvFilters } from '../components/pdv/PdvFilterBar';
import { Pagination } from '../components/ui/Pagination';
import { usePdvList } from '../hooks/usePdvList';

export default function MinhasAcoes() {
  const [filters, setFilters] = useState<PdvFilters>({});
  const [page, setPage] = useState(1);

  // Fila operacional já ordenada por prioridade/status de retenção (vindos da base), com ações pendentes em destaque.
  const { data, isLoading } = usePdvList({ ...filters, page, pageSize: 25, sortBy: 'prioridade' });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Minhas Ações</h1>
        <p className="text-sm text-slate-500">Fila de trabalho priorizada — o que fazer agora, com base na classificação já existente na carteira.</p>
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
        <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500">{isLoading ? 'Carregando...' : `${data?.pagination.total ?? 0} PDVs na fila`}</div>
        <PdvQueueTable pdvs={data?.data ?? []} emptyMessage="Nenhum PDV pendente de ação com os filtros atuais." />
        {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} />}
      </Card>
    </div>
  );
}
