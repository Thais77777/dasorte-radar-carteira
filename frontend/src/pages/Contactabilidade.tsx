import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card, CardHeader, CardTitle, CardBody, StatCard } from '../components/ui/Card';
import { PdvQueueTable } from '../components/pdv/PdvQueueTable';
import { Pagination } from '../components/ui/Pagination';
import { Select } from '../components/ui/Input';
import { usePdvList } from '../hooks/usePdvList';

interface ContactabilityData {
  comTelefone: number;
  semTelefone: number;
  nuncaContatados: number;
  aguardandoResposta: number;
  semResposta: number;
  contatoRecuperado: number;
  contatoInvalido: number;
  contatoRealizado: number;
  escalarContato: number;
  taxaContactabilidade: number;
  taxaResposta: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os PDVs' },
  { value: 'SEM_TELEFONE', label: 'Sem telefone (higienização cadastral)' },
  { value: 'NUNCA_CONTATADO', label: 'Nunca contatados' },
  { value: 'AGUARDANDO_RESPOSTA', label: 'Aguardando resposta' },
  { value: 'SEM_RESPOSTA', label: 'Sem resposta' },
  { value: 'CONTATO_REALIZADO', label: 'Contato realizado' },
  { value: 'CONTATO_RECUPERADO', label: 'Contato recuperado' },
  { value: 'CONTATO_INVALIDO', label: 'Contato inválido' },
  { value: 'ESCALAR_CONTATO', label: 'Escalar contato' },
];

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export default function Contactabilidade() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-contactability'],
    queryFn: async () => (await api.get<ContactabilityData>('/dashboard/contactability')).data,
  });

  const { data: list, isLoading: listLoading } = usePdvList({
    page,
    pageSize: 25,
    contactabilidade: statusFilter || undefined,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Contactabilidade</h1>
        <p className="text-sm text-slate-500">Sem telefone não significa churn — significa cadastro incompleto e fila de higienização.</p>
      </div>

      {isLoading || !data ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Taxa de contactabilidade" value={pct(data.taxaContactabilidade)} tone="info" />
            <StatCard label="Taxa de resposta" value={pct(data.taxaResposta)} tone="info" />
            <StatCard label="Com telefone" value={data.comTelefone} tone="success" />
            <StatCard label="Sem telefone" value={data.semTelefone} tone="warning" />
            <StatCard label="Nunca contatados" value={data.nuncaContatados} />
            <StatCard label="Aguardando resposta" value={data.aguardandoResposta} tone="warning" />
            <StatCard label="Sem resposta" value={data.semResposta} tone="warning" />
            <StatCard label="Contato recuperado" value={data.contatoRecuperado} tone="success" />
            <StatCard label="Contato inválido" value={data.contatoInvalido} tone="danger" />
            <StatCard label="Contato realizado" value={data.contatoRealizado} tone="success" />
            <StatCard label="Escalar contato" value={data.escalarContato} tone="danger" />
          </div>
        </>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>PDVs por status de contactabilidade</CardTitle>
          <Select className="w-72" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </CardHeader>
        <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500">{listLoading ? 'Carregando...' : `${list?.pagination.total ?? 0} PDVs`}</div>
        <PdvQueueTable pdvs={list?.data ?? []} />
        {list && <Pagination page={list.pagination.page} totalPages={list.pagination.totalPages} total={list.pagination.total} onChange={setPage} />}
      </Card>
    </div>
  );
}
