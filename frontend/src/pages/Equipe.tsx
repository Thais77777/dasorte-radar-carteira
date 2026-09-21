import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import { formatCurrency } from '../lib/format';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  totalPdvs: number;
  criticos: number;
  alta: number;
  risco: number;
  churn: number;
  semContato: number;
  tarefasAtrasadas: number;
  selloutTotal: number;
}

export default function Equipe() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['team-overview'],
    queryFn: async () => (await api.get<TeamMember[]>('/team/overview')).data,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Equipe</h1>
        <p className="text-sm text-slate-500">Acompanhamento dos CS/Farmers e da carteira sob sua gestão.</p>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500">{isLoading ? 'Carregando...' : `${data?.length ?? 0} membros na equipe`}</div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">CS</th>
              <th className="px-4 py-2.5">Total PDVs</th>
              <th className="px-4 py-2.5">Críticos</th>
              <th className="px-4 py-2.5">Alta</th>
              <th className="px-4 py-2.5">Risco</th>
              <th className="px-4 py-2.5">Churn</th>
              <th className="px-4 py-2.5">Sem contato</th>
              <th className="px-4 py-2.5">Tarefas atrasadas</th>
              <th className="px-4 py-2.5">Sellout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data ?? []).map((member) => (
              <tr key={member.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/pdvs?responsavelId=${member.id}`)}>
                <td className="px-4 py-2.5 font-medium text-slate-800">{member.name}</td>
                <td className="px-4 py-2.5">{member.totalPdvs}</td>
                <td className="px-4 py-2.5 text-red-600">{member.criticos}</td>
                <td className="px-4 py-2.5 text-orange-600">{member.alta}</td>
                <td className="px-4 py-2.5 text-orange-600">{member.risco}</td>
                <td className="px-4 py-2.5 text-red-600">{member.churn}</td>
                <td className="px-4 py-2.5">{member.semContato}</td>
                <td className="px-4 py-2.5 text-red-600">{member.tarefasAtrasadas}</td>
                <td className="px-4 py-2.5">{formatCurrency(member.selloutTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">Nenhum membro de equipe encontrado.</p>}
      </Card>
    </div>
  );
}
