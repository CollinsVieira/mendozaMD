import React, { useState } from 'react';
import { Download, Calendar, Filter, FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';

const ReportsView: React.FC = () => {
  const { tasks, taskStats } = useTask();
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportType, setReportType] = useState<'tasks' | 'productivity' | 'users'>('tasks');

  // Mock export functions
  const exportToPDF = () => {
    alert('Exportando reporte a PDF... (Funcionalidad demo)');
  };

  const exportToExcel = () => {
    alert('Exportando reporte a Excel... (Funcionalidad demo)');
  };

  // Calculate productivity metrics
  const completionRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total * 100).toFixed(1) : '0';
  const overDueRate = taskStats.total > 0 ? (taskStats.overdue / taskStats.total * 100).toFixed(1) : '0';

  // Get tasks by month for trend analysis
  const getTasksByMonth = () => {
    const months = {};
    tasks.forEach(task => {
      const month = new Date(task.createdAt).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short' 
      });
      months[month] = (months[month] || 0) + 1;
    });
    return months;
  };

  const tasksByMonth = getTasksByMonth();

  // Get user performance data
  const getUserPerformance = () => {
    const performance = {};
    tasks.forEach(task => {
      task.assignedUsers?.forEach(user => {
        if (!performance[user.name]) {
          performance[user.name] = {
            total: 0,
            completed: 0,
            pending: 0,
            inProgress: 0
          };
        }
        performance[user.name].total++;
        performance[user.name][task.status === 'in-progress' ? 'inProgress' : task.status]++;
      });
    });
    return performance;
  };

  const userPerformance = getUserPerformance();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600 mt-1">Genere reportes detallados y análisis de productividad</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Download size={20} />
            <span>PDF</span>
          </button>
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Download size={20} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Report Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Reporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'tasks' | 'productivity' | 'users')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tasks">Reporte de Tareas</option>
              <option value="productivity">Análisis de Productividad</option>
              <option value="users">Rendimiento por Usuario</option>
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200">
              <Filter size={20} />
              <span>Aplicar Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Finalización</p>
              <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tareas Atrasadas</p>
              <p className="text-3xl font-bold text-red-600">{overDueRate}%</p>
            </div>
            <BarChart3 className="text-red-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Promedio Mensual</p>
              <p className="text-3xl font-bold text-blue-600">
                {Object.keys(tasksByMonth).length > 0 
                  ? Math.round(Object.values(tasksByMonth).reduce((a, b) => a + b, 0) / Object.keys(tasksByMonth).length)
                  : 0}
              </p>
            </div>
            <PieChart className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Tareas</p>
              <p className="text-3xl font-bold text-gray-900">{taskStats.total}</p>
            </div>
            <FileText className="text-gray-600" size={32} />
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'tasks' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Reporte Detallado de Tareas</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tarea</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Asignado a</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Prioridad</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha Límite</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Evidencias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{task.title}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status === 'completed' ? 'Completada' :
                         task.status === 'in-progress' ? 'En Progreso' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {task.assignedUsers?.map(u => `${u.first_name} ${u.last_name}`).join(', ') || 'Sin asignar'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${
                        task.priority === 'high' ? 'text-red-600' :
                        task.priority === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(task.dueDate).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {task.evidenceCount || task.evidences?.length || 0} archivo(s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'productivity' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Análisis de Tendencias</h3>
            <div className="space-y-4">
              {Object.entries(tasksByMonth).map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-gray-900 font-medium">{month}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / Math.max(...Object.values(tasksByMonth))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportType === 'users' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Rendimiento por Usuario</h3>
          <div className="space-y-6">
            {Object.entries(userPerformance).map(([userName, stats]) => (
              <div key={userName} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h4 className="text-lg font-medium text-gray-900 mb-3">{userName}</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total Asignadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-sm text-gray-600">Completadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                    <p className="text-sm text-gray-600">En Progreso</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-sm text-gray-600">Pendientes</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Tasa de finalización</span>
                    <span>{stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;