import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PDV } from '../../types';
import { Badge } from '../ui/Badge';
import { prioridadeColor, retencaoColor, valorColor, contactColor, contactLabel } from '../../lib/badges';
import { formatCurrency, formatNumber, telHref, whatsappHref } from '../../lib/format';
import { RegisterContactModal } from '../modals/RegisterContactModal';
import { CreateTaskModal } from '../modals/CreateTaskModal';

export function PdvQueueTable({ pdvs, emptyMessage }: { pdvs: PDV[]; emptyMessage?: string }) {
  const [contactPdv, setContactPdv] = useState<string | null>(null);
  const [taskPdv, setTaskPdv] = useState<string | null>(null);

  if (pdvs.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-slate-500">{emptyMessage ?? 'Nenhum PDV encontrado.'}</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">PDV</th>
              <th className="px-4 py-2.5">Nome</th>
              <th className="px-4 py-2.5">Cidade</th>
              <th className="px-4 py-2.5">Prioridade</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Valor</th>
              <th className="px-4 py-2.5">Sellout</th>
              <th className="px-4 py-2.5">Dias s/ transação</th>
              <th className="px-4 py-2.5">Contactabilidade</th>
              <th className="px-4 py-2.5">Próxima ação</th>
              <th className="px-4 py-2.5">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pdvs.map((pdv) => {
              const tel = telHref(pdv.telefone);
              const wa = whatsappHref(pdv.telefone);
              return (
                <tr key={pdv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    <Link to={`/pdv/${pdv.id}`} className="hover:text-brand-600 hover:underline">
                      {pdv.codigoPdv}
                    </Link>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-2.5">{pdv.nome}</td>
                  <td className="px-4 py-2.5 text-slate-500">{pdv.cidade ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <Badge className={prioridadeColor(pdv.prioridade)}>{pdv.prioridade ?? '—'}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge className={retencaoColor(pdv.statusRetencao)}>{pdv.statusRetencao ?? '—'}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge className={valorColor(pdv.valor)}>{pdv.valor ?? '—'}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{formatCurrency(pdv.selloutTotal)}</td>
                  <td className="px-4 py-2.5 text-slate-700">{formatNumber(pdv.diasSemTransacao)}</td>
                  <td className="px-4 py-2.5">
                    <Badge className={contactColor(pdv.contactability?.status)}>{contactLabel(pdv.contactability?.status)}</Badge>
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-2.5 text-slate-500">{pdv.contactability?.proximaAcao ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2 text-base">
                      <a href={tel ?? undefined} title="Ligar" className={tel ? 'hover:opacity-70' : 'pointer-events-none opacity-30'}>
                        📞
                      </a>
                      <a href={wa ?? undefined} target="_blank" rel="noreferrer" title="WhatsApp" className={wa ? 'hover:opacity-70' : 'pointer-events-none opacity-30'}>
                        💬
                      </a>
                      <button title="Registrar contato" onClick={() => setContactPdv(pdv.id)} className="hover:opacity-70">
                        📝
                      </button>
                      <button title="Criar tarefa" onClick={() => setTaskPdv(pdv.id)} className="hover:opacity-70">
                        📅
                      </button>
                      <Link to={`/pdv/${pdv.id}`} title="Abrir PDV" className="hover:opacity-70">
                        👤
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {contactPdv && <RegisterContactModal pdvId={contactPdv} open onClose={() => setContactPdv(null)} />}
      {taskPdv && <CreateTaskModal pdvId={taskPdv} open onClose={() => setTaskPdv(null)} />}
    </>
  );
}
