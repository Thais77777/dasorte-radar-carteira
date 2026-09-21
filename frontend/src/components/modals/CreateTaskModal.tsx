import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Label, Select } from '../ui/Input';

const TIPOS = ['LIGACAO', 'WHATSAPP', 'EMAIL', 'VISITA', 'TREINAMENTO', 'CAMPANHA', 'OUTRO'];

export function CreateTaskModal({ pdvId, open, onClose }: { pdvId: string; open: boolean; onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('OUTRO');
  const [prazo, setPrazo] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () =>
      api.post('/tasks', { pdvId, titulo, descricao: descricao || undefined, tipo, prazo: prazo ? new Date(prazo).toISOString() : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdv', pdvId] });
      queryClient.invalidateQueries({ queryKey: ['pdv-timeline', pdvId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-summary'] });
      setTitulo('');
      setDescricao('');
      setPrazo('');
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Criar Tarefa">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <Label>Título</Label>
          <Input required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Visitar PDV para treinamento" />
        </div>
        <div>
          <Label>Descrição</Label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Prazo</Label>
            <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
          </div>
        </div>
        {mutation.isError && <p className="text-sm text-red-600">Não foi possível criar a tarefa.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Criar tarefa'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
