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
  X,              // ✨ close icon
  AlertTriangle,  // ✨ warning icon
} from 'lucide-react';
import { motion } from 'framer-motion';

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

  // ✨ nouvel état pour la suppression
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // === Bloc Année ============================
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
    if (order.clientType === 'personne_physique') {
      return order.clientName || 'Client particulier';
    } else {
      return order.client?.name || 'Client société';
    }
  };

  const getProductsDisplay = (items: any[]) => {
    if (items.length === 1) return items[0].productName;
    return `${items.length} articles`;
  };

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

  // ✨ handler demandé (ouvre la modale de confirmation)
  const handleDeleteOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setDeleteTarget(order);
  };

  // ✨ confirme la suppression
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    // Pourquoi: empêcher la suppression d'une commande liée à une facture
    if (hasInvoiceForOrder(deleteTarget.id)) {
      alert("Cette commande est liée à une facture. Supprimez d'abord la facture.");
      return;
    }
    await deleteOrder(deleteTarget.id);
    setDeleteTarget(null);
  };

  const cancelDelete = () => setDeleteTarget(null);

  // ===================== Filtres globaux ======================
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

  // ================= Groupement par année =====================
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

  useEffect(() => {
    setExpandedYears((prev) => {
      const next = { ...prev };
      sortedYears.forEach((y) => {
        if (next[y] === undefined) next[y] = true;
      });
      return next;
    });
  }, [sortedYears]);

  // ================= Tri =====================
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

  // ================== Stats année ============================
  const getYearStats = (list: any[]) => ({
    count: list.length,
    totalTTC: list.reduce((sum, o) => sum + Number(o.totalTTC || 0), 0),
  });

  // ================== Export CSV =================
  const exportToCSV = () => {
    const csvContent = [
      ['Année', 'N° Commande', 'Date', 'Client', 'Produits', 'Quantité Total', 'Total TTC', 'Statut'].join(','),
      ...Object.entries(ordersByYear).flatMap(([year, list]) =>
        (list as any[]).map((order) => [
          year,
          order.number,
          new Date(order.orderDate).toLocaleDateString('fr-FR'),
          getClientName(order),
          getProductsDisplay(order.items),
          getTotalQuantity(order.items),
          Number(order.totalTTC).toFixed(2),
          order.status,
        ].join(','))
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
      {/* ... inchangé ... */}

      {/* Filtres */}
      {/* ... inchangé ... */}

      {/* === Blocs par année ================================== */}
      <div className="space-y-6">
        {Object.keys(ordersByYear).length > 0 ? (
          Object.keys(ordersByYear).map((k) => Number(k)).sort((a, b) => b - a).map((year) => {
            const list = ordersByYear[year] || [];
            const yearStats = getYearStats(list);
            const expanded = !!expandedYears[year];
            const yearOrders = [...list].sort(sortComparer);

            return (
              <div key={year} className="space-y-4">
                {/* En-tête année */}
                {/* ... inchangé ... */}

                {/* Tableau de l'année */}
                {expanded && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          {/* ... entêtes inchangées ... */}
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {yearOrders.map((order) => (
                            <motion.tr
                              key={order.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              {/* colonnes ... */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => setStatusModalOrder(order.id)}
                                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                                    title="Changer le statut"
                                  >
                                    <Filter className="w-4 h-4" />
                                  </button>

                                  <Link
                                    to={`/commandes/${order.id}`}
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                    title="Voir détails"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Link>

                                  {canCreateInvoice(order) && (
                                    <button
                                      onClick={() => handleCreateInvoice(order)}
                                      className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                      title="Créer facture"
                                    >
                                      <DollarSign className="w-4 h-4" />
                                    </button>
                                  )}

                                  <Link
                                    to={`/commandes/${order.id}/modifier`}
                                    className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                                    title="Modifier"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Link>

                                  {/* ✨ Ouvre la modale de confirmation */}
                                  <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                    title="Supprimer"
                                  >
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
              <Link
                to="/commandes/nouveau"
                className="mt-4 inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Créer votre première commande</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Modal de changement de statut */}
      {statusModalOrder && (
        <OrderStatusModal
          isOpen={!!statusModalOrder}
          onClose={() => setStatusModalOrder(null)}
          order={orders.find((o) => o.id === statusModalOrder)!}
          onUpdateStatus={updateOrderStatus}
        />
      )}

      {/* Modal de création de facture */}
      {createForOrder && (
        <CreateInvoiceFromOrderModal
          orderId={createForOrder}
          isOpen={!!createForOrder}
          onClose={() => setCreateForOrder(null)}
          onInvoiceCreated={() => setCreateForOrder(null)}
        />
      )}

      {/* ✨ Modale de confirmation de suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={cancelDelete}
            aria-hidden
          />
          {/* dialog */}
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
                    disabled={hasInvoiceForOrder(deleteTarget.id)}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Guide des actions */}
      <OrderActionsGuide />
    </div>
  );
}
