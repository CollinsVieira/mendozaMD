import api from './api';

export interface OperationalControl {
  id: string;
  client: string;
  client_name: string;
  year: number;
  monthly_declarations: MonthlyDeclaration[];
  additional_pdts: AdditionalPDT[];
  created_at: string;
  updated_at: string;
}

export interface MonthlyDeclaration {
  id: string;
  month: number;
  month_name: string;
  presentation_date?: string;
  tax_declarations: TaxDeclaration[];
  created_at: string;
  updated_at: string;
}

export interface TaxDeclaration {
  id: string;
  pdt_type: string;
  pdt_type_display: string;
  order_number: string;
  status: string;
  status_display: string;
  pdf_file?: string;
  pdf_url?: string;
  notes: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface AdditionalPDT {
  id: string;
  pdt_type: string;
  pdt_type_display: string;
  pdt_name: string;
  order_number: string;
  presentation_date?: string;
  status: string;
  status_display: string;
  pdf_file?: string;
  pdf_url?: string;
  notes: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaxDeclarationData {
  pdt_type: string;
  order_number?: string;
  status?: string;
  pdf_file?: File;
  notes?: string;
}

export interface CreateAdditionalPDTData {
  pdt_type: string;
  pdt_name?: string;
  order_number?: string;
  presentation_date?: string;
  status?: string;
  pdf_file?: File;
  notes?: string;
  year?: number;
}

export interface UpdatePresentationDateData {
  month: number;
  presentation_date: string;
  year?: number;
}

class OperationalService {
  // Obtener control operativo del cliente
  async getOperationalControl(clientId: string, year?: number): Promise<OperationalControl> {
    const params = year ? { year } : {};
    const response = await api.get(`/clients/${clientId}/operational/`, { params });
    return response.data;
  }

  // Actualizar fecha de presentación de una declaración mensual
  async updatePresentationDate(clientId: string, data: UpdatePresentationDateData): Promise<MonthlyDeclaration> {
    const response = await api.post(`/clients/${clientId}/operational/`, data);
    return response.data;
  }

  // Crear declaración tributaria PDT
  async createTaxDeclaration(clientId: string, declarationId: string, data: CreateTaxDeclarationData): Promise<TaxDeclaration> {
    const formData = new FormData();
    formData.append('pdt_type', data.pdt_type);
    formData.append('order_number', data.order_number || '');
    formData.append('status', data.status || 'pending');
    formData.append('notes', data.notes || '');
    if (data.pdf_file) formData.append('pdf_file', data.pdf_file);

    const response = await api.post(`/clients/${clientId}/declarations/${declarationId}/tax/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Actualizar declaración tributaria PDT
  async updateTaxDeclaration(clientId: string, declarationId: string, taxId: string, data: Partial<CreateTaxDeclarationData>): Promise<TaxDeclaration> {
    const formData = new FormData();
    if (data.pdt_type) formData.append('pdt_type', data.pdt_type);
    if (data.order_number) formData.append('order_number', data.order_number);
    if (data.status) formData.append('status', data.status);
    if (data.notes) formData.append('notes', data.notes);
    if (data.pdf_file) formData.append('pdf_file', data.pdf_file);

    const response = await api.put(`/clients/${clientId}/declarations/${declarationId}/tax/${taxId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Eliminar declaración tributaria PDT
  async deleteTaxDeclaration(clientId: string, declarationId: string, taxId: string): Promise<void> {
    await api.delete(`/clients/${clientId}/declarations/${declarationId}/tax/${taxId}/`);
  }

  // Obtener PDTs adicionales
  async getAdditionalPDTs(clientId: string, year?: number): Promise<AdditionalPDT[]> {
    const params = year ? { year } : {};
    const response = await api.get(`/clients/${clientId}/additional-pdts/`, { params });
    return response.data.results || response.data;
  }

  // Crear PDT adicional
  async createAdditionalPDT(clientId: string, data: CreateAdditionalPDTData): Promise<AdditionalPDT> {
    const formData = new FormData();
    formData.append('pdt_type', data.pdt_type);
    formData.append('pdt_name', data.pdt_name || '');
    formData.append('order_number', data.order_number || '');
    formData.append('status', data.status || 'pending');
    formData.append('notes', data.notes || '');
    if (data.presentation_date) formData.append('presentation_date', data.presentation_date);
    if (data.year) formData.append('year', data.year.toString());
    if (data.pdf_file) formData.append('pdf_file', data.pdf_file);

    const response = await api.post(`/clients/${clientId}/additional-pdts/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Actualizar PDT adicional
  async updateAdditionalPDT(clientId: string, pdtId: string, data: Partial<CreateAdditionalPDTData>): Promise<AdditionalPDT> {
    const formData = new FormData();
    if (data.pdt_type) formData.append('pdt_type', data.pdt_type);
    if (data.pdt_name) formData.append('pdt_name', data.pdt_name);
    if (data.order_number) formData.append('order_number', data.order_number);
    if (data.presentation_date) formData.append('presentation_date', data.presentation_date);
    if (data.status) formData.append('status', data.status);
    if (data.notes) formData.append('notes', data.notes);
    if (data.pdf_file) formData.append('pdf_file', data.pdf_file);

    const response = await api.patch(`/clients/${clientId}/additional-pdts/${pdtId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Eliminar PDT adicional
  async deleteAdditionalPDT(clientId: string, pdtId: string): Promise<void> {
    await api.delete(`/clients/${clientId}/additional-pdts/${pdtId}/`);
  }

  // Descargar PDF
  async downloadPDF(url: string): Promise<Blob> {
    // Si la URL ya es absoluta, usar directamente, sino construir con base URL
    const finalUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${url}`;
    const response = await api.get(finalUrl, {
      responseType: 'blob',
    });
    return response.data;
  }
}

const operationalService = new OperationalService();
export default operationalService;
