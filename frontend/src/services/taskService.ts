import api from './api';
import { Task, Evidence, AuditLogEntry, TaskStats } from '../types';

export interface CreateTaskData {
  title: string;
  description: string;
  assigned_to: string[];
  status: Task['status'];
  priority: Task['priority'];
  due_date: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  assigned_to?: string[];
  status?: Task['status'];
  priority?: Task['priority'];
  due_date?: string;
}

export interface DashboardStats {
  taskStats: TaskStats;
  recentTasks: Task[];
}

class TaskService {
  // Función para mapear evidencias del backend al frontend
  private mapEvidenceData(evidenceData: any): Evidence {
    return {
      id: evidenceData.id.toString(),
      fileName: evidenceData.file_name || '',
      fileType: evidenceData.file_type || '',
      fileSize: evidenceData.file_size || 0,
      uploadedBy: evidenceData.uploaded_by?.first_name && evidenceData.uploaded_by?.last_name 
        ? `${evidenceData.uploaded_by.first_name} ${evidenceData.uploaded_by.last_name}`
        : evidenceData.uploaded_by?.username || 'Usuario desconocido',
      uploadedAt: evidenceData.uploaded_at || '',
      url: evidenceData.file || ''
    };
  }

  // Función para mapear datos del backend al frontend
  private mapTaskData(taskData: any): Task {
    return {
      ...taskData,
      id: taskData.id.toString(), // Asegurar que el ID sea string
      assignedTo: taskData.assigned_to ? taskData.assigned_to.map((user: any) => user.id.toString()) : [],
      assignedUsers: taskData.assigned_to || [],
      evidences: taskData.evidences ? taskData.evidences.map((evidence: any) => this.mapEvidenceData(evidence)) : [],
      evidenceCount: taskData.evidence_count || (taskData.evidences ? taskData.evidences.length : 0),
      auditLog: taskData.audit_log || [],
      dueDate: taskData.due_date,
      createdBy: taskData.created_by,
      createdAt: taskData.created_at,
      updatedAt: taskData.updated_at
    };
  }

  // Obtener todas las tareas
  async getTasks(): Promise<Task[]> {
    const response = await api.get('/tasks/');
    const tasks = response.data.results || response.data;
    return tasks.map((task: any) => this.mapTaskData(task));
  }

  // Obtener tarea por ID
  async getTask(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}/`);
    return this.mapTaskData(response.data);
  }

  // Crear nueva tarea
  async createTask(data: CreateTaskData): Promise<Task> {
    // Formatear la fecha para que sea compatible con el backend
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      // Si la fecha ya está en formato yyyy-MM-dd, devolverla tal como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      // Si es una fecha ISO, extraer solo la parte de la fecha
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const requestData = {
      title: data.title,
      description: data.description,
      assigned_users: data.assigned_to || [], // Asegurar que siempre sea un array
      status: data.status,
      priority: data.priority,
      due_date: formatDate(data.due_date)
    };
    const response = await api.post('/tasks/', requestData);
    return this.mapTaskData(response.data);
  }

  // Actualizar tarea
  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    // Formatear la fecha para que sea compatible con el backend
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      // Si la fecha ya está en formato yyyy-MM-dd, devolverla tal como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      // Si es una fecha ISO, extraer solo la parte de la fecha
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const requestData: any = {};
    if (data.title !== undefined) requestData.title = data.title;
    if (data.description !== undefined) requestData.description = data.description;
    if (data.assigned_to !== undefined) requestData.assigned_users = data.assigned_to || []; // Manejar array vacío
    if (data.status !== undefined) requestData.status = data.status;
    if (data.priority !== undefined) requestData.priority = data.priority;
    if (data.due_date !== undefined) requestData.due_date = formatDate(data.due_date);
    
    const response = await api.patch(`/tasks/${id}/`, requestData);
    return this.mapTaskData(response.data);
  }

  // Eliminar tarea
  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}/`);
  }

  // Obtener mis tareas (asignadas al usuario actual)
  async getMyTasks(): Promise<Task[]> {
    const response = await api.get('/tasks/my-tasks/');
    const tasks = response.data.results || response.data;
    return tasks.map((task: any) => this.mapTaskData(task));
  }

  // Cambiar estado de tarea
  async changeTaskStatus(id: string, status: Task['status']): Promise<Task> {
    const response = await api.post(`/tasks/${id}/change-status/`, { status });
    return this.mapTaskData(response.data);
  }

  // Obtener estadísticas de tareas
  async getTaskStats(): Promise<TaskStats> {
    const response = await api.get('/tasks/stats/');
    return response.data;
  }

  // Obtener estadísticas del dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/tasks/dashboard-stats/');
    const data = response.data;
    return {
      taskStats: data.taskStats,
      recentTasks: data.recentTasks.map((task: any) => this.mapTaskData(task))
    };
  }

  // Subir evidencia para una tarea
  async uploadEvidence(taskId: string, file: File): Promise<Evidence> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/tasks/${taskId}/evidences/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Obtener evidencias de una tarea
  async getTaskEvidences(taskId: string): Promise<Evidence[]> {
    const response = await api.get(`/tasks/${taskId}/evidences/`);
    return response.data.results || response.data;
  }

  // Eliminar evidencia
  async deleteEvidence(taskId: string, evidenceId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/evidences/${evidenceId}/`);
  }

  // Descargar evidencia (solo admin)
  async downloadEvidence(taskId: string, evidenceId: string, fileName: string): Promise<void> {
    const response = await api.get(`/tasks/${taskId}/evidences/${evidenceId}/download/`, {
      responseType: 'blob',
    });
    
    // Crear un enlace de descarga temporal preservando el tipo de contenido
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // Obtener logs de auditoría de una tarea
  async getTaskAuditLog(taskId: string): Promise<AuditLogEntry[]> {
    const response = await api.get(`/tasks/${taskId}/audit-log/`);
    return response.data.results || response.data;
  }
}

export default new TaskService(); 