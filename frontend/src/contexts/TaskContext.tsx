import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, User, Evidence, AuditLogEntry, TaskStats } from '../types';
import { useAuth } from './AuthContext';
import taskService from '../services/taskService';

interface TaskContextType {
  tasks: Task[];
  taskStats: TaskStats;
  isLoading: boolean;
  error: string | null;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'evidences' | 'auditLog'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  addEvidence: (taskId: string, file: File) => Promise<void>;
  downloadEvidence: (taskId: string, evidenceId: string, fileName: string) => Promise<void>;
  getUserTasks: (userId: string) => Task[];
  refreshTasks: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};



interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Cargar tareas al montar el componente
  useEffect(() => {
    if (user) {
      refreshTasks();
      refreshStats();
    }
  }, [user]);

  const refreshTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedTasks = await taskService.getTasks();
      setTasks(fetchedTasks);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error al cargar las tareas');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      const stats = await taskService.getTaskStats();
      setTaskStats(stats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'evidences' | 'auditLog'>) => {
    try {
      const newTask = await taskService.createTask({
        title: taskData.title,
        description: taskData.description,
        assigned_to: taskData.assignedTo || [], // Asegurar que siempre sea un array
        status: taskData.status,
        priority: taskData.priority,
        due_date: taskData.dueDate
      });
      
      setTasks(prev => [...prev, newTask]);
      await refreshStats();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error al crear la tarea');
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo || []; // Manejar array vacío
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;

      const updatedTask = await taskService.updateTask(taskId, updateData);
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      await refreshStats();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error al actualizar la tarea');
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      await refreshStats();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error al eliminar la tarea');
      throw error;
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const updatedTask = await taskService.changeTaskStatus(taskId, status);
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      await refreshStats();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error al cambiar el estado de la tarea');
      throw error;
    }
  };

  const addEvidence = async (taskId: string, file: File) => {
    try {
      const evidence = await taskService.uploadEvidence(taskId, file);
      
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            evidences: [...(task.evidences || []), evidence]
          };
        }
        return task;
      }));
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error al subir la evidencia');
      throw error;
    }
  };

  const downloadEvidence = async (taskId: string, evidenceId: string, fileName: string) => {
    try {
      await taskService.downloadEvidence(taskId, evidenceId, fileName);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error al descargar la evidencia');
      throw error;
    }
  };

  const getUserTasks = (userId: string): Task[] => {
    return tasks.filter(task => task.assignedTo.includes(userId));
  };

  const value: TaskContextType = {
    tasks,
    taskStats,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    addEvidence,
    downloadEvidence,
    getUserTasks,
    refreshTasks,
    refreshStats
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};