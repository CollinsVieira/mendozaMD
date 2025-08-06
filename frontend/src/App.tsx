import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import TaskList from './components/Tasks/TaskList';
import WorkerTaskView from './components/Tasks/WorkerTaskView';
import UserManagement from './components/Users/UserManagement';
import ReportsView from './components/Reports/ReportsView';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    if (user.role === 'admin') {
      switch (currentView) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'tasks':
          return <TaskList />;
        case 'users':
          return <UserManagement />;
        case 'reports':
          return <ReportsView />;
        default:
          return <AdminDashboard />;
      }
    } else {
      switch (currentView) {
        case 'my-tasks':
          return <WorkerTaskView />;
        case 'profile':
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
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                    <p className="text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500 capitalize">Rol: {user.role}</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  Funcionalidad de edición de perfil pendiente de implementación.
                </p>
              </div>
            </div>
          );
        default:
          return <WorkerTaskView />;
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <MainApp />
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;