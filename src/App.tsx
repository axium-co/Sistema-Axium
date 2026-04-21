import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CRMProvider } from './contexts/CRMContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import CRMPainel from './pages/crm/Painel';
import CRMLeads from './pages/crm/Leads';
import CRMPipeline from './pages/crm/Pipeline';
import CRMCalendario from './pages/crm/Calendario';
import CRMImportar from './pages/crm/Importar';
import CRMIntegracoes from './pages/crm/Integracoes';
import Financeiro from './pages/financeiro/Index';
import Tarefas from './pages/tarefas/Index';
import Configuracoes from './pages/configuracoes/Index';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Login Route */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/crm/painel" replace /> : <Login onLogin={() => {}} />}
      />

      {/* Protected Routes - CRM */}
      <Route
        path="/crm/painel"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CRMPainel />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crm/leads"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CRMLeads />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crm/pipeline"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CRMPipeline />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crm/calendario"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CRMCalendario />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crm/importar"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CRMImportar />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crm/integracoes"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CRMIntegracoes />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Redirect /crm to /crm/painel */}
      <Route path="/crm" element={<Navigate to="/crm/painel" replace />} />

      {/* Protected Routes - Financeiro */}
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Financeiro />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Tarefas */}
      <Route
        path="/tarefas"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Tarefas />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Configurações */}
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Configuracoes />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Root redirect to login or dashboard based on auth */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/crm/painel' : '/login'} replace />} />

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/crm/painel" replace />} />
    </Routes>
  );
}

import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <CRMProvider>
            <AppRoutes />
          </CRMProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
