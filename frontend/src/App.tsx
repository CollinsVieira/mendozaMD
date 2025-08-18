import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { FinanceProvider } from './contexts/FinanceContext';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import TaskList from './components/Tasks/TaskList';
import WorkerTaskView from './components/Tasks/WorkerTaskView';
import UserManagement from './components/Users/UserManagement';
import ReportsView from './components/Reports/ReportsView';
import ClientList from './components/Client/ClientList';
import ClientDetails from './components/Client/ClientDetails';
import ClientFinance from './components/Client/ClientFinance';
import ClientOperational from './components/Client/ClientOperational';

const ProfileView: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Gestiona tu información personal</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xl font-medium text-gray-700">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">Rol: {user?.role}</p>
          </div>
        </div>
        <p className="text-gray-600">
          Funcionalidad de edición de perfil pendiente de implementación.
        </p>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-8">
          <Routes>
            {user.role === 'admin' ? (
              <>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/tasks" element={<TaskList />} />
                <Route path="/clients" element={<ClientList />} />
                <Route path="/clients/:id" element={<ClientDetails />} />
                <Route path="/clients/:id/finance" element={<ClientFinance />} />
                <Route path="/clients/:id/operational" element={<ClientOperational />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/reports" element={<ReportsView />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Navigate to="/my-tasks" replace />} />
                <Route path="/my-tasks" element={<WorkerTaskView />} />
                <Route path="/clients" element={<ClientList />} />
                <Route path="/clients/:id" element={<ClientDetails />} />
                <Route path="/clients/:id/finance" element={<ClientFinance />} />
                <Route path="/clients/:id/operational" element={<ClientOperational />} />
                <Route path="/profile" element={<ProfileView />} />
                <Route path="*" element={<Navigate to="/my-tasks" replace />} />
              </>
            )}
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TaskProvider>
          <FinanceProvider>
            <MainApp />
          </FinanceProvider>
        </TaskProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;