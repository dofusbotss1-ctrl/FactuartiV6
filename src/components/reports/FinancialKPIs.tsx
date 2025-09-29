import React from 'react';
import { Invoice } from '../../contexts/DataContext';
import { useOrder } from '../../contexts/OrderContext';
import { Target, Percent, Clock, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

interface FinancialKPIsProps {
  invoices: Invoice[];
}

export default function FinancialKPIs({ invoices }: FinancialKPIsProps) {
  const { orders } = useOrder();

  // Fonction pour vérifier si une commande société a déjà une facture
  const hasInvoiceForOrder = (orderId: string) => {
    return invoices.some(invoice => invoice.orderId === orderId);
  };

  // Calculer le CA des commandes (sans doublons avec les factures)
  const calculateOrderRevenue = () => {
    return orders
      .filter(order => {
        // Inclure toutes les commandes particuliers livrées
        if (order.clientType === 'personne_physique' && order.status === 'livre') {
          return true;
        }
        // Inclure seulement les commandes sociétés livrées qui n'ont PAS de facture
        if (order.clientType === 'societe' && order.status === 'livre') {
          return !hasInvoiceForOrder(order.id);
        }
        return false;
      })
      .reduce((sum, order) => sum + order.totalTTC, 0);
  };

  // Calcul du DSO (Days Sales Outstanding)
  const calculateDSO = () => {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.dueDate);
    if (paidInvoices.length === 0) return 0;
    
    const totalDays = paidInvoices.reduce((sum, invoice) => {
      const invoiceDate = parseISO(invoice.date);
      const dueDate = parseISO(invoice.dueDate!);
      return sum + Math.max(0, differenceInDays(new Date(), dueDate));
    }, 0);
    
    return totalDays / paidInvoices.length;
  };

  // Calcul du taux de recouvrement
  const calculateRecoveryRate = () => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
    const totalPaid = invoices
      .filter(inv => inv.status === 'paid' || inv.status === 'collected')
      .reduce((sum, inv) => sum + inv.totalTTC, 0);
    
    return totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;
  };

  // Calcul du taux de croissance
  const calculateGrowthRate = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Revenus factures du mois actuel
    const currentMonthInvoiceRevenue = invoices
      .filter(inv => {
        const invDate = parseISO(inv.date);
        return invDate.getMonth() === currentMonth && 
               invDate.getFullYear() === currentYear &&
               (inv.status === 'paid' || inv.status === 'collected');
      })
      .reduce((sum, inv) => sum + inv.totalTTC, 0);
    
    // Revenus commandes du mois actuel (sans doublons)
    const currentMonthOrderRevenue = orders
      .filter(order => {
        const orderDate = parseISO(order.orderDate);
        const isCurrentMonth = orderDate.getMonth() === currentMonth && 
                              orderDate.getFullYear() === currentYear &&
                              order.status === 'livre';
        
        if (!isCurrentMonth) return false;
        
        // Inclure particuliers ou sociétés sans facture
        return order.clientType === 'personne_physique' || 
               (order.clientType === 'societe' && !hasInvoiceForOrder(order.id));
      })
      .reduce((sum, order) => sum + order.totalTTC, 0);

    const currentMonthRevenue = currentMonthInvoiceRevenue + currentMonthOrderRevenue;
    
    // Même logique pour le mois précédent
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthInvoiceRevenue = invoices
      .filter(inv => {
        const invDate = parseISO(inv.date);
        return invDate.getMonth() === prevMonth && 
               invDate.getFullYear() === prevYear &&
               (inv.status === 'paid' || inv.status === 'collected');
      })
      .reduce((sum, inv) => sum + inv.totalTTC, 0);
    
    const previousMonthOrderRevenue = orders
      .filter(order => {
        const orderDate = parseISO(order.orderDate);
        const isPrevMonth = orderDate.getMonth() === prevMonth && 
                           orderDate.getFullYear() === prevYear &&
                           order.status === 'livre';
        
        if (!isPrevMonth) return false;
        
        return order.clientType === 'personne_physique' || 
               (order.clientType === 'societe' && !hasInvoiceForOrder(order.id));
      })
      .reduce((sum, order) => sum + order.totalTTC, 0);

    const previousMonthRevenue = previousMonthInvoiceRevenue + previousMonthOrderRevenue;
    
    return previousMonthRevenue > 0 ? 
      ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;
  };

  // Calcul du panier moyen
  const calculateAverageBasket = () => {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.status === 'collected');
    const relevantOrders = orders.filter(order => {
      if (order.status !== 'livre') return false;
      return order.clientType === 'personne_physique' || 
             (order.clientType === 'societe' && !hasInvoiceForOrder(order.id));
    });
    
    const totalTransactions = paidInvoices.length + relevantOrders.length;
    if (totalTransactions === 0) return 0;
    
    const invoiceRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
    const orderRevenue = relevantOrders.reduce((sum, order) => sum + order.totalTTC, 0);
    const totalRevenue = invoiceRevenue + orderRevenue;
    
    return totalRevenue / totalTransactions;
  };

  // Calcul de la marge brute
  const calculateGrossMargin = () => {
    // Calcul basé sur les factures payées + commandes livrées (sans doublons)
    const invoiceSales = invoices
      .filter(inv => inv.status === 'paid' || inv.status === 'collected')
      .reduce((sum, inv) => sum + inv.totalTTC, 0);
    
    // Commandes sans doublons avec les factures
    const orderSales = orders
      .filter(order => {
        if (order.status !== 'livre') return false;
        return order.clientType === 'personne_physique' || 
               (order.clientType === 'societe' && !hasInvoiceForOrder(order.id));
      })
      .reduce((sum, order) => sum + order.totalTTC, 0);
    
    const totalSales = invoiceSales + orderSales;
    
    // Estimation de la marge à 30% (à ajuster selon vos données réelles)
    return totalSales * 0.3;
  };

  // Calcul du chiffre d'affaires total (factures + commandes)
  const calculateTotalRevenue = () => {
    const invoiceRevenue = invoices
      .filter(inv => inv.status === 'paid' || inv.status === 'collected')
      .reduce((sum, inv) => sum + inv.totalTTC, 0);
    
    // Commandes sans doublons
    const orderRevenue = orders
      .filter(order => {
        if (order.status !== 'livre') return false;
        return order.clientType === 'personne_physique' || 
               (order.clientType === 'societe' && !hasInvoiceForOrder(order.id));
      })
      .reduce((sum, order) => sum + order.totalTTC, 0);
    
    return { invoiceRevenue, orderRevenue, total: invoiceRevenue + orderRevenue };
  };

  const dso = calculateDSO();
  const recoveryRate = calculateRecoveryRate();
  const growthRate = calculateGrowthRate();
  const averageBasket = calculateAverageBasket();
  const grossMargin = calculateGrossMargin();
  const totalRevenue = calculateTotalRevenue();

  const kpis = [
    {
      title: 'DSO',
      subtitle: 'Délai moyen d\'encaissement',
      value: `${dso.toFixed(0)} jours`,
      icon: Clock,
      color: dso <= 30 ? 'text-green-600' : dso <= 45 ? 'text-yellow-600' : 'text-red-600',
      bgColor: dso <= 30 ? 'from-green-500 to-emerald-600' : dso <= 45 ? 'from-yellow-500 to-orange-600' : 'from-red-500 to-red-600',
      trend: dso <= 30 ? 'Excellent' : dso <= 45 ? 'Correct' : 'À améliorer'
    },
    {
      title: 'Taux de Recouvrement',
      subtitle: 'Factures payées / Total',
      value: `${recoveryRate.toFixed(1)}%`,
      icon: Target,
      color: recoveryRate >= 80 ? 'text-green-600' : recoveryRate >= 60 ? 'text-yellow-600' : 'text-red-600',
      bgColor: recoveryRate >= 80 ? 'from-green-500 to-emerald-600' : recoveryRate >= 60 ? 'from-yellow-500 to-orange-600' : 'from-red-500 to-red-600',
      trend: recoveryRate >= 80 ? 'Très bon' : recoveryRate >= 60 ? 'Moyen' : 'Faible'
    },
    {
      title: 'Croissance CA',
      subtitle: 'vs mois précédent',
      value: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: growthRate > 0 ? 'text-green-600' : growthRate < 0 ? 'text-red-600' : 'text-gray-600',
      bgColor: growthRate > 0 ? 'from-green-500 to-emerald-600' : growthRate < 0 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600',
      trend: growthRate > 5 ? 'Forte croissance' : growthRate > 0 ? 'Croissance' : growthRate < -5 ? 'Forte baisse' : 'Stable'
    },
    {
      title: 'Panier Moyen',
      subtitle: 'Montant moyen par facture',
      value: `${averageBasket.toFixed(0)} MAD`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'from-blue-500 to-indigo-600',
      trend: 'Indicateur'
    },
    {
      title: 'Marge Brute Est.',
      subtitle: 'Estimation des bénéfices',
      value: `${grossMargin.toLocaleString()} MAD`,
      icon: Percent,
      color: grossMargin > 0 ? 'text-green-600' : 'text-red-600',
      bgColor: grossMargin > 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-red-600',
      trend: grossMargin > 0 ? 'Positif' : 'Négatif'
    },
    {
      title: 'CA Total',
      subtitle: 'Factures + Commandes',
      value: `${totalRevenue.total.toLocaleString()} MAD`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'from-purple-500 to-indigo-600',
      trend: 'Global'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">KPIs Financiers</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Indicateurs clés de performance</p>
        </div>
        <div className="flex items-center space-x-2 text-blue-600">
          <Target className="w-5 h-5" />
          <span className="text-sm font-medium">Tableau de bord</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          
          return (
            <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${kpi.color} font-medium`}>
                  {kpi.trend}
                </span>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{kpi.title}</p>
                <p className={`text-xl font-bold ${kpi.color} mb-1`}>{kpi.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analyse des KPIs */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Performance Globale</h4>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <p>• DSO {dso <= 30 ? 'excellent' : dso <= 45 ? 'correct' : 'à améliorer'}</p>
            <p>• Recouvrement {recoveryRate >= 80 ? 'très bon' : recoveryRate >= 60 ? 'moyen' : 'faible'}</p>
            <p>• Croissance {growthRate > 0 ? 'positive' : growthRate < 0 ? 'négative' : 'stable'}</p>
            <p>• CA Factures: {totalRevenue.invoiceRevenue.toLocaleString()} MAD</p>
            <p>• CA Commandes: {totalRevenue.orderRevenue.toLocaleString()} MAD</p>
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">🎯 Objectifs Recommandés</h4>
          <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
            <p>• DSO cible: ≤ 30 jours</p>
            <p>• Taux recouvrement: ≥ 85%</p>
            <p>• Croissance mensuelle: ≥ 5%</p>
            <p>• Équilibre Factures/Commandes optimal</p>
          </div>
        </div>
      </div>
    </div>
  );
}