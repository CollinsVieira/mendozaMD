import React, { useState } from 'react';
import { Search, Filter, Upload, CheckCircle, Clock, Calendar, Flag, FileText } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { Task } from '../../types';
import TaskDetails from './TaskDetails';
import taskService from '../../services/taskService';

const WorkerTaskView: React.FC = () => {
  const { getUserTasks, updateTaskStatus, addEvidence } = useTask();
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');

  const userTasks = getUserTasks(user?.id || '');

  const filteredTasks = userTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    updateTaskStatus(taskId, newStatus);
  };

  const handleFileUpload = async (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Subir archivo real
      try {
        await addEvidence(taskId, file);
        // Limpiar el input después de la subida exitosa
        e.target.value = '';
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const handleViewTask = async (task: Task) => {
    try {
      // Cargar detalles completos de la tarea (incluyendo evidencias)
      const fullTask = await taskService.getTask(task.id);
      setSelectedTask(fullTask);
      setShowTaskDetails(true);
    } catch (error) {
      console.error('Error loading task details:', error);
      // Fallback: usar la tarea de la lista si falla la carga de detalles
      setSelectedTask(task);
      setShowTaskDetails(true);
    }
  };

  const isOverdue = (dueDate: string, status: Task['status']) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  // Task statistics
  const taskStats = {
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    inProgress: filteredTasks.filter(t => t.status === 'in-progress').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    overdue: filteredTasks.filter(t => isOverdue(t.dueDate, t.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Tareas</h1>
          <p className="text-gray-600 mt-1">Gestiona tus tareas asignadas y actualiza su progreso</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <p className="text-blue-800 font-medium">
            {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''} asignada{filteredTasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-800 text-sm font-medium">Pendientes</p>
              <p className="text-yellow-900 text-2xl font-bold">{taskStats.pending}</p>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 text-sm font-medium">En Progreso</p>
              <p className="text-blue-900 text-2xl font-bold">{taskStats.inProgress}</p>
            </div>
            <Clock className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 text-sm font-medium">Completadas</p>
              <p className="text-green-900 text-2xl font-bold">{taskStats.completed}</p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-800 text-sm font-medium">Atrasadas</p>
              <p className="text-red-900 text-2xl font-bold">{taskStats.overdue}</p>
            </div>
            <Flag className="text-red-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | Task['status'])}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="in-progress">En Progreso</option>
            <option value="completed">Completada</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter size={16} className="mr-2" />
            {filteredTasks.length} de {userTasks.length} tareas
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3
                      className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-200"
                      onClick={() => handleViewTask(task)}
                    >
                      {task.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                    {isOverdue(task.dueDate, task.status) && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                        ATRASADA
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{task.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>Vence: {new Date(task.dueDate).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Flag size={14} />
                      <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                        Prioridad {task.priority}
                      </span>
                    </div>
                    {task.evidences && task.evidences.length > 0 && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <FileText size={14} />
                        <span>{task.evidences.length} archivo(s)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'in-progress')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Clock size={14} />
                      <span>Iniciar</span>
                    </button>
                  )}
                  
                  {task.status === 'in-progress' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'completed')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                    >
                      <CheckCircle size={14} />
                      <span>Completar</span>
                    </button>
                  )}
                </div>

                {task.status !== 'completed' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(task.id, e)}
                      className="hidden"
                      id={`file-upload-${task.id}`}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor={`file-upload-${task.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Upload size={14} />
                      <span>Subir Archivo</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Clock size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes tareas asignadas</h3>
          <p className="text-gray-600">Las nuevas tareas aparecerán aquí cuando sean asignadas.</p>
        </div>
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => {
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkerTaskView;