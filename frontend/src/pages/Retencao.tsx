import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { SimpleBarChart } from '../components/charts/SimpleBarChart';
import { PRIORIDADE_HEX, RETENCAO_HEX, VALOR_HEX } from '../lib/badges';
import { formatCurrency } from '../lib/format';

interface RetentionData {
  porStatus: Array<{ label: string; total: number }>;
  porPrioridade: Array<{ label: string; total: number }>;
  porMaturidade: Array<{ label: string; total: number }>;
  porValor: Array<{ label: string; total: number }>;
  porSegmento: Array<{ label: string; total: number }>;
  churnPorCidade: Array<{ label: string; total: number }>;
  churnPorSupervisor: Array<{ label: string; total: number }>;
  churnPorConsultor: Array<{ label: string; total: number }>;
  selloutPorStatus: Array<{ label: string; total: number }>;
}

export default function Retencao() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-retention'],
    queryFn: async () => (await api.get<RetentionData>('/dashboard/retention')).data,
  });

  if (isLoading || !data) return <p className="text-sm text-slate-500">Carregando...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Retenção</h1>
        <p className="text-sm text-slate-500">Distribuição da carteira segundo a classificação já existente na base.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>PDVs por Status de Retenção</CardTitle></CardHeader>
          <CardBody><SimpleBarChart data={data.porStatus} colorMap={RETENCAO_HEX} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>PDVs por Prioridade</CardTitle></CardHeader>
          <CardBody><SimpleBarChart data={data.porPrioridade} colorMap={PRIORIDADE_HEX} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>PDVs por Maturidade</CardTitle></CardHeader>
          <CardBody><SimpleBarChart data={data.porMaturidade} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>PDVs por Valor</CardTitle></CardHeader>
          <CardBody><SimpleBarChart data={data.porValor} colorMap={VALOR_HEX} /></CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>PDVs por Segmento</CardTitle></CardHeader>
          <CardBody><SimpleBarChart data={data.porSegmento.slice(0, 12)} height={360} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Churn por Cidade</CardTitle></CardHeader>
          <CardBody><SimpleBarChart data={data.churnPorCidade} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Churn por Supervisor</CardTitle></CardHeader>
          <CardBody><SimpleBarChart data={data.churnPorSupervisor} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Churn por Consultor</CardTitle></CardHeader>
          <CardBody><SimpleBarChart data={data.churnPorConsultor} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sellout por Status de Retenção</CardTitle></CardHeader>
          <CardBody><SimpleBarChart data={data.selloutPorStatus} colorMap={RETENCAO_HEX} valueFormatter={(v) => formatCurrency(v)} /></CardBody>
        </Card>
      </div>
    </div>
  );
}
