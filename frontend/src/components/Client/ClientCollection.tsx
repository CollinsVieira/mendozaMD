import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  Plus, 
  Phone, 
  Mail, 
  MessageSquare,
  Calendar,
  Edit,
  Trash2
} from 'lucide-react';
import financeService, { CollectionRecord } from '../../services/financeService';
import clientService from '../../services/clientService';
import { Client } from '../../types';
import { LoadingSpinner, Alert } from '../UI';

const ClientCollection: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<Client | null>(null);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CollectionRecord | null>(null);
  
  const [formData, setFormData] = useState({
    monthly_payment: '',
    status: 'pending',
    contact_date: new Date().toISOString().slice(0, 16),
    contact_method: '',
    notes: '',
    next_contact_date: ''
  });

  const statusOptions = [
    { value: 'pending', label: 'Pendiente', color: 'bg-gray-100 text-gray-800' },
    { value: 'contacted', label: 'Contactado', color: 'bg-blue-100 text-blue-800' },
    { value: 'promised', label: 'Prometió pagar', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'partial', label: 'Pago parcial', color: 'bg-orange-100 text-orange-800' },
    { value: 'paid', label: 'Pagado', color: 'bg-green-100 text-green-800' },
    { value: 'defaulted', label: 'En mora', color: 'bg-red-100 text-red-800' },
  ];

  const contactMethods = [
    { value: 'phone', label: 'Teléfono', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { value: 'visit', label: 'Visita', icon: Calendar },
  ];

  const loadClient = async () => {
    if (!id) return;
    
    try {
      const clientData = await clientService.getClient(id);
      setClient(clientData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el cliente');
    }
  };

  const loadCollections = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const collectionsData = await financeService.getCollectionRecords(id);
      setCollections(collectionsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar registros de cobranza');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
    loadCollections();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      if (editingRecord) {
        await financeService.updateCollectionRecord(id, editingRecord.id, formData);
      } else {
        await financeService.createCollectionRecord(id, formData);
      }
      
      setShowForm(false);
      setEditingRecord(null);
      resetForm();
      await loadCollections();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar registro');
    }
  };

  const handleEdit = (record: CollectionRecord) => {
    setEditingRecord(record);
    setFormData({
      monthly_payment: record.monthly_payment,
      status: record.status,
      contact_date: new Date(record.contact_date).toISOString().slice(0, 16),
      contact_method: record.contact_method,
      notes: record.notes,
      next_contact_date: record.next_contact_date ? new Date(record.next_contact_date).toISOString().slice(0, 16) : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (record: CollectionRecord) => {
    if (!id || !window.confirm('¿Estás seguro de que quieres eliminar este registro?')) return;

    try {
      await financeService.deleteCollectionRecord(id, record.id);
      await loadCollections();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar registro');
    }
  };

  const resetForm = () => {
    setFormData({
      monthly_payment: '',
      status: 'pending',
      contact_date: new Date().toISOString().slice(0, 16),
      contact_method: '',
      notes: '',
      next_contact_date: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
    resetForm();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  const getContactMethodIcon = (method: string) => {
    const contactMethod = contactMethods.find(cm => cm.value === method);
    return contactMethod ? contactMethod.icon : MessageSquare;
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/clients/${id}`)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <CreditCard className="mr-2" size={28} />
              Cobranza de {client?.name}
            </h1>
            <p className="text-gray-600">{client?.company_name}</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nuevo Registro</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && <Alert type="error" message={error} className="mb-6" />}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingRecord ? 'Editar Registro' : 'Nuevo Registro de Cobranza'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Contacto</label>
                <select
                  value={formData.contact_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_method: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar método</option>
                  {contactMethods.map(method => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Contacto</label>
                <input
                  type="datetime-local"
                  value={formData.contact_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Próximo Contacto (Opcional)</label>
                <input
                  type="datetime-local"
                  value={formData.next_contact_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_contact_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detalles del contacto, compromisos, observaciones..."
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingRecord ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Registros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Cobranza</h2>
        </div>
        
        {collections.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros de cobranza</h3>
            <p className="text-gray-600 mb-4">Comienza agregando el primer registro de contacto.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear primer registro
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {collections.map((record) => {
                const statusConfig = getStatusConfig(record.status);
                const ContactIcon = getContactMethodIcon(record.contact_method);
                
                return (
                  <div
                    key={record.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          <div className="flex items-center text-sm text-gray-600">
                            <ContactIcon size={16} className="mr-1" />
                            {contactMethods.find(cm => cm.value === record.contact_method)?.label || record.contact_method}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(record.contact_date)}
                          </span>
                        </div>
                        
                        <p className="text-gray-900 mb-2">{record.notes}</p>
                        
                        {record.next_contact_date && (
                          <div className="flex items-center text-sm text-orange-600">
                            <Calendar size={16} className="mr-1" />
                            Próximo contacto: {formatDateTime(record.next_contact_date)}
                          </div>
                        )}
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Registrado por {record.created_by_name} - {formatDateTime(record.created_at)}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar registro"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(record)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientCollection;
