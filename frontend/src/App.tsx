import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MinhaCarteira from './pages/MinhaCarteira';
import MinhasAcoes from './pages/MinhasAcoes';
import PDVs from './pages/PDVs';
import PDVProfile from './pages/PDVProfile';
import Retencao from './pages/Retencao';
import Sellout from './pages/Sellout';
import Contactabilidade from './pages/Contactabilidade';
import Tarefas from './pages/Tarefas';
import Equipe from './pages/Equipe';
import Inteligencia from './pages/Inteligencia';
import Financeiro from './pages/Financeiro';
import ImportarBase from './pages/ImportarBase';
import Historico from './pages/Historico';
import Configuracoes from './pages/Configuracoes';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/minha-carteira" element={<ProtectedRoute roles={['CS']}><MinhaCarteira /></ProtectedRoute>} />
        <Route path="/minhas-acoes" element={<MinhasAcoes />} />
        <Route path="/pdvs" element={<PDVs />} />
        <Route path="/pdv/:id" element={<PDVProfile />} />
        <Route path="/retencao" element={<Retencao />} />
        <Route path="/sellout" element={<Sellout />} />
        <Route path="/contactabilidade" element={<Contactabilidade />} />
        <Route path="/tarefas" element={<Tarefas />} />
        <Route path="/equipe" element={<ProtectedRoute roles={['ADMIN', 'GESTOR', 'SUPERVISOR']}><Equipe /></ProtectedRoute>} />
        <Route path="/inteligencia" element={<ProtectedRoute roles={['ADMIN', 'GESTOR', 'ANALISTA_DADOS']}><Inteligencia /></ProtectedRoute>} />
        <Route path="/financeiro" element={<ProtectedRoute roles={['ADMIN', 'GESTOR', 'ANALISTA_FINANCEIRO']}><Financeiro /></ProtectedRoute>} />
        <Route path="/importar" element={<ProtectedRoute roles={['ADMIN', 'GESTOR']}><ImportarBase /></ProtectedRoute>} />
        <Route path="/historico" element={<ProtectedRoute roles={['ADMIN', 'GESTOR']}><Historico /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute roles={['ADMIN']}><Configuracoes /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
