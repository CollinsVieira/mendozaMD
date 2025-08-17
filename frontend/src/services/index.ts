export { default as api } from './api';
export { default as authService } from './authService';
export { default as taskService } from './taskService';
export { default as userService } from './userService';
export { default as fileService } from './fileService';
export { default as clientService } from './clientService';
export { default as financeService } from './financeService';

// Re-export types
export type { LoginCredentials, RegisterData, AuthResponse } from './authService';
export type { CreateTaskData, UpdateTaskData, DashboardStats } from './taskService';
export type { CreateUserData, UpdateUserData } from './userService';
export type { FileUploadResponse } from './fileService';
export type { CreateClientData, UpdateClientData } from './clientService';
export type { 
  ClientFinance, 
  MonthlyPayment, 
  PaymentTransaction, 
  CollectionRecord,
  CreateFinanceData,
  CreatePaymentData,
  CreateCollectionData 
} from './financeService'; 