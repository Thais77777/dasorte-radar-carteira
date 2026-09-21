import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Label, Select } from '../ui/Input';

const CANAIS = [
  { value: 'LIGACAO', label: 'Ligação' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'VISITA', label: 'Visita' },
  { value: 'OUTRO', label: 'Outro' },
];

const RESULTADOS = [
  { value: 'CONTATO_REALIZADO', label: 'Contato realizado' },
  { value: 'SEM_RESPOSTA', label: 'Sem resposta' },
  { value: 'NUMERO_INVALIDO', label: 'Número inválido' },
  { value: 'WHATSAPP_NAO_ENTREGUE', label: 'WhatsApp não entregue' },
  { value: 'RETORNO_SOLICITADO', label: 'Retorno solicitado' },
  { value: 'CONTATO_RECUPERADO', label: 'Contato recuperado' },
];

export function RegisterContactModal({ pdvId, open, onClose }: { pdvId: string; open: boolean; onClose: () => void }) {
  const [canal, setCanal] = useState('LIGACAO');
  const [resultado, setResultado] = useState('CONTATO_REALIZADO');
  const [observacao, setObservacao] = useState('');
  const [proximaAcao, setProximaAcao] = useState('');
  const [proximaAcaoData, setProximaAcaoData] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () =>
      api.post('/contacts', {
        pdvId,
        canal,
        resultado,
        observacao: observacao || undefined,
        proximaAcao: proximaAcao || undefined,
        proximaAcaoData: proximaAcaoData ? new Date(proximaAcaoData).toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdv', pdvId] });
      queryClient.invalidateQueries({ queryKey: ['pdv-timeline', pdvId] });
      queryClient.invalidateQueries({ queryKey: ['pdv-contacts', pdvId] });
      queryClient.invalidateQueries({ queryKey: ['pdvs'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setObservacao('');
      setProximaAcao('');
      setProximaAcaoData('');
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Registrar Contato">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <Label>Canal</Label>
          <Select value={canal} onChange={(e) => setCanal(e.target.value)}>
            {CANAIS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Resultado</Label>
          <Select value={resultado} onChange={(e) => setResultado(e.target.value)}>
            {RESULTADOS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Observação</Label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            rows={3}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Próxima ação</Label>
            <Input value={proximaAcao} onChange={(e) => setProximaAcao(e.target.value)} placeholder="Ex: Ligar novamente" />
          </div>
          <div>
            <Label>Data da próxima ação</Label>
            <Input type="date" value={proximaAcaoData} onChange={(e) => setProximaAcaoData(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-slate-500">Se preencher a próxima ação com data, uma tarefa será criada automaticamente para você.</p>
        {mutation.isError && <p className="text-sm text-red-600">Não foi possível registrar o contato. Tente novamente.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
