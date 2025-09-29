import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, DollarSign, Calendar, Download, Crown, ShoppingCart, Users, FileText, Package } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useOrder } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import FinancialAlerts from './FinancialAlerts';
import FinancialKPIs from './FinancialKPIs';
import CashflowChart from './charts/CashflowChart';
import RevenueEvolutionChart from './charts/RevenueEvolutionChart';
import PaymentStatusChart from './charts/PaymentStatusChart';
import PaymentMethodChart from './charts/PaymentMethodChart';
import PaymentDelayChart from './charts/PaymentDelayChart';
import TopClientsChart from './charts/TopClientsChart';
import OrdersRevenueChart from './charts/OrdersRevenueChart';
import ClientTypeAnalysisChart from './charts/ClientTypeAnalysisChart';
import ComprehensiveRevenueChart from './charts/ComprehensiveRevenueChart';

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { invoices, clients } = useData();
  const { orders } = useOrder();
  const { user } = useAuth();

  // Vérifier l'accès PRO
  const isProActive = user?.company.subscription === 'pro' && user?.company.expiryDate && 
    new Date(user.company.expiryDate) > new Date();

  if (!isProActive) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            🔒 Fonctionnalité PRO
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            La Gestion Financière est réservée aux abonnés PRO. 
            Passez à la version PRO pour accéder à cette fonctionnalité avancée.
          </p>
          <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200">
            <span className="flex items-center justify-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Passer à PRO - 299 MAD/mois</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Préparer les données d'évolution du chiffre d'affaires avec les vraies données
  const revenueEvolutionData = useMemo(() => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ];
    
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    return months.map((month, index) => {
      // Revenus année actuelle
      const currentYearRevenue = invoices
        .filter(invoice => {
          const invoiceDate = new Date(invoice.date);
          return invoiceDate.getMonth() === index && 
                 invoiceDate.getFullYear() === currentYear &&
                 (invoice.status === 'paid' || invoice.status === 'collected');
        })
        .reduce((sum, invoice) => sum + invoice.totalTTC, 0);

      // Revenus année précédente
      const previousYearRevenue = invoices
        .filter(invoice => {
          const invoiceDate = new Date(invoice.date);
          return invoiceDate.getMonth() === index && 
                 invoiceDate.getFullYear() === previousYear &&
                 (invoice.status === 'paid' || invoice.status === 'collected');
        })
        .reduce((sum, invoice) => sum + invoice.totalTTC, 0);

      return {
        month,
        currentYear: currentYearRevenue,
        previousYear: previousYearRevenue,
        date: `${currentYear}-${String(index + 1).padStart(2, '0')}-01`
      };
    });
  }, [invoices]);

  // Préparer les données de statut de paiement avec les vraies données
  const paymentStatusData = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return [
        { name: 'Payées', value: 0, amount: 0, percentage: 0, color: '#10B981' },
        { name: 'Non payées', value: 0, amount: 0, percentage: 0, color: '#EF4444' },
        { name: 'Encaissées', value: 0, amount: 0, percentage: 0, color: '#F59E0B' }
      ];
    }

    // Grouper par statut réel des factures
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
    const collectedInvoices = invoices.filter(inv => inv.status === 'collected');
    
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
    const collectedAmount = collectedInvoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
    
    const totalAmount = paidAmount + unpaidAmount + collectedAmount;

    const data = [
      { 
        name: 'Payées', 
        value: paidInvoices.length, 
        amount: paidAmount,
        color: '#10B981' 
      },
      { 
        name: 'Non payées', 
        value: unpaidInvoices.length, 
        amount: unpaidAmount,
        color: '#EF4444' 
      },
      { 
        name: 'Encaissées', 
        value: collectedInvoices.length, 
        amount: collectedAmount,
        color: '#F59E0B' 
      }
    ];

    // Calculate percentages
    return data.map(item => ({
      ...item,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
    }));
  }, [invoices]);

  // Données pour l'analyse des commandes
  const ordersRevenueData = useMemo(() => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ];
    
    const currentYear = new Date().getFullYear();
    
    // Fonction pour vérifier si une commande société a déjà une facture
    const hasInvoiceForOrder = (orderId: string) => {
      return invoices.some(invoice => invoice.orderId === orderId);
    };
    
    return months.map((month, index) => {
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        const isCurrentMonth = orderDate.getMonth() === index && 
                              orderDate.getFullYear() === currentYear &&
                              order.status === 'livre';
        
        if (!isCurrentMonth) return false;
        
        // Inclure toutes les commandes particuliers
        if (order.clientType === 'personne_physique') return true;
        
        // Inclure seulement les commandes sociétés qui n'ont PAS de facture
        if (order.clientType === 'societe') {
          return !hasInvoiceForOrder(order.id);
        }
        
        return false;
      });
      
      const totalRevenue = monthOrders.reduce((sum, order) => sum + order.totalTTC, 0);
      const societesRevenue = monthOrders
        .filter(order => order.clientType === 'societe')
        .reduce((sum, order) => sum + order.totalTTC, 0);
      const particuliersRevenue = monthOrders
        .filter(order => order.clientType === 'personne_physique')
        .reduce((sum, order) => sum + order.totalTTC, 0);
      
      return {
        month,
        totalRevenue,
        societesRevenue,
        particuliersRevenue,
        ordersCount: monthOrders.length
      };
    });
  }, [orders]);

  // Analyse par type de client
  const clientTypeAnalysis = useMemo(() => {
    // Fonction pour vérifier si une commande société a déjà une facture
    const hasInvoiceForOrder = (orderId: string) => {
      return invoices.some(invoice => invoice.orderId === orderId);
    };

    const invoiceStats = {
      societes: {
        count: invoices.filter(inv => inv.client && clients.find(c => c.id === inv.clientId)).length,
        revenue: invoices
          .filter(inv => inv.client && clients.find(c => c.id === inv.clientId) && (inv.status === 'paid' || inv.status === 'collected'))
          .reduce((sum, inv) => sum + inv.totalTTC, 0)
      },
      particuliers: {
        count: 0, // Les factures sont toujours liées à des clients sociétés
        revenue: 0
      }
    };
    
    const orderStats = {
      societes: {
        count: orders.filter(order => 
          order.clientType === 'societe' && 
          order.status === 'livre' && 
          !hasInvoiceForOrder(order.id)
        ).length,
        revenue: orders
          .filter(order => 
            order.clientType === 'societe' && 
            order.status === 'livre' && 
            !hasInvoiceForOrder(order.id)
          )
          .reduce((sum, order) => sum + order.totalTTC, 0)
      },
      particuliers: {
        count: orders.filter(order => order.clientType === 'personne_physique' && order.status === 'livre').length,
        revenue: orders
          .filter(order => order.clientType === 'personne_physique' && order.status === 'livre')
          .reduce((sum, order) => sum + order.totalTTC, 0)
      }
    };
    
    return {
      invoices: invoiceStats,
      orders: orderStats,
      combined: {
        societes: {
          count: invoiceStats.societes.count + orderStats.societes.count,
          revenue: invoiceStats.societes.revenue + orderStats.societes.revenue
        },
        particuliers: {
          count: invoiceStats.particuliers.count + orderStats.particuliers.count,
          revenue: invoiceStats.particuliers.revenue + orderStats.particuliers.revenue
        }
      }
    };
  }, [invoices, orders, clients]);

  // Données complètes pour le graphique de revenus
  const comprehensiveRevenueData = useMemo(() => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ];
    
    const currentYear = new Date().getFullYear();
    
    // Fonction pour vérifier si une commande société a déjà une facture
    const hasInvoiceForOrder = (orderId: string) => {
      return invoices.some(invoice => invoice.orderId === orderId);
    };
    
    return months.map((month, index) => {
      // Revenus des factures
      const invoiceRevenue = invoices
        .filter(invoice => {
          const invoiceDate = new Date(invoice.date);
          return invoiceDate.getMonth() === index && 
                 invoiceDate.getFullYear() === currentYear &&
                 (invoice.status === 'paid' || invoice.status === 'collected');
        })
        .reduce((sum, invoice) => sum + invoice.totalTTC, 0);
      
      // Revenus des commandes (sans doublons avec les factures)
      const orderRevenue = orders
        .filter(order => {
          const orderDate = new Date(order.orderDate);
          const isCurrentMonth = orderDate.getMonth() === index && 
                                 orderDate.getFullYear() === currentYear &&
                                 order.status === 'livre';
          
          if (!isCurrentMonth) return false;
          
          // Inclure toutes les commandes particuliers
          if (order.clientType === 'personne_physique') return true;
          
          // Inclure seulement les commandes sociétés qui n'ont PAS de facture
          if (order.clientType === 'societe') {
            return !hasInvoiceForOrder(order.id);
          }
          
          return false;
        })
        .reduce((sum, order) => sum + order.totalTTC, 0);
      
      return {
        month,
        invoices: invoiceRevenue,
        orders: orderRevenue,
        total: invoiceRevenue + orderRevenue
      };
    });
  }, [invoices, orders]);
  // Préparer les données de mode de paiement avec les vraies données
  const paymentMethodData = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return [];
    }

    const paidInvoices = invoices.filter(inv => 
      (inv.status === 'paid' || inv.status === 'collected') && inv.paymentMethod
    );

    if (paidInvoices.length === 0) {
      return [];
    }

    const methodStats = paidInvoices.reduce((acc: any, invoice) => {
      const method = invoice.paymentMethod || 'virement';
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count += 1;
      acc[method].amount += invoice.totalTTC;
      return acc;
    }, {});

    const totalAmount = Object.values(methodStats).reduce((sum: number, stat: any) => sum + stat.amount, 0);
    
    const methodLabels: Record<string, string> = {
      'virement': 'Virement',
      'espece': 'Espèces',
      'cheque': 'Chèque',
      'effet': 'Effet'
    };

    return Object.entries(methodStats).map(([method, stats]: [string, any]) => ({
      name: methodLabels[method] || method,
      value: stats.amount,
      count: stats.count,
      percentage: totalAmount > 0 ? (stats.amount / totalAmount) * 100 : 0
    })).filter(item => item.value > 0);
  }, [invoices]);

  // Préparer les données de retard de paiement avec les vraies données
  const paymentDelayData = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    
    // Filtrer les factures en retard
    const overdueInvoices = invoices.filter(invoice => {
      if (invoice.status !== 'unpaid' || !invoice.dueDate) return false;
      const dueDate = new Date(invoice.dueDate);
      return new Date() > dueDate;
    });

    if (overdueInvoices.length === 0) return [];
    
    // Grouper par client
    const clientDelayStats = overdueInvoices.reduce((acc: any, invoice) => {
      const clientName = invoice.client.name;
      const dueDate = new Date(invoice.dueDate!);
      const currentDate = new Date();
      const delayDays = Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      if (!acc[clientName]) {
        acc[clientName] = {
          clientName,
          totalAmount: 0,
          averageDelay: 0,
          invoiceCount: 0,
          totalDelay: 0
        };
      }
      
      acc[clientName].totalAmount += invoice.totalTTC;
      acc[clientName].invoiceCount += 1;
      acc[clientName].totalDelay += delayDays;
      acc[clientName].averageDelay = acc[clientName].totalDelay / acc[clientName].invoiceCount;
      
      return acc;
    }, {});
    
    return Object.values(clientDelayStats)
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [invoices]);

  const periods = [
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' },
    { value: 'year', label: 'Cette année' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <span>Gestion Financière</span>
            <Crown className="w-6 h-6 text-yellow-500" />
          </h1>


          
          <p className="text-gray-600 dark:text-gray-300">Analyses financières complètes et KPIs de performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          
         
        </div>
      </div>

      {/* KPIs Financiers */}
      <FinancialKPIs invoices={invoices || []} orders={orders || []} />

      {/* Information sur l'optimisation */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-blue-900 dark:text-blue-100">📊 Calculs Optimisés</h4>
        </div>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Les calculs financiers évitent maintenant les doublons : 
          <strong> Factures payées</strong> + <strong>Commandes particuliers livrées</strong> + 
          <strong>Commandes sociétés livrées (sans facture créée)</strong>.
          Cela garantit un chiffre d'affaires précis sans compter deux fois les mêmes ventes.
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {clientTypeAnalysis.invoices.societes.revenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">MAD Factures (Sociétés)</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {clientTypeAnalysis.orders.societes.revenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">MAD Commandes Sociétés (sans facture)</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {clientTypeAnalysis.orders.particuliers.revenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">MAD Commandes Particuliers</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(clientTypeAnalysis.combined.societes.revenue + clientTypeAnalysis.combined.particuliers.revenue).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">MAD Total (sans doublons)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueEvolutionChart data={revenueEvolutionData} />
        <CashflowChart invoices={invoices || []} />
      </div>

      {/* Analyse complète des revenus */}
      <ComprehensiveRevenueChart data={comprehensiveRevenueData} />

      {/* Analyse des commandes par type de client */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrdersRevenueChart data={ordersRevenueData} />
        <ClientTypeAnalysisChart data={clientTypeAnalysis} />
      </div>

      {/* Top Clients */}
      <TopClientsChart invoices={invoices || []} />

      {/* Analyses de paiement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentStatusChart data={paymentStatusData} />
        {paymentMethodData.length > 0 && (
          <PaymentMethodChart data={paymentMethodData} />
        )}
      </div>

      {/* Retards de paiement */}
      {paymentDelayData.length > 0 && (
        <PaymentDelayChart data={paymentDelayData} />
      )}

      {/* Alertes financières */}
      <FinancialAlerts invoices={invoices || []} />
    </div>
  );
};

export default Reports;

