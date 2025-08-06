import React from 'react';
import { Clock, User, AlertTriangle } from 'lucide-react';
import { Task } from '../../types';

interface RecentTasksProps {
  tasks: Task[];
}

const RecentTasks: React.FC<RecentTasksProps> = ({ tasks }) => {
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in-progress':
        return 'En Progreso';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const isOverdue = (dueDate: string, status: Task['status']) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        <Clock size={20} className="text-gray-400" />
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </h4>
                  {isOverdue(task.dueDate, task.status) && (
                    <AlertTriangle size={16} className="text-red-500" />
                  )}
                </div>
                
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <User size={12} />
                    <span>{task.assignedUsers?.[0] ? `${task.assignedUsers[0].first_name} ${task.assignedUsers[0].last_name}` : 'Sin asignar'}</span>
                  </div>
                  <span>•</span>
                  <span>Vence: {new Date(task.dueDate).toLocaleDateString('es-ES')}</span>
                  <span>•</span>
                  <span className={getPriorityColor(task.priority)}>
                    Prioridad {task.priority}
                  </span>
                </div>
              </div>
              
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </span>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8">
            <Clock size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay actividad reciente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTasks;