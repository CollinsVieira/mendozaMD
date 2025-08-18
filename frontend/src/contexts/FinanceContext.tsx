import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import financeService from '../services/financeService';
import operationalService from '../services/operationalService';
import clientService from '../services/clientService';

interface FinanceStats {
  totalClients: number;
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  monthlyDeclarations: number;
  pendingDeclarations: number;
}

interface RecentActivity {
  id: string;
  type: 'payment' | 'declaration' | 'client_created';
  description: string;
  amount?: number;
  clientName: string;
  date: string;
  user: string;
  status: string;
}

interface FinanceContextType {
  financeStats: FinanceStats;
  recentActivities: RecentActivity[];
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  refreshActivities: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

interface FinanceProviderProps {
  children: ReactNode;
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const [financeStats, setFinanceStats] = useState<FinanceStats>({
    totalClients: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
    monthlyDeclarations: 0,
    pendingDeclarations: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      refreshStats();
      refreshActivities();
    }
  }, [user]);

  const refreshStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Obtener estadísticas de clientes
      const clientsResponse = await clientService.getClients();
      const clients = clientsResponse.results || [];
      
      if (!Array.isArray(clients)) {
        setError('Error: Los clientes no tienen el formato esperado');
        return;
      }
      
      // Calcular estadísticas de finanzas
      let totalRevenue = 0;
      let pendingPayments = 0;
      let overduePayments = 0;
      let monthlyDeclarations = 0;
      let pendingDeclarations = 0;

      // Procesar cada cliente para obtener estadísticas
      for (const client of clients) {
        try {
          // Obtener finanzas del año actual
          const currentYear = new Date().getFullYear();
          const finance = await financeService.getClientFinance(client.id, currentYear);
          
          if (finance) {
            totalRevenue += Number(finance.total_paid) || 0;
            pendingPayments += Number(finance.total_balance) || 0;
            
            // Contar pagos vencidos (meses anteriores al actual)
            const currentMonth = new Date().getMonth() + 1;
            finance.monthly_payments?.forEach(payment => {
              if (payment.month && payment.balance && payment.month < currentMonth && payment.balance > 0) {
                overduePayments += Number(payment.balance) || 0;
              }
            });
          }

          // Obtener control operativo del año actual
          const operational = await operationalService.getOperationalControl(client.id, currentYear);
          if (operational) {
            monthlyDeclarations += operational.monthly_declarations?.length || 0;
            
            // Contar declaraciones pendientes
            operational.monthly_declarations?.forEach(declaration => {
              if (declaration.tax_declarations?.length === 0) {
                pendingDeclarations++;
              }
            });
          }
        } catch (error) {
          console.error(`Error processing client ${client.id}:`, error);
        }
      }

      const stats = {
        totalClients: clients.length,
        totalRevenue: Number.isFinite(totalRevenue) ? totalRevenue : 0,
        pendingPayments: Number.isFinite(pendingPayments) ? pendingPayments : 0,
        overduePayments: Number.isFinite(overduePayments) ? overduePayments : 0,
        monthlyDeclarations: Number.isFinite(monthlyDeclarations) ? monthlyDeclarations : 0,
        pendingDeclarations: Number.isFinite(pendingDeclarations) ? pendingDeclarations : 0
      };
      
      setFinanceStats(stats);
      
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error al cargar estadísticas financieras');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshActivities = async () => {
    try {
      const activities: RecentActivity[] = [];
      const clientsResponse = await clientService.getClients();
      const clients = clientsResponse.results || [];
      
      if (!Array.isArray(clients)) {
        return;
      }
      
      const currentYear = new Date().getFullYear();

      // Procesar actividades recientes de los últimos 7 días
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      for (const client of clients.slice(0, 10)) { // Solo los primeros 10 clientes para rendimiento
        try {
          // Verificar finanzas recientes
          const finance = await financeService.getClientFinance(client.id, currentYear);
          if (finance) {
            finance.monthly_payments?.forEach(payment => {
              if (payment.transactions?.length > 0) {
                const lastTransaction = payment.transactions[0];
                const transactionDate = new Date(lastTransaction.payment_date);
                
                if (transactionDate >= sevenDaysAgo) {
                  activities.push({
                    id: `payment_${lastTransaction.id}`,
                    type: 'payment',
                    description: `Pago registrado para ${payment.month_name}`,
                    amount: lastTransaction.amount,
                    clientName: client.name,
                    date: lastTransaction.payment_date,
                    user: lastTransaction.created_by_name || 'Usuario',
                    status: 'completed'
                  });
                }
              }
            });
          }

          // Verificar control operativo reciente
          const operational = await operationalService.getOperationalControl(client.id, currentYear);
          if (operational) {
            operational.monthly_declarations?.forEach(declaration => {
              if (declaration.tax_declarations?.length > 0) {
                const lastDeclaration = declaration.tax_declarations[0];
                const declarationDate = new Date(lastDeclaration.created_at);
                
                if (declarationDate >= sevenDaysAgo) {
                  activities.push({
                    id: `declaration_${lastDeclaration.id}`,
                    type: 'declaration',
                    description: `PDT ${lastDeclaration.pdt_type_display} registrado para ${declaration.month_name}`,
                    clientName: client.name,
                    date: lastDeclaration.created_at,
                    user: lastDeclaration.created_by_name || 'Usuario',
                    status: lastDeclaration.status
                  });
                }
              }
            });
          }
        } catch (error) {
          console.error(`Error processing client activities ${client.id}:`, error);
        }
      }

      // Ordenar por fecha y tomar las más recientes
      const sortedActivities = activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      
      setRecentActivities(sortedActivities);
    } catch (error: any) {
      console.error('Error en refreshActivities:', error);
    }
  };

  const value: FinanceContextType = {
    financeStats,
    recentActivities,
    isLoading,
    error,
    refreshStats,
    refreshActivities
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
