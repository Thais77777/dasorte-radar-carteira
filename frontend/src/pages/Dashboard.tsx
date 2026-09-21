import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/ui/Card';
import { formatCurrency, formatNumber } from '../lib/format';

interface DashboardData {
  totalPdvs: number;
  pdvsAtivos: number;
  pdvsSaudaveis: number;
  pdvsTendencia: number;
  pdvsRisco: number;
  pdvsChurn: number;
  prioridadeCritica: number;
  prioridadeAlta: number;
  selloutTotal: number;
  selloutMedioMensal: number;
  pdvsSemContactabilidade: number;
  acoesPendentes: number;
  tarefasAtrasadas: number;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardData>('/dashboard')).data,
  });

  const { data: taskSummary } = useQuery({
    queryKey: ['tasks-summary'],
    queryFn: async () => (await api.get('/tasks/summary')).data as { hoje: number; atrasadas: number; proximas: number; concluidas: number },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting()}, {user?.name?.split(' ')[0]}.
        </h1>
        <p className="text-sm text-slate-500">Aqui está o panorama da carteira hoje.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Minhas ações de hoje</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Link to="/pdvs?prioridade=Crítica"><StatCard label="🔴 Críticas" value={data?.prioridadeCritica ?? '—'} tone="danger" /></Link>
          <Link to="/pdvs?prioridade=Alta"><StatCard label="🟠 Alta prioridade" value={data?.prioridadeAlta ?? '—'} tone="warning" /></Link>
          <Link to="/contactabilidade"><StatCard label="📞 Sem contato" value={data?.pdvsSemContactabilidade ?? '—'} tone="info" /></Link>
          <Link to="/pdvs?statusRetencao=Risco"><StatCard label="⚠️ Em risco" value={data?.pdvsRisco ?? '—'} tone="warning" /></Link>
          <Link to="/pdvs?statusRetencao=Churn"><StatCard label="🔄 Churn" value={data?.pdvsChurn ?? '—'} tone="danger" /></Link>
          <Link to="/tarefas?filtro=atrasadas"><StatCard label="⏰ Atrasadas" value={taskSummary?.atrasadas ?? '—'} tone="danger" /></Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Visão geral da carteira</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total de PDVs" value={isLoading ? '—' : formatNumber(data?.totalPdvs)} />
          <StatCard label="PDVs ativos" value={isLoading ? '—' : formatNumber(data?.pdvsAtivos)} tone="success" />
          <StatCard label="PDVs saudáveis" value={isLoading ? '—' : formatNumber(data?.pdvsSaudaveis)} tone="success" />
          <StatCard label="PDVs em tendência" value={isLoading ? '—' : formatNumber(data?.pdvsTendencia)} tone="warning" />
          <StatCard label="PDVs em risco" value={isLoading ? '—' : formatNumber(data?.pdvsRisco)} tone="warning" />
          <StatCard label="PDVs em churn" value={isLoading ? '—' : formatNumber(data?.pdvsChurn)} tone="danger" />
          <StatCard label="Prioridade crítica" value={isLoading ? '—' : formatNumber(data?.prioridadeCritica)} tone="danger" />
          <StatCard label="Prioridade alta" value={isLoading ? '—' : formatNumber(data?.prioridadeAlta)} tone="warning" />
          <StatCard label="Sellout total" value={isLoading ? '—' : formatCurrency(data?.selloutTotal)} tone="info" />
          <StatCard label="Sellout médio mensal" value={isLoading ? '—' : formatCurrency(data?.selloutMedioMensal)} tone="info" />
          <StatCard label="Sem contactabilidade" value={isLoading ? '—' : formatNumber(data?.pdvsSemContactabilidade)} />
          <StatCard label="Ações pendentes" value={isLoading ? '—' : formatNumber(data?.acoesPendentes)} />
          <StatCard label="Tarefas atrasadas" value={isLoading ? '—' : formatNumber(data?.tarefasAtrasadas)} tone="danger" />
        </div>
      </section>
    </div>
  );
}
