import React from 'react';
import { CheckSquare, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';
import StatCard from './StatCard';
import TaskChart from './TaskChart';
import RecentTasks from './RecentTasks';

const AdminDashboard: React.FC = () => {
  const { taskStats, tasks } = useTask();

  const recentTasks = tasks
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen general del estado de las tareas</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskChart taskStats={taskStats} />
        <RecentTasks tasks={recentTasks} />
      </div>
    </div>
  );
};

export default AdminDashboard;