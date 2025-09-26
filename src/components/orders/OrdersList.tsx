// src/components/orders/OrdersList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrder } from '../../contexts/OrderContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import OrderStatusModal from './OrderStatusModal';
import OrderActionsGuide from './OrderActionsGuide';
import CreateInvoiceFromOrderModal from './CreateInvoiceFromOrderModal';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  FileText,
  Package,
  Calendar,
  User,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrdersList() {
  const { orders, deleteOrder, updateOrder } = useOrder();
  const { invoices } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_cours_livraison' | 'livre' | 'annule'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [sortBy, setSortBy] = useState<'date' | 'client' | 'total' | 'status' | 'number'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [statusModalOrder, setStatusModalOrder] = useState<string | null>(null);
  const [createForOrder, setCreateForOrder] = useState<string | null>(null);

  // Confirmation de suppression
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // Toast animé
  const [toast, setToast] = useState<{ id: number; type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now();
    setToast({ id, type, text });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2500);
  };

  // --- Années
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const toggleYearExpansion = (year: number) =>
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));

  const updateOrderStatus = (orderId: string, newStatus: 'en_attente' | 'livre' | 'annule') => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    updateOrder(orderId, { status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'livre':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            Livré
          </span>
        );
      case 'en_cours_livraison':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
            En cours de livraison
          </span>
        );
      case 'annule':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            Annulé
          </span>
        );
      default:
        return null;
    }
  };

  const getClientName = (order: any) => {
    if (order.clientType === 'personne_physique') return order.clientName || 'Client particulier';
    return order.client?.name || 'Client société';
  };

  const getProductsDisplay = (items: any[]) => (items.length === 1 ? items[0].productName : `${items.length} articles`);
  const getTotalQuantity = (items: any[]) => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const hasInvoiceForOrder = (orderId: string) => invoices.some((invoice) => invoice.orderId === orderId);

  const canCreateInvoice = (order: any) =>
    order.clientType === 'societe' && !hasInvoiceForOrder(order.id) && order.status !== 'annule';

  const handleCreateInvoice = (order: any) => {
    if (order.status === 'annule') {
      window.alert('Impossible de créer une facture pour une commande annulée.');
      return;
    }
    setCreateForOrder(order.id);
  };

  // Ouvre la modale
  const handleDeleteOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setDeleteTarget(order);
  };

  // Confirme la suppression + toast animé
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (hasInvoiceForOrder(deleteTarget.id)) {
      showToast('error', "Suppression impossible: facture associée.");
      return;
    }

    const target = deleteTarget;       // garder pour le message
    setDeleteTarget(null);             // fermer la modale tout de suite

    try {
      await deleteOrder(target.id);
      showToast('success', `Commande ${target.number} supprimée.`);
    } catch {
      showToast('error', "Échec de la suppression.");
    }
  };

  const cancelDelete = () => setDeleteTarget(null);

  // Filtres globaux
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(order).toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some((item: any) => (item.productName || '').toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.orderDate);
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            matchesDate = orderDate.toDateString() === now.toDateString();
            break;
          case 'week':
            matchesDate = orderDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            matchesDate = orderDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateFilter]);

  // Groupement par année
  const ordersByYear = useMemo(() => {
    return filteredOrders.reduce((acc: Record<number, any[]>, order: any) => {
      const year = new Date(order.orderDate).getFullYear();
      (acc[year] ||= []).push(order);
      return acc;
    }, {});
  }, [filteredOrders]);

  const sortedYears = useMemo(
    () =>
      Object.keys(ordersByYear)
        .map(Number)
        .sort((a, b) => b - a),
    [ordersByYear]
  );

  // Ouvrir toutes les années
  useEffect(() => {
    setExpandedYears((prev) => {
      const next = { ...prev };
      sortedYears.forEach((y) => {
        if (next[y] === undefined) next[y] = true;
      });
      return next;
    });
  }, [sortedYears]);

  // Tri
  const sortComparer = (a: any, b: any) => {
    let aValue: any;
    let bValue: any;
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.orderDate).getTime();
        bValue = new Date(b.orderDate).getTime();
        break;
      case 'client':
        aValue = (getClientName(a) || '').toLowerCase();
        bValue = (getClientName(b) || '').toLowerCase();
        break;
      case 'total':
        aValue = Number(a.totalTTC || 0);
        bValue = Number(b.totalTTC || 0);
        break;
      case 'status':
        aValue = (a.status || '').toLowerCase();
        bValue = (b.status || '').toLowerCase();
        break;
      default:
        aValue = (a.number || '').toLowerCase();
        bValue = (b.number || '').toLowerCase();
    }
    if (aValue === bValue) return 0;
    return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  };

  const handleSort = (field: 'date' | 'client' | 'total' | 'status' | 'number') => {
    if (sortBy === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Stats année
  const getYearStats = (list: any[]) => ({
    count: list.length,
    totalTTC: list.reduce((sum, o) => sum + Number(o.totalTTC || 0), 0),
  });

  // Export CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Année', 'N° Commande', 'Date', 'Client', 'Produits', 'Quantité Total', 'Total TTC', 'Statut'].join(','),
      ...Object.entries(ordersByYear).flatMap(([year, list]) =>
        (list as any[]).map((order) =>
          [
            year,
            order.number,
            new Date(order.orderDate).toLocaleDateString('fr-FR'),
            getClientName(order),
            getProductsDisplay(order.items),
            getTotalQuantity(order.items),
            Number(order.totalTTC || 0).toFixed(2),
            order.status,
          ].join(',')
        )
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Package className="w-8 h-8 text-blue-600" />
            <span>Commandes</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Gestion des commandes et bons de livraison</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToCSV}
            className="hidden md:inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
          <Link
            to="/commandes/nouveau"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Commande</span>
          </Link>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{orders.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Commandes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {orders.filter((o) => o.status === 'livre').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Livrées</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {orders.filter((o) => o.status === 'en_cours_livraison').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">En cours</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {orders.reduce((sum, o) => sum + Number(o.totalTTC || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">MAD Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Rechercher..."
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_cours_livraison">En cours de livraison</option>
              <option value="livre">Livré</option>
              <option value="annule">Annulé</option>
            </select>
          </div>

          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="date">Trier par date</option>
              <option value="client">Trier par client</option>
              <option value="total">Trier par montant</option>
              <option value="status">Trier par statut</option>
              <option value="number">Trier par N°</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Blocs par année */}
      <div className="space-y-6">
        {sortedYears.length > 0 ? (
          sortedYears.map((year) => {
            const list = ordersByYear[year] || [];
            const yearStats = getYearStats(list);
            const expanded = !!expandedYears[year];
            const yearOrders = [...list].sort(sortComparer);

            return (
              <div key={year} className="space-y-4">
                {/* En-tête année */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center space-x-4 cursor-pointer"
                      onClick={() => toggleYearExpansion(year)}
                    >
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Commandes - {year}</h2>
                        <p className="text-sm opacity-90">Résumé de l'année {year}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="grid grid-cols-2 gap-6 text-center">
                        <div>
                          <p className="text-3xl font-bold text-white">{yearStats.count}</p>
                          <p className="text-sm opacity-90 text-white">Commandes</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-white">{yearStats.totalTTC.toLocaleString()}</p>
                          <p className="text-sm opacity-90 text-white">MAD Total TTC</p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleYearExpansion(year)}
                        className="ml-2 px-3 py-1.5 rounded-lg bg-white/20 hover:bg白/30 text-white text-sm"
                        title={expanded ? 'Masquer' : 'Afficher'}
                      >
                        {expanded ? 'Masquer' : 'Afficher'}
                      </button>

                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tableau */}
                {expanded && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('number')}>N° Commande</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('date')}>Date Commande</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('client')}>Client</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Produits</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantité</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('total')}>Prix Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('status')}>Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {yearOrders.map((order) => (
                            <motion.tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                              <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.number}</div></td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm text-gray-900 dark:text-gray-100">{new Date(order.orderDate).toLocaleDateString('fr-FR')}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(order.orderDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  {order.deliveryDate && (
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      Livraison: {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{getClientName(order)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{order.clientType === 'personne_physique' ? 'Particulier' : 'Société'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-gray-100">{getProductsDisplay(order.items)}</div>
                                {order.items.length > 1 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {order.items.map((item: any) => item.productName).join(', ')}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Intl.NumberFormat('fr-FR').format(getTotalQuantity(order.items))}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                  {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(order.totalTTC || 0))} MAD
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  HT: {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(order.subtotal || 0))} MAD
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center space-x-3">
                                  <button onClick={() => setStatusModalOrder(order.id)} className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors" title="Changer le statut">
                                    <Filter className="w-4 h-4" />
                                  </button>

                                  <Link to={`/commandes/${order.id}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" title="Voir détails">
                                    <FileText className="w-4 h-4" />
                                  </Link>

                                  {canCreateInvoice(order) && (
                                    <button onClick={() => handleCreateInvoice(order)} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors" title="Créer facture">
                                      <DollarSign className="w-4 h-4" />
                                    </button>
                                  )}

                                  <Link to={`/commandes/${order.id}/modifier`} className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors" title="Modifier">
                                    <Edit className="w-4 h-4" />
                                  </Link>

                                  <button onClick={() => handleDeleteOrder(order.id)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors" title="Supprimer">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {orders.length === 0 ? 'Aucune commande créée' : 'Aucune commande trouvée'}
            </p>
            {orders.length === 0 && (
              <Link to="/commandes/nouveau" className="mt-4 inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                <Plus className="w-4 h-4" />
                <span>Créer votre première commande</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Modales existantes */}
      {statusModalOrder && (
        <OrderStatusModal
          isOpen={!!statusModalOrder}
          onClose={() => setStatusModalOrder(null)}
          order={orders.find((o) => o.id === statusModalOrder)!}
          onUpdateStatus={updateOrderStatus}
        />
      )}

      {createForOrder && (
        <CreateInvoiceFromOrderModal
          orderId={createForOrder}
          isOpen={!!createForOrder}
          onClose={() => setCreateForOrder(null)}
          onInvoiceCreated={() => setCreateForOrder(null)}
        />
      )}

      {/* Confirmation de suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={cancelDelete} aria-hidden />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.18 }}
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-3 w-full">
                <h3 id="confirm-delete-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Supprimer la commande ?
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  N° <span className="font-medium">{deleteTarget.number}</span> — {getClientName(deleteTarget)}
                </p>
                {hasInvoiceForOrder(deleteTarget.id) && (
                  <p className="mt-2 text-xs text-red-600">
                    Cette commande a une facture associée. Supprimez d'abord la facture.
                  </p>
                )}

                <div className="mt-5 flex justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Non, annuler
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                  >
                    Oui, supprimer
                  </button>
                </div>
              </div>
              <button
                onClick={cancelDelete}
                className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast animé succès/erreur */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 right-4 z-[70]"
          >
            <div
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border ${
                toast.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{toast.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide des actions */}
      <OrderActionsGuide />
    </div>
  );
}
