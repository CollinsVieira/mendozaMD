export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'worker';
  avatar?: string;
  phone?: string;
  is_active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  dni: string;
  company_name: string;
  company_ruc: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  assignedUsers?: User[];
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  evidences?: Evidence[];
  evidenceCount?: number;
  auditLog?: AuditLogEntry[];
}

export interface Evidence {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
  isLoading: boolean;
  error: string | null;
}