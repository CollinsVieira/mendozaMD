import React from 'react';
import { TaskStats } from '../../types';

interface TaskChartProps {
  taskStats: TaskStats;
}

const TaskChart: React.FC<TaskChartProps> = ({ taskStats }) => {
  const data = [
    { label: 'Pendientes', value: taskStats.pending, color: 'bg-yellow-500' },
    { label: 'En Progreso', value: taskStats.inProgress, color: 'bg-blue-500' },
    { label: 'Completadas', value: taskStats.completed, color: 'bg-green-500' },
    { label: 'Atrasadas', value: taskStats.overdue, color: 'bg-red-500' },
  ];

  const total = taskStats.total || 1; // Avoid division by zero

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribución de Tareas</h3>
      
      <div className="space-y-4">
        {data.map((item) => {
          const percentage = (item.value / total) * 100;
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                  {item.value} ({Math.round(percentage)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskChart;