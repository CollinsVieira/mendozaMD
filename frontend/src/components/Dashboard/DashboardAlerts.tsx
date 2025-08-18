import React from 'react';
import { AlertTriangle, DollarSign, FileText, Clock, CheckCircle } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';

const DashboardAlerts: React.FC = () => {
  const { financeStats } = useFinance();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const getAlerts = () => {
    const alerts = [];

    // Alertas de pagos vencidos
    if (financeStats.overduePayments > 0) {
      alerts.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Pagos Vencidos Requieren Atención',
        message: `Hay ${formatCurrency(financeStats.overduePayments)} en pagos vencidos que requieren seguimiento inmediato.`,
        action: 'Revisar Pagos Vencidos'
      });
    }

    // Alertas de pagos pendientes altos
    if (financeStats.pendingPayments > 10000) {
      alerts.push({
        type: 'info',
        icon: DollarSign,
        title: 'Pagos Pendientes Elevados',
        message: `El total de pagos pendientes es ${formatCurrency(financeStats.pendingPayments)}. Considera implementar estrategias de cobranza.`,
        action: 'Ver Estrategias de Cobranza'
      });
    }

    // Alertas de declaraciones pendientes
    if (financeStats.pendingDeclarations > 5) {
      alerts.push({
        type: 'warning',
        icon: FileText,
        title: 'Declaraciones Pendientes',
        message: `Hay ${financeStats.pendingDeclarations} declaraciones pendientes que requieren completarse.`,
        action: 'Completar Declaraciones'
      });
    }

    // Alertas de rendimiento positivo
    if (financeStats.totalRevenue > 50000 && financeStats.overduePayments < 1000) {
      alerts.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Excelente Rendimiento Financiero',
        message: `Los ingresos totales son ${formatCurrency(financeStats.totalRevenue)} y los pagos vencidos están bajo control.`,
        action: 'Ver Reporte Detallado'
      });
    }

    // Alertas de mes próximo a terminar
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth >= 11) {
      alerts.push({
        type: 'info',
        icon: Clock,
        title: 'Preparación para Fin de Año',
        message: 'El año fiscal está próximo a terminar. Asegúrate de que todas las declaraciones estén completas.',
        action: 'Revisar Estado Anual'
      });
    }

    return alerts;
  };

  const alerts = getAlerts();

  if (alerts.length === 0) {
    return null;
  }

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Alertas Importantes</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <AlertTriangle size={16} />
          <span>{alerts.length} alerta{alerts.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert, index) => {
          const Icon = alert.icon;
          return (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getAlertStyles(alert.type)}`}
            >
              <div className="flex items-start space-x-3">
                <Icon size={20} className={`mt-0.5 ${getIconColor(alert.type)}`} />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{alert.title}</h4>
                  <p className="text-sm mb-3 opacity-90">{alert.message}</p>
                  <button className="text-sm font-medium underline hover:no-underline">
                    {alert.action}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardAlerts;
