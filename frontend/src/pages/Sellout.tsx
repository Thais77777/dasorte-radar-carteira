import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Card, CardHeader, CardTitle, CardBody, StatCard } from '../components/ui/Card';
import { SimpleBarChart } from '../components/charts/SimpleBarChart';
import { PdvFilterBar, PdvFilters } from '../components/pdv/PdvFilterBar';
import { PRIORIDADE_HEX, RETENCAO_HEX, VALOR_HEX } from '../lib/badges';
import { formatCurrency } from '../lib/format';

interface SelloutData {
  selloutTotal: number;
  selloutMedioMensal: number;
  maiores: Array<{ id: string; codigoPdv: string; nome: string; cidade: string | null; selloutTotal: number }>;
  menores: Array<{ id: string; codigoPdv: string; nome: string; cidade: string | null; selloutTotal: number }>;
  porCidade: Array<{ label: string; total: number }>;
  porSupervisor: Array<{ label: string; total: number }>;
  porConsultor: Array<{ label: string; total: number }>;
  porPrioridade: Array<{ label: string; total: number }>;
  porStatus: Array<{ label: string; total: number }>;
  porValor: Array<{ label: string; total: number }>;
}

export default function Sellout() {
  const [filters, setFilters] = useState<PdvFilters>({});
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-sellout', filters],
    queryFn: async () => (await api.get<SelloutData>('/dashboard/sellout', { params: filters })).data,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Sellout</h1>
        <p className="text-sm text-slate-500">Desempenho de vendas da carteira.</p>
      </div>

      <Card className="p-4">
        <PdvFilterBar filters={filters} onChange={setFilters} />
      </Card>

      {isLoading || !data ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Sellout Total" value={formatCurrency(data.selloutTotal)} tone="info" />
            <StatCard label="Sellout Médio Mensal" value={formatCurrency(data.selloutMedioMensal)} tone="info" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>PDVs com maior sellout</CardTitle></CardHeader>
              <CardBody className="space-y-1">
                {data.maiores.map((p) => (
                  <Link key={p.id} to={`/pdv/${p.id}`} className="flex justify-between rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                    <span className="truncate">{p.codigoPdv} — {p.nome}</span>
                    <span className="font-medium">{formatCurrency(p.selloutTotal)}</span>
                  </Link>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle>PDVs com menor sellout</CardTitle></CardHeader>
              <CardBody className="space-y-1">
                {data.menores.map((p) => (
                  <Link key={p.id} to={`/pdv/${p.id}`} className="flex justify-between rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                    <span className="truncate">{p.codigoPdv} — {p.nome}</span>
                    <span className="font-medium">{formatCurrency(p.selloutTotal)}</span>
                  </Link>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle>Distribuição por Cidade</CardTitle></CardHeader>
              <CardBody><SimpleBarChart data={data.porCidade} valueFormatter={formatCurrency} /></CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle>Distribuição por Supervisor</CardTitle></CardHeader>
              <CardBody><SimpleBarChart data={data.porSupervisor} valueFormatter={formatCurrency} /></CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle>Distribuição por Consultor</CardTitle></CardHeader>
              <CardBody><SimpleBarChart data={data.porConsultor} valueFormatter={formatCurrency} /></CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle>Distribuição por Prioridade</CardTitle></CardHeader>
              <CardBody><SimpleBarChart data={data.porPrioridade} colorMap={PRIORIDADE_HEX} valueFormatter={formatCurrency} /></CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle>Distribuição por Status de Retenção</CardTitle></CardHeader>
              <CardBody><SimpleBarChart data={data.porStatus} colorMap={RETENCAO_HEX} valueFormatter={formatCurrency} /></CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle>Distribuição por Valor</CardTitle></CardHeader>
              <CardBody><SimpleBarChart data={data.porValor} colorMap={VALOR_HEX} valueFormatter={formatCurrency} /></CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
