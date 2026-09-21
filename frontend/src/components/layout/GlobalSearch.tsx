import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Paginated, PDV } from '../../types';
import { prioridadeColor } from '../../lib/badges';

export function GlobalSearch() {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const { data } = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: async () => {
      const res = await api.get<Paginated<PDV>>('/pdvs', { params: { search: debounced, pageSize: 8 } });
      return res.data;
    },
    enabled: debounced.trim().length >= 2,
  });

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar por PDV, nome, cidade, telefone, supervisor ou consultor..."
        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {open && debounced.trim().length >= 2 && data && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {data.data.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">Nenhum PDV encontrado.</p>}
          {data.data.map((pdv) => (
            <button
              key={pdv.id}
              onClick={() => {
                setOpen(false);
                setTerm('');
                navigate(`/pdv/${pdv.id}`);
              }}
              className="flex w-full items-center justify-between gap-2 border-b border-slate-50 px-4 py-2.5 text-left text-sm hover:bg-slate-50 last:border-0"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-slate-800">
                  {pdv.codigoPdv} — {pdv.nome}
                </span>
                <span className="block truncate text-xs text-slate-500">{pdv.cidade ?? 'Cidade não informada'}</span>
              </span>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${prioridadeColor(pdv.prioridade)}`}>{pdv.prioridade ?? '—'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
