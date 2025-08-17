import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Plus,
  Save,
  Edit3
} from 'lucide-react';
import financeService, { ClientFinance as ClientFinanceType, MonthlyPayment } from '../../services/financeService';
import clientService from '../../services/clientService';
import { Client } from '../../types';
import { LoadingSpinner, Alert } from '../UI';

const ClientFinance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<Client | null>(null);
  const [finance, setFinance] = useState<ClientFinanceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState(false);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  
  // Formulario de configuración
  const [configForm, setConfigForm] = useState({
    annual_fee: 0,
    monthly_fee: 0,
    year: new Date().getFullYear()
  });
  
  // Formulario de pago
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference: '',
    notes: ''
  });

  const loadClient = async () => {
    if (!id) return;
    
    try {
      const clientData = await clientService.getClient(id);
      setClient(clientData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el cliente');
    }
  };

  const loadFinance = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const financeData = await financeService.getClientFinance(id, configForm.year);
      setFinance(financeData);
      setConfigForm({
        annual_fee: financeData.annual_fee,
        monthly_fee: financeData.monthly_fee,
        year: financeData.year
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar información financiera');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
    loadFinance();
  }, [id, configForm.year]);

  const handleSaveConfig = async () => {
    if (!id) return;
    
    try {
      const updatedFinance = await financeService.createOrUpdateFinance(id, configForm);
      setFinance(updatedFinance);
      setEditingConfig(false);
      setError(null);
      await loadFinance(); // Recargar para obtener los pagos actualizados
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar configuración');
    }
  };

  const handlePayment = async (payment: MonthlyPayment) => {
    if (!id || paymentForm.amount <= 0) return;
    
    try {
      await financeService.createPaymentTransaction(id, payment.id, {
        amount: paymentForm.amount,
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference,
        notes: paymentForm.notes
      });
      
      setEditingPayment(null);
      setPaymentForm({
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        reference: '',
        notes: ''
      });
      setError(null);
      await loadFinance(); // Recargar para ver los cambios
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar pago');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const getPaymentStatusColor = (payment: MonthlyPayment) => {
    if (payment.is_paid) return 'bg-green-100 text-green-800';
    if (payment.amount_paid > 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPaymentStatusText = (payment: MonthlyPayment) => {
    if (payment.is_paid) return 'Pagado';
    if (payment.amount_paid > 0) return 'Parcial';
    return 'Pendiente';
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!client || !finance) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(`/clients/${id}`)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Finanzas no encontradas</h1>
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
            onClick={() => navigate(`/clients/${id}`)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <DollarSign className="mr-2" size={28} />
              Finanzas de {client.name}
            </h1>
            <p className="text-gray-600">{client.company_name} - Año {finance.year}</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert type="error" message={error} className="mb-6" />}

      {/* Configuración Financiera */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Configuración Financiera</h2>
          <button
            onClick={() => setEditingConfig(!editingConfig)}
            className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit3 size={16} />
            <span>{editingConfig ? 'Cancelar' : 'Editar'}</span>
          </button>
        </div>

        {editingConfig ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input
                type="number"
                value={configForm.year}
                onChange={(e) => setConfigForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuota Mensual (S/)</label>
              <input
                type="number"
                step="0.01"
                value={configForm.monthly_fee}
                onChange={(e) => setConfigForm(prev => ({ ...prev, monthly_fee: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DJ Anual (S/)</label>
              <input
                type="number"
                step="0.01"
                value={configForm.annual_fee}
                onChange={(e) => setConfigForm(prev => ({ ...prev, annual_fee: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={handleSaveConfig}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save size={16} />
                <span>Guardar Configuración</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Cuota Mensual</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(finance.monthly_fee)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">DJ Anual</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(finance.annual_fee)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Total a Cobrar</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(finance.total_due)}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(finance.total_balance)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagos Mensuales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="mr-2" size={20} />
            Pagos Mensuales
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {finance.monthly_payments.map((payment) => (
              <div
                key={payment.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{payment.month_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment)}`}>
                    {getPaymentStatusText(payment)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">A cobrar:</span>
                    <span className="font-medium">{formatCurrency(payment.amount_due)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pagado:</span>
                    <span className="font-medium text-green-600">{formatCurrency(payment.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Saldo:</span>
                    <span className={`font-medium ${payment.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(payment.balance)}
                    </span>
                  </div>
                </div>

                {payment.balance > 0 && (
                  <div className="mt-3">
                    {editingPayment === payment.id ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Monto a pagar"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="date"
                          value={paymentForm.payment_date}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Método de pago"
                          value={paymentForm.payment_method}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePayment(payment)}
                            className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            Registrar
                          </button>
                          <button
                            onClick={() => setEditingPayment(null)}
                            className="flex-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingPayment(payment.id)}
                        className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={14} />
                        <span>Pagar</span>
                      </button>
                    )}
                  </div>
                )}

                {payment.transactions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Últimos pagos:</p>
                    <div className="space-y-1">
                      {payment.transactions.slice(0, 2).map((transaction) => (
                        <div key={transaction.id} className="text-xs text-gray-600">
                          {formatCurrency(transaction.amount)} - {new Date(transaction.payment_date).toLocaleDateString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientFinance;
