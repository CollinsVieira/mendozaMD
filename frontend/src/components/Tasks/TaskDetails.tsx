import React from 'react';
import { X, User, Calendar, Flag, FileText, Upload, Clock, CheckCircle, Download } from 'lucide-react';
import { Task } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onClose }) => {
  const { user } = useAuth();
  const { updateTaskStatus, addEvidence, downloadEvidence } = useTask();

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

  const handleStatusChange = (newStatus: Task['status']) => {
    updateTaskStatus(task.id, newStatus);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      try {
        await addEvidence(task.id, file);
        // Limpiar el input
        e.target.value = '';
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const isAssignedToUser = task.assignedTo.includes(user?.id || '');
  const canUpdateStatus = user?.role === 'admin' || isAssignedToUser;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (evidenceId: string, fileName: string) => {
    try {
      await downloadEvidence(task.id, evidenceId, fileName);
    } catch (error) {
      console.error('Error downloading evidence:', error);
    }
  };

  const isOverdue = (dueDate: string, status: Task['status']) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(task.status)}`}>
              {getStatusText(task.status)}
            </span>
            {isOverdue(task.dueDate, task.status) && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                ATRASADA
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
                <p className="text-gray-700 leading-relaxed">{task.description}</p>
              </div>

              {/* Status Actions */}
              {canUpdateStatus && task.status !== 'completed' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Actualizar Estado</h3>
                  <div className="flex space-x-3">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange('in-progress')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                      >
                        <Clock size={16} />
                        <span>Iniciar Trabajo</span>
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button
                        onClick={() => handleStatusChange('completed')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                      >
                        <CheckCircle size={16} />
                        <span>Marcar como Completada</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* File Upload */}
              {canUpdateStatus && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Subir Archivo</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Arrastra archivos aquí o haz clic para seleccionar</p>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="file-upload"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200"
                    >
                      Seleccionar Archivo
                    </label>
                  </div>
                </div>
              )}

              {/* Evidence Files */}
              {task.evidences && task.evidences.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Evidencias</h3>
                  <div className="space-y-3">
                    {task.evidences?.map((evidence) => (
                      <div key={evidence.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <FileText size={20} className="text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{evidence.fileName}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(evidence.fileSize)} • Subido el {new Date(evidence.uploadedAt).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={() => handleDownload(evidence.id, evidence.fileName)}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            <Download size={16} />
                            <span>Descargar</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Task Details Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Asignado a</p>
                      <p className="text-sm text-gray-600">
                        {task.assignedUsers?.map(u => `${u.first_name} ${u.last_name}`).join(', ') || 'Sin asignar'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Fecha límite</p>
                      <p className="text-sm text-gray-600">
                        {new Date(task.dueDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Flag size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Prioridad</p>
                      <p className={`text-sm font-medium capitalize ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Creado</p>
                      <p className="text-sm text-gray-600">
                        {new Date(task.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Log */}
              {task.auditLog && task.auditLog.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Cambios</h3>
                  <div className="space-y-3">
                    {task.auditLog.map((entry) => (
                    <div key={entry.id} className="text-sm">
                      <p className="font-medium text-gray-900">{entry.action}</p>
                      <p className="text-gray-600">{entry.details}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {entry.userName} • {new Date(entry.timestamp).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;