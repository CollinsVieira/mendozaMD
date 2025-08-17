import { Client } from '../types';
import api from './api';

export interface CreateClientData {
  name: string;
  dni: string;
  company_name: string;
  company_ruc: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

export interface UpdateClientData {
  name?: string;
  dni?: string;
  company_name?: string;
  company_ruc?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
}

class ClientService {
  async getClients(params?: {
    search?: string;
    city?: string;
    state?: string;
    page?: number;
  }): Promise<{ results: Client[]; count: number; next: string | null; previous: string | null }> {
    const response = await api.get('/clients/', { params });
    return response.data;
  }

  async getClient(id: string): Promise<Client> {
    const response = await api.get(`/clients/${id}/`);
    return response.data;
  }

  async createClient(data: CreateClientData): Promise<Client> {
    const response = await api.post('/clients/', data);
    return response.data;
  }

  async updateClient(id: string, data: UpdateClientData): Promise<Client> {
    const response = await api.patch(`/clients/${id}/`, data);
    return response.data;
  }

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}/`);
  }
}

const clientService = new ClientService();
export default clientService;
