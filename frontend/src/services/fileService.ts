import api from './api';

export interface FileUploadResponse {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
}

class FileService {
  // Subir archivo
  async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/files/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Descargar archivo
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await api.get(`/files/download/${fileId}/`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Eliminar archivo
  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/files/delete/${fileId}/`);
  }

  // Obtener URL de descarga directa
  getDownloadUrl(fileId: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}/api/v1/files/download/${fileId}/`;
  }
}

export default new FileService(); 