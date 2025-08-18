import React from 'react';
import { CheckSquare, Clock, AlertTriangle, TrendingUp, DollarSign, Users, FileText } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';
import { useFinance } from '../../contexts/FinanceContext';
import StatCard from './StatCard';
import TaskChart from './TaskChart';
import RecentTasks from './RecentTasks';
import FinanceStats from './FinanceStats';
import RecentFinanceActivity from './RecentFinanceActivity';
import DashboardAlerts from './DashboardAlerts';


const AdminDashboard: React.FC = () => {
  const { taskStats, tasks } = useTask();
  const { financeStats } = useFinance();

  const recentTasks = tasks
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen general del estado de las tareas, finanzas y control operativo</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <p className="text-blue-800 font-medium">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Resumen Ejecutivo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Users size={16} className="text-blue-600" />
                <span className="text-blue-800">
                  <span className="font-semibold">{financeStats.totalClients}</span> clientes activos
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign size={16} className="text-green-600" />
                                   <span className="text-green-800">
                     <span className="font-semibold">
                       {financeStats.totalRevenue && !isNaN(financeStats.totalRevenue) && financeStats.totalRevenue > 0 
                         ? 'S/ ' + financeStats.totalRevenue.toLocaleString() 
                         : 'S/ 0'}
                     </span> ingresos totales
                   </span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText size={16} className="text-indigo-600" />
                <span className="text-indigo-800">
                  <span className="font-semibold">{financeStats.monthlyDeclarations}</span> declaraciones registradas
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-600 text-sm font-medium">Año Fiscal {new Date().getFullYear()}</p>
            <p className="text-blue-500 text-xs">Estado actualizado</p>
          </div>
        </div>
      </div>



      {/* Estadísticas de Tareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Tareas"
          value={taskStats.total}
          icon={CheckSquare}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="En Progreso"
          value={taskStats.inProgress}
          icon={Clock}
          color="yellow"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Completadas"
          value={taskStats.completed}
          icon={TrendingUp}
          color="green"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Atrasadas"
          value={taskStats.overdue}
          icon={AlertTriangle}
          color="red"
          trend={{ value: -5, isPositive: false }}
        />
      </div>

      {/* Estadísticas Financieras */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Finanzas y Control Operativo</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <DollarSign size={16} />
            <span>Resumen del año {new Date().getFullYear()}</span>
          </div>
        </div>
        <FinanceStats />
        
        {/* Alertas Importantes */}
        <DashboardAlerts />
      </div>

      {/* Gráficos y Actividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskChart taskStats={taskStats} />
        <RecentTasks tasks={recentTasks} />
      </div>

      {/* Actividades Financieras Recientes */}
      <div className="grid grid-cols-1 gap-6">
        <RecentFinanceActivity />
      </div>
    </div>
  );
};

export default AdminDashboard;