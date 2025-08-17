import api from './api';

export interface ClientFinance {
  id: string;
  client: string;
  client_name: string;
  annual_fee: number;
  monthly_fee: number;
  year: number;
  monthly_payments: MonthlyPayment[];
  total_due: number;
  total_paid: number;
  total_balance: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyPayment {
  id: string;
  month: number;
  month_name: string;
  amount_due: number;
  amount_paid: number;
  balance: number;
  is_paid: boolean;
  payment_date?: string;
  notes: string;
  transactions: PaymentTransaction[];
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string;
  notes: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export interface CollectionRecord {
  id: string;
  client: string;
  client_name: string;
  monthly_payment: string;
  monthly_payment_info: string;
  status: string;
  status_display: string;
  contact_date: string;
  contact_method: string;
  notes: string;
  next_contact_date?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export interface CreateFinanceData {
  annual_fee: number;
  monthly_fee: number;
  year?: number;
}

export interface CreatePaymentData {
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

export interface CreateCollectionData {
  monthly_payment: string;
  status: string;
  contact_date: string;
  contact_method: string;
  notes: string;
  next_contact_date?: string;
}

class FinanceService {
  // Obtener información financiera del cliente
  async getClientFinance(clientId: string, year?: number): Promise<ClientFinance> {
    const params = year ? { year } : {};
    const response = await api.get(`/clients/${clientId}/finance/`, { params });
    return response.data;
  }

  // Crear o actualizar configuración financiera
  async createOrUpdateFinance(clientId: string, data: CreateFinanceData): Promise<ClientFinance> {
    const response = await api.post(`/clients/${clientId}/finance/`, data);
    return response.data;
  }

  // Obtener resumen financiero
  async getFinanceSummary(clientId: string, year?: number): Promise<any> {
    const params = year ? { year } : {};
    const response = await api.get(`/clients/${clientId}/finance/summary/`, { params });
    return response.data;
  }

  // Actualizar pago mensual
  async updateMonthlyPayment(clientId: string, paymentId: string, data: Partial<MonthlyPayment>): Promise<MonthlyPayment> {
    const response = await api.patch(`/clients/${clientId}/payments/${paymentId}/`, data);
    return response.data;
  }

  // Registrar una transacción de pago
  async createPaymentTransaction(clientId: string, paymentId: string, data: CreatePaymentData): Promise<PaymentTransaction> {
    const response = await api.post(`/clients/${clientId}/payments/${paymentId}/transactions/`, data);
    return response.data;
  }

  // Obtener registros de cobranza del cliente
  async getCollectionRecords(clientId: string): Promise<CollectionRecord[]> {
    const response = await api.get(`/clients/${clientId}/collections/`);
    return response.data.results || response.data;
  }

  // Crear registro de cobranza
  async createCollectionRecord(clientId: string, data: CreateCollectionData): Promise<CollectionRecord> {
    const response = await api.post(`/clients/${clientId}/collections/`, data);
    return response.data;
  }

  // Actualizar registro de cobranza
  async updateCollectionRecord(clientId: string, recordId: string, data: Partial<CreateCollectionData>): Promise<CollectionRecord> {
    const response = await api.patch(`/clients/${clientId}/collections/${recordId}/`, data);
    return response.data;
  }

  // Eliminar registro de cobranza
  async deleteCollectionRecord(clientId: string, recordId: string): Promise<void> {
    await api.delete(`/clients/${clientId}/collections/${recordId}/`);
  }
}

const financeService = new FinanceService();
export default financeService;
