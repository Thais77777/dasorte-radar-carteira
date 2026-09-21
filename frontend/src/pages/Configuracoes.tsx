import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label, Select } from '../components/ui/Input';
import { ROLE_LABELS } from '../components/layout/Sidebar';
import { RoleName, User } from '../types';

interface ReguaStep {
  tentativa: number;
  canal: string;
  descricao: string;
}

const ROLES: RoleName[] = ['ADMIN', 'GESTOR', 'SUPERVISOR', 'CS', 'ANALISTA_DADOS', 'ANALISTA_FINANCEIRO'];

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const { data: regua } = useQuery({ queryKey: ['regua'], queryFn: async () => (await api.get<ReguaStep[]>('/config/regua-contactabilidade')).data });
  const [steps, setSteps] = useState<ReguaStep[]>([]);

  useEffect(() => {
    if (regua) setSteps(regua);
  }, [regua]);

  const saveRegua = useMutation({
    mutationFn: async () => api.put('/config/regua-contactabilidade', steps),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['regua'] }),
  });

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get<User[]>('/users')).data });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleName>('CS');
  const [supervisorId, setSupervisorId] = useState('');

  const createUser = useMutation({
    mutationFn: async () => api.post('/users', { name, email, password, role, supervisorId: supervisorId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setName('');
      setEmail('');
      setPassword('');
    },
  });

  const supervisors = (users ?? []).filter((u) => u.role === 'SUPERVISOR');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">Régua de contactabilidade e gestão de usuários (somente administrador).</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Régua de Contactabilidade</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          {steps.map((step, idx) => (
            <div key={step.tentativa} className="grid grid-cols-[80px_1fr_2fr] items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Tentativa {step.tentativa}</span>
              <Select
                value={step.canal}
                onChange={(e) => setSteps((s) => s.map((st, i) => (i === idx ? { ...st, canal: e.target.value } : st)))}
              >
                <option value="LIGACAO">Ligação</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">E-mail</option>
                <option value="VISITA">Visita</option>
              </Select>
              <Input value={step.descricao} onChange={(e) => setSteps((s) => s.map((st, i) => (i === idx ? { ...st, descricao: e.target.value } : st)))} />
            </div>
          ))}
          <p className="text-xs text-slate-500">Após a última tentativa sem sucesso, o PDV é marcado automaticamente como "Escalar contato" — sem alterar a classificação estratégica.</p>
          <Button onClick={() => saveRegua.mutate()} disabled={saveRegua.isPending}>
            {saveRegua.isPending ? 'Salvando...' : 'Salvar régua'}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Usuários</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <form
            className="grid grid-cols-2 gap-3 sm:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              createUser.mutate();
            }}
          >
            <Input placeholder="Nome" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Senha" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Select value={role} onChange={(e) => setRole(e.target.value as RoleName)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
            {role === 'CS' ? (
              <Select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
                <option value="">Sem supervisor</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Criando...' : 'Criar usuário'}
              </Button>
            )}
            {role === 'CS' && (
              <Button type="submit" disabled={createUser.isPending} className="col-span-2 sm:col-span-1">
                {createUser.isPending ? 'Criando...' : 'Criar usuário'}
              </Button>
            )}
          </form>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">E-mail</th>
                <th className="px-3 py-2">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(users ?? []).map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2 font-medium text-slate-800">{u.name}</td>
                  <td className="px-3 py-2 text-slate-500">{u.email}</td>
                  <td className="px-3 py-2 text-slate-500">{ROLE_LABELS[u.role]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
