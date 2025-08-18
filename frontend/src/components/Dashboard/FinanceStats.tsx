import React from 'react';
import { DollarSign, Users, AlertTriangle, FileText, CheckCircle, Clock } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';

const FinanceStats: React.FC = () => {
  const { financeStats, isLoading } = useFinance();

  const formatCurrency = (amount: number) => {
    // Validar que el amount sea un número válido
    if (isNaN(amount) || !isFinite(amount)) {
      return 'S/ 0.00';
    }
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total de Clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{financeStats.totalClients}</p>
            <p className="text-sm text-gray-500 mt-1">Clientes activos</p>
          </div>
          <div className="p-3 rounded-xl border bg-blue-50 text-blue-600 border-blue-200">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Ingresos Totales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                         <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(financeStats.totalRevenue || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Año actual</p>
          </div>
          <div className="p-3 rounded-xl border bg-green-50 text-green-600 border-green-200">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Pagos Pendientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
                         <p className="text-3xl font-bold text-yellow-600 mt-2">{formatCurrency(financeStats.pendingPayments || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Por cobrar</p>
          </div>
          <div className="p-3 rounded-xl border bg-yellow-50 text-yellow-600 border-yellow-200">
            <Clock size={24} />
          </div>
        </div>
      </div>

             {/* Pagos Vencidos */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
         <div className="flex items-center justify-between">
           <div>
             <p className="text-sm font-medium text-gray-600">Pagos Vencidos</p>
             <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(financeStats.overduePayments || 0)}</p>
             <p className="text-sm text-gray-500 mt-1">Requieren atención</p>
           </div>
           <div className="p-3 rounded-xl border bg-red-50 text-red-600 border-red-200">
             <AlertTriangle size={24} />
           </div>
         </div>
       </div>

       {/* Estado de Pagos Anuales */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
         <div className="flex items-center justify-between">
           <div>
             <p className="text-sm font-medium text-gray-600">Estado Anual</p>
             <p className="text-3xl font-bold text-indigo-600 mt-2">
               {financeStats.totalRevenue > 0 && financeStats.pendingPayments > 0 
                 ? `${Math.round((financeStats.totalRevenue / (financeStats.totalRevenue + financeStats.pendingPayments)) * 100)}%`
                 : '0%'
               }
             </p>
             <p className="text-sm text-gray-500 mt-1">
               {financeStats.totalRevenue > 0 && financeStats.pendingPayments > 0 
                 ? `${formatCurrency(financeStats.totalRevenue)} de ${formatCurrency(financeStats.totalRevenue + financeStats.pendingPayments)}`
                 : 'Sin pagos registrados'
               }
             </p>
           </div>
           <div className="p-3 rounded-xl border bg-indigo-50 text-indigo-600 border-indigo-200">
             <CheckCircle size={24} />
           </div>
         </div>
       </div>

      {/* Declaraciones Mensuales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Declaraciones</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{financeStats.monthlyDeclarations}</p>
            <p className="text-sm text-gray-500 mt-1">Total registradas</p>
          </div>
          <div className="p-3 rounded-xl border bg-indigo-50 text-indigo-600 border-indigo-200">
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* Declaraciones Pendientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Pendientes</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{financeStats.pendingDeclarations}</p>
            <p className="text-sm text-gray-500 mt-1">Por completar</p>
          </div>
          <div className="p-3 rounded-xl border bg-orange-50 text-orange-600 border-orange-200">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceStats;
