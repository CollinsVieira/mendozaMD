import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Building, FileText, MapPin, Hash } from 'lucide-react';
import { Client } from '../../types';
import { CreateClientData, UpdateClientData } from '../../services/clientService';

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (data: CreateClientData | UpdateClientData) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onSubmit, onClose, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    dni: '',
    company_name: '',
    company_ruc: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      // Modo edición - cargar datos del cliente
      setFormData({
        name: client.name,
        dni: client.dni,
        company_name: client.company_name,
        company_ruc: client.company_ruc,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        state: client.state
      });
    } else {
      // Modo creación - limpiar formulario
      setFormData({
        name: '',
        dni: '',
        company_name: '',
        company_ruc: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: ''
      });
    }
    setErrors({});
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones básicas
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido';
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'El nombre de la empresa es requerido';
    }

    if (!formData.company_ruc.trim()) {
      newErrors.company_ruc = 'El RUC de la empresa es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'El estado/provincia es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error: any) {
      // Manejar errores del servidor
      if (error.response?.data) {
        const serverErrors: Record<string, string> = {};
        Object.keys(error.response.data).forEach(key => {
          if (Array.isArray(error.response.data[key])) {
            serverErrors[key] = error.response.data[key][0];
          } else {
            serverErrors[key] = error.response.data[key];
          }
        });
        setErrors(serverErrors);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {client ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Información Personal */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User size={20} className="mr-2" />
                Información Personal
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Juan Pérez"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* DNI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Hash size={16} className="inline mr-1" />
                    DNI *
                  </label>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.dni ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12345678"
                  />
                  {errors.dni && (
                    <p className="text-red-600 text-sm mt-1">{errors.dni}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Información de la Empresa */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building size={20} className="mr-2" />
                Información de la Empresa
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre de la Empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.company_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ABC Empresa S.A."
                  />
                  {errors.company_name && (
                    <p className="text-red-600 text-sm mt-1">{errors.company_name}</p>
                  )}
                </div>

                {/* RUC */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Hash size={16} className="inline mr-1" />
                    RUC de la Empresa *
                  </label>
                  <input
                    type="text"
                    name="company_ruc"
                    value={formData.company_ruc}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.company_ruc ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="20123456789"
                  />
                  {errors.company_ruc && (
                    <p className="text-red-600 text-sm mt-1">{errors.company_ruc}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Mail size={20} className="mr-2" />
                Información de Contacto
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="cliente@empresa.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone size={16} className="inline mr-1" />
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+51 999 888 777"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Información de Ubicación */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin size={20} className="mr-2" />
                Ubicación
              </h4>
              <div className="space-y-4">
                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Av. Principal 123, Distrito, Ciudad"
                  />
                  {errors.address && (
                    <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Lima"
                    />
                    {errors.city && (
                      <p className="text-red-600 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  {/* Estado/Provincia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado/Provincia *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Lima"
                    />
                    {errors.state && (
                      <p className="text-red-600 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error general */}
            {errors.non_field_errors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.non_field_errors}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isLoading}
            >
              <FileText size={16} />
              <span>{isLoading ? 'Guardando...' : (client ? 'Actualizar' : 'Crear Cliente')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
