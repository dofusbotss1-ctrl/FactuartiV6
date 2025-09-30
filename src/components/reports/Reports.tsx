// path: src/components/reports/Reports.tsx
import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Crown, ShoppingCart, Users, FileText, Package, X as CloseIcon, Calendar as CalendarIcon } from 'lucide-react';
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
  const [startDate, setStartDate] = useState<string>('');   // format: YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>('');

  const { invoices, clients } = useData();
  const { orders } = useOrder();
  const { user } = useAuth();

  // Accès PRO
  const isProActive =
    user?.company.subscription === 'pro' &&
    user?.company.expiryDate &&
    new Date(user.company.expiryDate) > new Date();

  if (!isProActive) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">🔒 Fonctionnalité PRO</h2>
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

  // Normalisation dates (Why: inclure toute la journée)
  const startAt = useMemo(() => (startDate ? new Date(`${startDate}T00:00:00.000`) : null), [startDate]);
  const endAt = useMemo(() => (endDate ? new Date(`${endDate}T23:59:59.999`) : null), [endDate]);
  const invalidRange = !!(startAt && endAt && startAt > endAt);

  const isInRange = (d: Date) => {
    if (invalidRange) return false;
    if (startAt && d < startAt) return false;
    if (endAt && d > endAt) return false;
    return true;
  };

  // Listes filtrées par plage
  const filteredInvoices = useMemo(() => {
    const list = invoices || [];
    if (!startAt && !endAt) return list;
    return list.filter((inv: any) => isInRange(new Date(inv.date)));
  }, [invoices, startAt, endAt, invalidRange]);

  const filteredOrders = useMemo(() => {
    const list = orders || [];
    if (!startAt && !endAt) return list;
    return list.filter((ord: any) => isInRange(new Date(ord.orderDate)));
  }, [orders, startAt, endAt, invalidRange]);

  // Évolution CA (mois courant / précédent) — s’appuie sur filteredInvoices
  const revenueEvolutionData = useMemo(() => {
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    return months.map((month, index) => {
      const currentYearRevenue = filteredInvoices
        .filter((invoice: any) => {
          const d = new Date(invoice.date);
          return d.getMonth() === index &&
                 d.getFullYear() === currentYear &&
                 (invoice.status === 'paid' || invoice.status === 'collected');
        })
        .reduce((sum: number, inv: any) => sum + inv.totalTTC, 0);

      const previousYearRevenue = filteredInvoices
        .filter((invoice: any) => {
          const d = new Date(invoice.date);
          return d.getMonth() === index &&
                 d.getFullYear() === previousYear &&
                 (invoice.status === 'paid' || invoice.status === 'collected');
        })
        .reduce((sum: number, inv: any) => sum + inv.totalTTC, 0);

      return {
        month,
        currentYear: currentYearRevenue,
        previousYear: previousYearRevenue,
        date: `${currentYear}-${String(index + 1).padStart(2, '0')}-01`,
      };
    });
  }, [filteredInvoices]);

  // Statut de paiement
  const paymentStatusData = useMemo(() => {
    if (!filteredInvoices || filteredInvoices.length === 0)
      return [
        { name: 'Payées', value: 0, amount: 0, percentage: 0, color: '#10B981' },
        { name: 'Non payées', value: 0, amount: 0, percentage: 0, color: '#EF4444' },
        { name: 'Encaissées', value: 0, amount: 0, percentage: 0, color: '#F59E0B' },
      ];

    const paid = filteredInvoices.filter((inv: any) => inv.status === 'paid');
    const unpaid = filteredInvoices.filter((inv: any) => inv.status === 'unpaid');
    const collected = filteredInvoices.filter((inv: any) => inv.status === 'collected');

    const paidAmount = paid.reduce((s: number, inv: any) => s + inv.totalTTC, 0);
    const unpaidAmount = unpaid.reduce((s: number, inv: any) => s + inv.totalTTC, 0);
    const collectedAmount = collected.reduce((s: number, inv: any) => s + inv.totalTCC ?? inv.totalTTC, 0) - 0; // tolérance typo totalTCC
    const totalAmount = paidAmount + unpaidAmount + collectedAmount;

    const base = [
      { name: 'Payées', value: paid.length, amount: paidAmount, color: '#10B981' },
      { name: 'Non payées', value: unpaid.length, amount: unpaidAmount, color: '#EF4444' },
      { name: 'Encaissées', value: collected.length, amount: collectedAmount, color: '#F59E0B' },
    ];

    return base.map((x) => ({ ...x, percentage: totalAmount > 0 ? (x.amount / totalAmount) * 100 : 0 }));
  }, [filteredInvoices]);

  // CA des commandes par mois (sans doublons facture)
  const ordersRevenueData = useMemo(() => {
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const currentYear = new Date().getFullYear();

    const hasInvoiceForOrder = (orderId: string) =>
      filteredInvoices.some((invoice: any) => invoice.orderId === orderId);

    return months.map((month, index) => {
      const monthOrders = filteredOrders.filter((order: any) => {
        const d = new Date(order.orderDate);
        const isCurrentMonth = d.getMonth() === index && d.getFullYear() === currentYear && order.status === 'livre';
        if (!isCurrentMonth) return false;
        if (order.clientType === 'personne_physique') return true;
        if (order.clientType === 'societe') return !hasInvoiceForOrder(order.id);
        return false;
      });

      const totalRevenue = monthOrders.reduce((s: number, o: any) => s + o.totalTTC, 0);
      const societesRevenue = monthOrders.filter((o: any) => o.clientType === 'societe').reduce((s: number, o: any) => s + o.totalTTC, 0);
      const particuliersRevenue = monthOrders.filter((o: any) => o.clientType === 'personne_physique').reduce((s: number, o: any) => s + o.totalTTC, 0);

      return { month, totalRevenue, societesRevenue, particuliersRevenue, ordersCount: monthOrders.length };
    });
  }, [filteredOrders, filteredInvoices]);

  // Analyse par type client (factures + commandes non doublonnées)
  const clientTypeAnalysis = useMemo(() => {
    const hasInvoiceForOrder = (orderId: string) =>
      filteredInvoices.some((invoice: any) => invoice.orderId === orderId);

    const invoiceStats = {
      societes: {
        count: filteredInvoices.filter((inv: any) => inv.client && clients.find((c: any) => c.id === inv.clientId)).length,
        revenue: filteredInvoices
          .filter(
            (inv: any) =>
              inv.client &&
              clients.find((c: any) => c.id === inv.clientId) &&
              (inv.status === 'paid' || inv.status === 'collected'),
          )
          .reduce((s: number, inv: any) => s + inv.totalTTC, 0),
      },
      particuliers: { count: 0, revenue: 0 },
    };

    const societeOrders = filteredOrders.filter(
      (o: any) => o.clientType === 'societe' && o.status === 'livre' && !hasInvoiceForOrder(o.id),
    );
    const particulierOrders = filteredOrders.filter((o: any) => o.clientType === 'personne_physique' && o.status === 'livre');

    const orderStats = {
      societes: {
        count: societeOrders.length,
        revenue: societeOrders.reduce((s: number, o: any) => s + o.totalTTC, 0),
      },
      particuliers: {
        count: particulierOrders.length,
        revenue: particulierOrders.reduce((s: number, o: any) => s + o.totalTTC, 0),
      },
    };

    return {
      invoices: invoiceStats,
      orders: orderStats,
      combined: {
        societes: {
          count: invoiceStats.societes.count + orderStats.societes.count,
          revenue: invoiceStats.societes.revenue + orderStats.societes.revenue,
        },
        particuliers: {
          count: invoiceStats.particuliers.count + orderStats.particuliers.count,
          revenue: invoiceStats.particuliers.revenue + orderStats.particuliers.revenue,
        },
      },
    };
  }, [filteredInvoices, filteredOrders, clients]);

  // Revenu global (factures + commandes non doublonnées)
  const comprehensiveRevenueData = useMemo(() => {
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const currentYear = new Date().getFullYear();

    const hasInvoiceForOrder = (orderId: string) =>
      filteredInvoices.some((invoice: any) => invoice.orderId === orderId);

    return months.map((month, index) => {
      const invoiceRevenue = filteredInvoices
        .filter((invoice: any) => {
          const d = new Date(invoice.date);
          return d.getMonth() === index && d.getFullYear() === currentYear && (invoice.status === 'paid' || invoice.status === 'collected');
        })
        .reduce((s: number, inv: any) => s + inv.totalTTC, 0);

      const orderRevenue = filteredOrders
        .filter((order: any) => {
          const d = new Date(order.orderDate);
          const ok = d.getMonth() === index && d.getFullYear() === currentYear && order.status === 'livre';
          if (!ok) return false;
          if (order.clientType === 'personne_physique') return true;
          if (order.clientType === 'societe') return !hasInvoiceForOrder(order.id);
          return false;
        })
        .reduce((s: number, o: any) => s + o.totalTTC, 0);

      return { month, invoices: invoiceRevenue, orders: orderRevenue, total: invoiceRevenue + orderRevenue };
    });
  }, [filteredInvoices, filteredOrders]);

  // Méthodes de paiement
  const paymentMethodData = useMemo(() => {
    if (!filteredInvoices || filteredInvoices.length === 0) return [];
    const paid = filteredInvoices.filter((inv: any) => (inv.status === 'paid' || inv.status === 'collected') && inv.paymentMethod);
    if (paid.length === 0) return [];
    const stats = paid.reduce((acc: any, inv: any) => {
      const m = inv.paymentMethod || 'virement';
      if (!acc[m]) acc[m] = { count: 0, amount: 0 };
      acc[m].count += 1;
      acc[m].amount += inv.totalTTC;
      return acc;
    }, {});
    const total = Object.values(stats).reduce((s: number, st: any) => s + st.amount, 0);
    const labels: Record<string, string> = { virement: 'Virement', espece: 'Espèces', cheque: 'Chèque', effet: 'Effet' };
    return Object.entries(stats)
      .map(([method, st]: [string, any]) => ({
        name: labels[method] || method,
        value: st.amount,
        count: st.count,
        percentage: total > 0 ? (st.amount / total) * 100 : 0,
      }))
      .filter((x) => x.value > 0);
  }, [filteredInvoices]);

  // Retards de paiement
  const paymentDelayData = useMemo(() => {
    if (!filteredInvoices || filteredInvoices.length === 0) return [];
    const overdue = filteredInvoices.filter((inv: any) => {
      if (inv.status !== 'unpaid' || !inv.dueDate) return false;
      const d = new Date(inv.dueDate);
      return new Date() > d;
    });
    if (overdue.length === 0) return [];
    const byClient = overdue.reduce((acc: any, inv: any) => {
      const clientName = inv?.client?.name || 'Client';
      const due = new Date(inv.dueDate!);
      const now = new Date();
      const days = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
      if (!acc[clientName]) acc[clientName] = { clientName, totalAmount: 0, averageDelay: 0, invoiceCount: 0, totalDelay: 0 };
      acc[clientName].totalAmount += inv.totalTTC;
      acc[clientName].invoiceCount += 1;
      acc[clientName].totalDelay += days;
      acc[clientName].averageDelay = acc[clientName].totalDelay / acc[clientName].invoiceCount;
      return acc;
    }, {});
    return Object.values(byClient)
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [filteredInvoices]);

  const periods = [
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' },
    { value: 'year', label: 'Cette année' },
  ];

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  const hasActiveDateFilter = !!(startAt || endAt);

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

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <CalendarIcon className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                aria-label="Date de début"
              />
            </div>
            <span className="text-gray-600 dark:text-gray-300">→</span>
            <div className="relative">
              <CalendarIcon className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                aria-label="Date de fin"
              />
            </div>

            {hasActiveDateFilter && (
              <button
                onClick={clearDates}
                className="inline-flex items-center gap-1 px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50"
                title="Réinitialiser le filtre de dates"
              >
                <CloseIcon className="w-4 h-4" />
                Réinitialiser
              </button>
            )}
          </div>

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

      {/* Notices filtre */}
      {invalidRange && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
          La date de début est postérieure à la date de fin. Corrigez l’intervalle.
        </div>
      )}
      {hasActiveDateFilter && !invalidRange && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
          Filtre actif : {startDate || '…'} → {endDate || '…'} (les métriques et graphiques utilisent uniquement ces dates)
        </div>
      )}

      {/* KPIs Financiers */}
      <FinancialKPIs invoices={filteredInvoices || []} orders={filteredOrders || []} />

      {/* Information sur l'optimisation */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-blue-900 dark:text-blue-100">📊 Calculs Optimisés</h4>
        </div>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Les calculs financiers évitent les doublons :
          <strong> Factures payées</strong> + <strong>Commandes particuliers livrées</strong> +
          <strong> Commandes sociétés livrées (sans facture créée)</strong>, en respectant le filtre de dates.
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
        <CashflowChart invoices={filteredInvoices || []} />
      </div>

      {/* Analyse complète des revenus */}
      <ComprehensiveRevenueChart data={comprehensiveRevenueData} />

      {/* Analyses commandes par type de client */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrdersRevenueChart data={ordersRevenueData} />
        <ClientTypeAnalysisChart data={clientTypeAnalysis} />
      </div>

      {/* Top Clients */}
      <TopClientsChart invoices={filteredInvoices || []} />

      {/* Analyses paiement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentStatusChart data={paymentStatusData} />
        {paymentMethodData.length > 0 && <PaymentMethodChart data={paymentMethodData} />}
      </div>

      {/* Retards paiement */}
      {paymentDelayData.length > 0 && <PaymentDelayChart data={paymentDelayData} />}

      {/* Alertes financières */}
      <FinancialAlerts invoices={filteredInvoices || []} />
    </div>
  );
};

export default Reports;
