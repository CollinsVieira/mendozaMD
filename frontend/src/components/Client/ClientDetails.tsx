import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Hash, 
  Calendar,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { Client } from '../../types';
import clientService from '../../services/clientService';
import { useAuth } from '../../contexts/AuthContext';
import ClientForm from './ClientForm';
import { LoadingSpinner, Alert } from '../UI';

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const loadClient = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const clientData = await clientService.getClient(id);
      setClient(clientData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el cliente');
      console.error('Error loading client:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
  }, [id]);

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleDelete = async () => {
    if (!client) return;
    
    if (!window.confirm(`¿Estás seguro de que quieres eliminar al cliente "${client.name}"?`)) {
      return;
    }

    try {
      await clientService.deleteClient(client.id);
      navigate('/clients');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el cliente');
      console.error('Error deleting client:', err);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!client) return;
    
    try {
      setFormLoading(true);
      setError(null);
      
      const updatedClient = await clientService.updateClient(client.id, data);
      setClient(updatedClient);
      setShowEditForm(false);
    } catch (err: any) {
      throw err; // Re-lanzar para que el formulario maneje el error
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowEditForm(false);
  };

  const handleFinanzas = () => {
    navigate(`/clients/${id}/finance`);
  };

  const handleCobranza = () => {
    navigate(`/clients/${id}/collection`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/clients')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Cliente no encontrado</h1>
        </div>
        {error && <Alert type="error" message={error} />}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/clients')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">{client.company_name}</p>
          </div>
        </div>
        
        {user?.role === 'admin' && (
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit size={16} />
              <span>Editar</span>
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Eliminar</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && <Alert type="error" message={error} className="mb-6" />}

      {/* Detalles del cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Personal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User size={20} className="mr-2 text-blue-600" />
            Información Personal
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nombre Completo</label>
              <p className="text-gray-900">{client.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">DNI</label>
              <p className="text-gray-900 flex items-center">
                <Hash size={16} className="mr-1" />
                {client.dni}
              </p>
            </div>
          </div>
        </div>

        {/* Información de la Empresa */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building size={20} className="mr-2 text-green-600" />
            Información de la Empresa
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nombre de la Empresa</label>
              <p className="text-gray-900">{client.company_name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">RUC</label>
              <p className="text-gray-900 flex items-center">
                <Hash size={16} className="mr-1" />
                {client.company_ruc}
              </p>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Mail size={20} className="mr-2 text-purple-600" />
            Información de Contacto
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-gray-900 flex items-center">
                <Mail size={16} className="mr-1" />
                <a 
                  href={`mailto:${client.email}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {client.email}
                </a>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Teléfono</label>
              <p className="text-gray-900 flex items-center">
                <Phone size={16} className="mr-1" />
                <a 
                  href={`tel:${client.phone}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {client.phone}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Información de Ubicación */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin size={20} className="mr-2 text-red-600" />
            Ubicación
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Dirección</label>
              <p className="text-gray-900">{client.address}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Ciudad</label>
                <p className="text-gray-900">{client.city}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Estado/Provincia</label>
                <p className="text-gray-900">{client.state}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar size={20} className="mr-2 text-orange-600" />
          Información Adicional
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Fecha de Registro</label>
            <p className="text-gray-900">{formatDate(client.created_at)}</p>
          </div>
        </div>
      </div>
      {/* Botones de Acciones */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {user?.role === 'admin' && (
          <div className="flex space-x-2">
            <button
              onClick={handleFinanzas}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <DollarSign size={16} />
              <span>Finanzas</span>
            </button>
            <button
              onClick={handleCobranza}
              className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors flex items-center space-x-2"
            >
              <CreditCard size={16} />
              <span>Cobranza</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal del formulario de edición */}
      {showEditForm && (
        <ClientForm
          client={client}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
          isLoading={formLoading}
        />
      )}
    </div>
  );
};

export default ClientDetails;
