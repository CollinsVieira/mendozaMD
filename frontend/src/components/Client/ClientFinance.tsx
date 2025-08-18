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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [creatingNewYear, setCreatingNewYear] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
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

  const loadAvailableYears = async () => {
    if (!id) return;
    
    try {
      const yearsData = await financeService.getAvailableYears(id);
      setAvailableYears(yearsData.available_years);
    } catch (err: any) {
      console.error('Error loading available years:', err);
    }
  };

  useEffect(() => {
    loadClient();
    loadAvailableYears();
  }, [id]);

  useEffect(() => {
    if (id && configForm.year) {
      loadFinance();
    }
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

  const handleCreateNewYear = async () => {
    if (!id) return;
    
    const newYear = configForm.year + 1;
    try {
      setCreatingNewYear(true);
      
      // Crear configuración para el nuevo año
      const newFinance = await financeService.createOrUpdateFinance(id, {
        annual_fee: 0,
        monthly_fee: 0,
        year: newYear
      });
      
      // Actualizar el formulario y cargar el nuevo año
      setConfigForm(prev => ({ ...prev, year: newYear }));
      setFinance(newFinance);
      setError(null);
      
      // Mostrar mensaje de éxito
      setSuccessMessage(`Año ${newYear} creado exitosamente con configuración por defecto. Puedes configurar las cuotas mensuales y anuales.`);
      setError(null);
      
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear nuevo año');
    } finally {
      setCreatingNewYear(false);
    }
  };

  const handlePayment = async (payment: MonthlyPayment) => {
    if (!id || paymentForm.amount <= 0) return;
    
    // Validar que no se exceda el monto anual total
    const maxAllowedAmount = getMaxAllowedAmount();
    const totalPaid = getTotalPaidThisYear();
    const annualFee = Number(finance?.annual_fee) || 0;
    
    // Validar que los valores sean números válidos
    if (isNaN(maxAllowedAmount) || isNaN(totalPaid) || isNaN(annualFee)) {
      setError('Error en los cálculos financieros. Por favor, recarga la página.');
      return;
    }
    
    if (paymentForm.amount > maxAllowedAmount) {
      setError(
        `No se puede pagar más del monto anual total. ` +
        `Monto anual: ${formatCurrency(annualFee)}, ` +
        `Ya pagado: ${formatCurrency(totalPaid)}, ` +
        `Máximo permitido: ${formatCurrency(maxAllowedAmount)}`
      );
      return;
    }
    
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
      setError(err.response?.data?.detail || err.response?.data?.message || 'Error al registrar pago');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const getMaxAllowedAmount = () => {
    if (!finance || !finance.monthly_payments) {
      return 0;
    }
    
    // Calcular el total anual real (12 meses + DJ Anual)
    const monthlyFee = Number(finance.monthly_fee) || 0;
    const annualFee = Number(finance.annual_fee) || 0;
    const totalAnnualAmount = (monthlyFee * 12) + annualFee;
    
    // Calcular el total ya pagado
    const totalPaidThisYear = finance.monthly_payments.reduce((sum, p) => {
      const amount = Number(p.amount_paid) || 0;
      return sum + amount;
    }, 0);
    
    // El máximo permitido es el total anual menos lo ya pagado
    const maxAllowed = totalAnnualAmount - totalPaidThisYear;
    
    return maxAllowed;
  };

  const getTotalPaidThisYear = () => {
    if (!finance || !finance.monthly_payments) {
      return 0;
    }
    
    const totalPaid = finance.monthly_payments.reduce((sum, p) => {
      const amount = Number(p.amount_paid) || 0;
      return sum + amount;
    }, 0);
    
    return totalPaid;
  };

  const isValidNumber = (value: any): boolean => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  };

  const safeFormatCurrency = (amount: any) => {
    const numAmount = Number(amount);
    if (!isValidNumber(numAmount)) {
      return 'S/ 0.00';
    }
    return formatCurrency(numAmount);
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
       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
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
             <p className="text-gray-600">{client.company_name}</p>
           </div>
         </div>
         
         {/* Selector de Año y Botón Nuevo Año */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Año:</label>
                         <select
               value={configForm.year}
               onChange={(e) => {
                 const newYear = parseInt(e.target.value);
                 setConfigForm(prev => ({ ...prev, year: newYear }));
               }}
               className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleCreateNewYear}
            disabled={creatingNewYear}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingNewYear ? (
              <>
                <LoadingSpinner size="md" />
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Nuevo Año</span>
              </>
            )}
          </button>
          
                     {/* Indicador de Años Disponibles con Paginación */}
           <div className="flex items-center space-x-2 text-sm text-gray-600">
             <span>Años:</span>
             {availableYears.length > 0 ? (
               <div className="flex items-center space-x-1">
                 {/* Botón Anterior */}
                 {configForm.year > Math.min(...availableYears) && (
                   <button
                     onClick={() => {
                       const currentIndex = availableYears.indexOf(configForm.year);
                       const prevYear = availableYears[currentIndex - 1];
                       setConfigForm(prev => ({ ...prev, year: prevYear }));
                       // No llamar loadFinance() aquí, el useEffect se encargará
                     }}
                     className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                     title="Año anterior"
                   >
                     ←
                   </button>
                 )}
                 
                 {/* Año Actual */}
                 <span className="px-3 py-1 bg-blue-600 text-white rounded font-medium flex items-center space-x-2">
                   {configForm.year}
                   {loading && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>}
                 </span>
                 
                                   {/* Botón Siguiente */}
                  {configForm.year < Math.max(...availableYears) && (
                    <button
                      onClick={() => {
                        const currentIndex = availableYears.indexOf(configForm.year);
                        const nextYear = availableYears[currentIndex + 1];
                        setConfigForm(prev => ({ ...prev, year: nextYear }));
                        // No llamar loadFinance() aquí, el useEffect se encargará
                      }}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      title="Año siguiente"
                    >
                      →
                    </button>
                  )}
                 
                 {/* Contador de años */}
                 <span className="text-xs text-gray-500 ml-2">
                   {availableYears.indexOf(configForm.year) + 1} de {availableYears.length}
                 </span>
               </div>
             ) : (
               <span className="text-gray-400">Cargando años...</span>
             )}
           </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert type="error" message={error} className="mb-6" />}
      
      {/* Success Alert */}
      {successMessage && <Alert type="success" message={successMessage} className="mb-6" />}

      {/* Info Alert - Año Actual */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="text-blue-600 mr-2" size={20} />
            <div>
              <p className="text-blue-800 font-medium">Año Fiscal: {configForm.year}</p>
              <p className="text-blue-600 text-sm">
                {configForm.year === new Date().getFullYear() ? 'Año actual' : 
                 configForm.year > new Date().getFullYear() ? 'Año futuro' : 'Año anterior'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-600 text-sm">
              {availableYears.length > 0 ? `${availableYears.length} año(s) disponible(s)` : 'Cargando años...'}
            </p>
            <p className="text-blue-500 text-xs">
              {availableYears.includes(new Date().getFullYear()) ? 'Incluye año actual' : 'No incluye año actual'}
            </p>
          </div>
        </div>
      </div>

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
              <select
                value={configForm.year}
                onChange={(e) => setConfigForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
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
                        {/* Información del monto máximo permitido */}
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
                          <div className="flex justify-between">
                            <span>Cuota mensual:</span>
                            <span className="font-medium">{safeFormatCurrency(finance?.monthly_fee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>DJ Anual:</span>
                            <span className="font-medium">{safeFormatCurrency(finance?.annual_fee)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1 mt-1">
                            <span>Total anual:</span>
                            <span className="font-medium text-purple-600">{safeFormatCurrency((Number(finance?.monthly_fee) || 0) * 12 + (Number(finance?.annual_fee) || 0))}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1 mt-1">
                            <span>Ya pagado:</span>
                            <span className="font-medium">{safeFormatCurrency(getTotalPaidThisYear())}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1 mt-1">
                            <span>Máximo permitido:</span>
                            <span className="font-medium text-blue-600">{safeFormatCurrency(getMaxAllowedAmount())}</span>
                          </div>

                        </div>
                        
                        <div>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Monto a pagar"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              (() => {
                                const maxAllowed = getMaxAllowedAmount();
                                return !isNaN(maxAllowed) && paymentForm.amount > maxAllowed ? 'border-red-500' : 'border-gray-300';
                              })()
                            }`}
                          />
                          {(() => {
                            const maxAllowed = getMaxAllowedAmount();
                            if (!isNaN(maxAllowed) && paymentForm.amount > maxAllowed) {
                              return (
                                <p className="text-xs text-red-600 mt-1">
                                  Monto excede el máximo permitido: {formatCurrency(maxAllowed)}
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
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
                            disabled={(() => {
                              const maxAllowed = getMaxAllowedAmount();
                              return !isNaN(maxAllowed) && paymentForm.amount > maxAllowed;
                            })()}
                            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                              (() => {
                                const maxAllowed = getMaxAllowedAmount();
                                if (!isNaN(maxAllowed) && paymentForm.amount > maxAllowed) {
                                  return 'bg-gray-400 text-gray-200 cursor-not-allowed';
                                }
                                return 'bg-green-600 text-white hover:bg-green-700';
                              })()
                            }`}
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
