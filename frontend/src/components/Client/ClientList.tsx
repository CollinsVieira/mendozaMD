import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Building, Mail, Phone, MapPin } from 'lucide-react';
import { Client } from '../../types';
import clientService from '../../services/clientService';
import { useAuth } from '../../contexts/AuthContext';
import ClientForm from './ClientForm';
import { LoadingSpinner, Alert } from '../UI';

const ClientList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await clientService.getClients(params);
      setClients(response.results);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los clientes');
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [searchTerm]);

  const handleCreateClient = () => {
    setSelectedClient(null);
    setShowForm(true);
  };

  const handleViewClient = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleEditClient = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation(); // Evitar que se ejecute el click de la fila
    setSelectedClient(client);
    setShowForm(true);
  };

  const handleDeleteClient = async (e: React.MouseEvent, client: Client) => {
    e.stopPropagation(); // Evitar que se ejecute el click de la fila
    
    if (!window.confirm(`¿Estás seguro de que quieres eliminar al cliente "${client.name}"?`)) {
      return;
    }

    try {
      await clientService.deleteClient(client.id);
      await loadClients();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el cliente');
      console.error('Error deleting client:', err);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setFormLoading(true);
      setError(null);

      if (selectedClient) {
        await clientService.updateClient(selectedClient.id, data);
      } else {
        await clientService.createClient(data);
      }

      setShowForm(false);
      setSelectedClient(null);
      await loadClients();
    } catch (err: any) {
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedClient(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && clients.length === 0) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Gestiona la información de tus clientes</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={handleCreateClient}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nuevo Cliente</span>
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email, empresa, DNI o RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert type="error" message={error} className="mb-6" />}

      {/* Lista de clientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {clients.length === 0 ? (
          <div className="p-12 text-center">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No se encontraron clientes.' : 'Comienza agregando tu primer cliente.'}
            </p>
            {user?.role === 'admin' && !searchTerm && (
              <button
                onClick={handleCreateClient}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear primer cliente
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr 
                      key={client.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleViewClient(client)}
                    >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">DNI: {client.dni}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.company_name}</div>
                        <div className="text-sm text-gray-500">RUC: {client.company_ruc}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 flex items-center">
                          <Mail size={14} className="mr-1" />
                          {client.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone size={14} className="mr-1" />
                          {client.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <MapPin size={14} className="mr-1" />
                        {client.city}, {client.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                              <div className="flex items-center justify-end space-x-2">
                          {user?.role === 'admin' && (
                            <>
                              <button
                                onClick={(e) => handleEditClient(e, client)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                title="Editar cliente"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClient(e, client)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                title="Eliminar cliente"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal del formulario */}
      {showForm && (
        <ClientForm
          client={selectedClient}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
          isLoading={formLoading}
        />
      )}
    </div>
  );
};

export default ClientList;
