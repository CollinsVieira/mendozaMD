import React from 'react';
import { DollarSign, FileText, User, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';

const RecentFinanceActivity: React.FC = () => {
  const { recentActivities, isLoading } = useFinance();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign size={16} className="text-green-600" />;
      case 'declaration':
        return <FileText size={16} className="text-blue-600" />;
      case 'client_created':
        return <User size={16} className="text-purple-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'observed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'accepted':
        return 'Aceptado';
      case 'observed':
        return 'Observado';
      default:
        return status;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoy';
    } else if (diffDays === 2) {
      return 'Ayer';
    } else if (diffDays <= 7) {
      return `Hace ${diffDays - 1} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Actividad Financiera Reciente</h3>
          <Clock size={20} className="text-gray-400" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Actividad Financiera Reciente</h3>
        <Clock size={20} className="text-gray-400" />
      </div>

      <div className="space-y-4">
        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
            <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getActivityIcon(activity.type)}
                    <h4 className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </h4>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                    <div className="flex items-center space-x-1">
                      <User size={12} />
                      <span>{activity.user}</span>
                    </div>
                    <span>•</span>
                    <span>{activity.clientName}</span>
                    {activity.amount && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(activity.amount)}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {formatDate(activity.date)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                      {getStatusText(activity.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Clock size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay actividad financiera reciente</p>
            <p className="text-gray-400 text-sm mt-1">Las actividades aparecerán aquí cuando se registren pagos o declaraciones</p>
          </div>
        )}
      </div>

      {recentActivities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Últimos 7 días</span>
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              Ver todas las actividades
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentFinanceActivity;
