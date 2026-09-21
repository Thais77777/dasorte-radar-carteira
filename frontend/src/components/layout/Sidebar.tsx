import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { RoleName } from '../../types';

interface NavItem {
  to: string;
  label: string;
  roles?: RoleName[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/minha-carteira', label: 'Minha Carteira', roles: ['CS'] },
  { to: '/minhas-acoes', label: 'Minhas Ações' },
  { to: '/pdvs', label: 'PDVs' },
  { to: '/retencao', label: 'Retenção' },
  { to: '/sellout', label: 'Sellout' },
  { to: '/contactabilidade', label: 'Contactabilidade' },
  { to: '/tarefas', label: 'Tarefas' },
  { to: '/equipe', label: 'Equipe', roles: ['ADMIN', 'GESTOR', 'SUPERVISOR'] },
  { to: '/inteligencia', label: 'Inteligência & Performance', roles: ['ADMIN', 'GESTOR', 'ANALISTA_DADOS'] },
  { to: '/financeiro', label: 'Financeiro', roles: ['ADMIN', 'GESTOR', 'ANALISTA_FINANCEIRO'] },
  { to: '/importar', label: 'Importar Base', roles: ['ADMIN', 'GESTOR'] },
  { to: '/historico', label: 'Histórico', roles: ['ADMIN', 'GESTOR'] },
  { to: '/configuracoes', label: 'Configurações', roles: ['ADMIN'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">DS</div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">Dá Sorte</p>
          <p className="text-xs leading-tight text-slate-500">CRM Sucesso do Cliente</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'block rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-4 py-4">
        <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
        <p className="truncate text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
        <button onClick={logout} className="mt-2 text-xs font-medium text-slate-500 hover:text-red-600">
          Sair
        </button>
      </div>
    </aside>
  );
}

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  SUPERVISOR: 'Supervisor',
  CS: 'CS / Farmer',
  ANALISTA_DADOS: 'Analista de Dados',
  ANALISTA_FINANCEIRO: 'Analista Financeiro',
};
