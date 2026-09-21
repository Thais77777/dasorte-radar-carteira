import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { PDV, Paginated, TimelineEvent, Task } from '../types';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { prioridadeColor, retencaoColor, valorColor, contactColor, contactLabel } from '../lib/badges';
import { formatCurrency, formatDate, formatDateTime, formatNumber, telHref, whatsappHref } from '../lib/format';
import { TIMELINE_ICONS, TIMELINE_LABELS } from '../lib/timelineLabels';
import { RegisterContactModal } from '../components/modals/RegisterContactModal';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';
import { AssignModal } from '../components/modals/AssignModal';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value ?? '—'}</dd>
    </div>
  );
}

export default function PDVProfile() {
  const { id } = useParams<{ id: string }>();
  const [contactOpen, setContactOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: pdv, isLoading } = useQuery({
    queryKey: ['pdv', id],
    queryFn: async () => (await api.get<PDV>(`/pdvs/${id}`)).data,
    enabled: !!id,
  });

  const { data: timeline } = useQuery({
    queryKey: ['pdv-timeline', id],
    queryFn: async () => (await api.get<Paginated<TimelineEvent>>(`/pdvs/${id}/timeline`, { params: { pageSize: 30 } })).data,
    enabled: !!id,
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => api.put(`/tasks/${taskId}`, { status: 'CONCLUIDA' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdv', id] });
      queryClient.invalidateQueries({ queryKey: ['pdv-timeline', id] });
    },
  });

  if (isLoading || !pdv) {
    return <p className="text-sm text-slate-500">Carregando PDV...</p>;
  }

  const tel = telHref(pdv.telefone);
  const wa = whatsappHref(pdv.telefone);
  const assignment = pdv.assignments?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/pdvs" className="text-xs text-slate-500 hover:text-brand-600">
            ← Voltar para PDVs
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {pdv.codigoPdv} — {pdv.nome}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className={prioridadeColor(pdv.prioridade)}>Prioridade: {pdv.prioridade ?? '—'}</Badge>
            <Badge className={retencaoColor(pdv.statusRetencao)}>Status: {pdv.statusRetencao ?? '—'}</Badge>
            <Badge className={valorColor(pdv.valor)}>Valor: {pdv.valor ?? '—'}</Badge>
            <Badge className={contactColor(pdv.contactability?.status)}>{contactLabel(pdv.contactability?.status)}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={tel ?? undefined}>
            <Button variant="secondary" disabled={!tel}>📞 Ligar</Button>
          </a>
          <a href={wa ?? undefined} target="_blank" rel="noreferrer">
            <Button variant="secondary" disabled={!wa}>💬 WhatsApp</Button>
          </a>
          <Button onClick={() => setContactOpen(true)}>📝 Registrar Contato</Button>
          <Button variant="secondary" onClick={() => setTaskOpen(true)}>📅 Criar Tarefa</Button>
          <Button variant="secondary" onClick={() => setAssignOpen(true)}>👤 Atribuir</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="PDV" value={pdv.codigoPdv} />
            <Field label="Nome" value={pdv.nome} />
            <Field label="Cidade" value={pdv.cidade} />
            <Field label="Telefone" value={pdv.telefone ?? 'Sem telefone cadastrado'} />
            <Field label="Canal" value={pdv.canal} />
            <Field label="Modalidade" value={pdv.modalidade} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Responsabilidade</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Supervisor (planilha)" value={pdv.supervisorPlanilha} />
            <Field label="Consultor (planilha)" value={pdv.consultorPlanilha} />
            <Field label="Responsável CRM" value={assignment?.responsavel?.name} />
            <Field label="Backup" value={assignment?.backup?.name} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Classificação (importada da base)</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Prioridade" value={pdv.prioridade} />
            <Field label="Status de Retenção" value={pdv.statusRetencao} />
            <Field label="Maturidade" value={pdv.maturidade} />
            <Field label="Valor" value={pdv.valor} />
            <Field label="Segmento" value={pdv.segmento} />
            <Field label="Status Vendas" value={pdv.statusVendas} />
            <Field label="Adimplência" value={pdv.adimplencia} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Performance</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Sellout Total" value={formatCurrency(pdv.selloutTotal)} />
            <Field label="Sellout Médio Mensal" value={formatCurrency(pdv.selloutMedioMensal)} />
            <Field label="Estoque" value={formatNumber(pdv.estoque)} />
            <Field label="Dias com Movimento" value={formatNumber(pdv.diasComMovimento)} />
            <Field label="Total Pacotes Raspadinha" value={formatNumber(pdv.totalPacotesRaspadinha)} />
            <Field label="Total Vendas Raspadinha" value={formatNumber(pdv.totalVendasRaspadinha)} />
            <Field label="Meses de Base" value={formatNumber(pdv.mesesDeBase)} />
            <Field label="Data Ativação" value={formatDate(pdv.dataAtivacao)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Transações</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Última Transação" value={formatDate(pdv.ultimaTransacao)} />
            <Field label="Dias sem Transação" value={formatNumber(pdv.diasSemTransacao)} />
            <Field label="Última Venda Raspadinha" value={`${formatDate(pdv.dataUltimaVendaRaspadinha)} — ${formatCurrency(pdv.valorUltimaVendaRaspadinha)}`} />
            <Field label="Última Compra Raspadinha" value={`${formatDate(pdv.dataUltimaCompraRaspadinha)} — ${formatCurrency(pdv.valorUltimaCompraRaspadinha)}`} />
            <Field label="Última Venda Trem das 11" value={`${formatDate(pdv.dataUltimaVendaTrem)} — ${formatCurrency(pdv.valorUltimaVendaTrem)}`} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Relacionamento</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Contactabilidade" value={contactLabel(pdv.contactability?.status)} />
            <Field label="Último contato" value={formatDateTime(pdv.contactability?.ultimoContato)} />
            <Field label="Tentativas" value={pdv.contactability?.numeroTentativas ?? 0} />
            <Field label="Último canal" value={pdv.contactability?.ultimoCanal} />
            <Field label="Próxima ação" value={pdv.contactability?.proximaAcao} />
            <Field label="Data próxima ação" value={formatDate(pdv.contactability?.proximaAcaoData)} />
          </CardBody>
        </Card>
      </div>

      {pdv.tasks && pdv.tasks.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Tarefas pendentes</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            {pdv.tasks.map((task: Task) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{task.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {task.tipo} · Prazo: {formatDate(task.prazo)} · Responsável: {task.responsavel?.name}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => completeTask.mutate(task.id)}>
                  Concluir
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          {timeline?.data.length === 0 && <p className="text-sm text-slate-500">Nenhum evento registrado ainda.</p>}
          {timeline?.data.map((event) => (
            <div key={event.id} className="flex gap-3 border-b border-slate-50 pb-3 last:border-0">
              <span className="text-lg">{TIMELINE_ICONS[event.tipo] ?? '•'}</span>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {TIMELINE_LABELS[event.tipo] ?? event.tipo}
                  {event.usuario && <span className="font-normal text-slate-500"> — {event.usuario.name}</span>}
                </p>
                <p className="text-sm text-slate-600">{event.descricao}</p>
                <p className="text-xs text-slate-400">{formatDateTime(event.createdAt)}</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <RegisterContactModal pdvId={pdv.id} open={contactOpen} onClose={() => setContactOpen(false)} />
      <CreateTaskModal pdvId={pdv.id} open={taskOpen} onClose={() => setTaskOpen(false)} />
      <AssignModal pdv={pdv} open={assignOpen} onClose={() => setAssignOpen(false)} />
    </div>
  );
}
