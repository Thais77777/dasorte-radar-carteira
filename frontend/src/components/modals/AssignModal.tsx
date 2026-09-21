import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Label, Select } from '../ui/Input';
import { PDV, User } from '../../types';

export function AssignModal({ pdv, open, onClose }: { pdv: PDV; open: boolean; onClose: () => void }) {
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get<User[]>('/users')).data, enabled: open });
  const [responsavelId, setResponsavelId] = useState('');
  const [backupId, setBackupId] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    setResponsavelId(pdv.assignments?.[0]?.responsavel?.id ?? '');
    setBackupId(pdv.assignments?.[0]?.backup?.id ?? '');
  }, [pdv]);

  const mutation = useMutation({
    mutationFn: async () => api.post(`/pdvs/${pdv.id}/assign`, { responsavelId: responsavelId || null, backupId: backupId || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdv', pdv.id] });
      queryClient.invalidateQueries({ queryKey: ['pdv-timeline', pdv.id] });
      queryClient.invalidateQueries({ queryKey: ['pdvs'] });
      onClose();
    },
  });

  const csUsers = (users ?? []).filter((u) => ['CS', 'SUPERVISOR', 'GESTOR', 'ADMIN'].includes(u.role));

  return (
    <Modal open={open} onClose={onClose} title="Atribuir / Transferir PDV">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <Label>Responsável principal</Label>
          <Select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
            <option value="">Sem responsável</option>
            {csUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Backup</Label>
          <Select value={backupId} onChange={(e) => setBackupId(e.target.value)}>
            <option value="">Sem backup</option>
            {csUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-xs text-slate-500">A transferência preserva todo o histórico do PDV e é registrada na timeline.</p>
        {mutation.isError && <p className="text-sm text-red-600">Não foi possível atualizar a atribuição.</p>}
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
