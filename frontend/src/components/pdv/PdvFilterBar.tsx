import { Input, Select, Label } from '../ui/Input';
import { Button } from '../ui/Button';

export interface PdvFilters {
  search?: string;
  prioridade?: string;
  statusRetencao?: string;
  valor?: string;
  maturidade?: string;
  cidade?: string;
  canal?: string;
  adimplencia?: string;
  contactabilidade?: string;
  semTelefone?: string;
}

const PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa', 'Monitorar'];
const STATUS = ['Saudável', 'Tendência', 'Risco', 'Churn'];
const VALORES = ['Alto', 'Médio', 'Baixo'];
const MATURIDADES = ['Novo', 'Médio', 'Antigo'];
const CONTACT_STATUS = [
  { value: 'SEM_TELEFONE', label: 'Sem telefone' },
  { value: 'NUNCA_CONTATADO', label: 'Nunca contatado' },
  { value: 'AGUARDANDO_RESPOSTA', label: 'Aguardando resposta' },
  { value: 'SEM_RESPOSTA', label: 'Sem resposta' },
  { value: 'CONTATO_REALIZADO', label: 'Contato realizado' },
  { value: 'CONTATO_RECUPERADO', label: 'Contato recuperado' },
  { value: 'CONTATO_INVALIDO', label: 'Contato inválido' },
  { value: 'ESCALAR_CONTATO', label: 'Escalar contato' },
];

export function PdvFilterBar({ filters, onChange }: { filters: PdvFilters; onChange: (f: PdvFilters) => void }) {
  function set(key: keyof PdvFilters, value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div>
        <Label>Busca</Label>
        <Input placeholder="PDV, nome, cidade..." value={filters.search ?? ''} onChange={(e) => set('search', e.target.value)} />
      </div>
      <div>
        <Label>Prioridade</Label>
        <Select value={filters.prioridade ?? ''} onChange={(e) => set('prioridade', e.target.value)}>
          <option value="">Todas</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Status de Retenção</Label>
        <Select value={filters.statusRetencao ?? ''} onChange={(e) => set('statusRetencao', e.target.value)}>
          <option value="">Todos</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Valor</Label>
        <Select value={filters.valor ?? ''} onChange={(e) => set('valor', e.target.value)}>
          <option value="">Todos</option>
          {VALORES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Maturidade</Label>
        <Select value={filters.maturidade ?? ''} onChange={(e) => set('maturidade', e.target.value)}>
          <option value="">Todas</option>
          {MATURIDADES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Cidade</Label>
        <Input placeholder="Cidade" value={filters.cidade ?? ''} onChange={(e) => set('cidade', e.target.value)} />
      </div>
      <div>
        <Label>Contactabilidade</Label>
        <Select value={filters.contactabilidade ?? ''} onChange={(e) => set('contactabilidade', e.target.value)}>
          <option value="">Todas</option>
          {CONTACT_STATUS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Adimplência</Label>
        <Select value={filters.adimplencia ?? ''} onChange={(e) => set('adimplencia', e.target.value)}>
          <option value="">Todas</option>
          <option value="Adimplente">Adimplente</option>
          <option value="Inadimplente">Inadimplente</option>
        </Select>
      </div>
      <div className="flex items-end">
        <Button variant="secondary" className="w-full" onClick={() => onChange({})}>
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
