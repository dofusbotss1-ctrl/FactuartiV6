import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { TrendingUp, FileText, ShoppingCart, DollarSign, BarChart3 } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';

interface ComprehensiveRevenueData {
  month: string;
  invoices: number;
  orders: number;
  total: number;
}

interface ComprehensiveRevenueChartProps {
  data: ComprehensiveRevenueData[];
}

export default function ComprehensiveRevenueChart({ data }: ComprehensiveRevenueChartProps) {
  const { invoices } = useData();
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [viewMode, setViewMode] = useState<'stacked' | 'separate'>('stacked');
  
  // Fonction pour vérifier si une commande société a déjà une facture
  const hasInvoiceForOrder = (orderId: string) => {
    return invoices.some(invoice => invoice.orderId === orderId);
  };

  // Recalculer les données pour éviter les doublons
  const optimizedData = data.map(item => {
    // Les revenus des factures restent inchangés
    // Les revenus des commandes doivent être recalculés pour exclure celles avec factures
    return {
      ...item,
      // Note: Le calcul optimisé sera fait dans le composant parent
      // Ici on affiche les données telles qu'elles arrivent
    };
  });

  const totalInvoiceRevenue = data.reduce((sum, item) => sum + item.invoices, 0);
  const totalOrderRevenue = data.reduce((sum, item) => sum + item.orders, 0);
  const totalRevenue = totalInvoiceRevenue + totalOrderRevenue;
  
  const averageMonthlyRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <p className="text-sm text-blue-600">Factures: {data.invoices.toLocaleString()} MAD</p>
          <p className="text-sm text-green-600">Commandes: {data.orders.toLocaleString()} MAD</p>
          <p className="text-sm text-purple-600 font-medium">Total: {data.total.toLocaleString()} MAD</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chiffre d'Affaires Global</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Factures + Commandes - Vue d'ensemble complète</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Toggle chart type */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'area' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'bar' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle view mode */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'stacked' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Empilé
            </button>
            <button
              onClick={() => setViewMode('separate')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'separate' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Séparé
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-lg font-bold text-purple-600">
              {totalRevenue.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-300">MAD Total</p>
        </div>
        
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">
              {totalInvoiceRevenue.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">MAD Factures</p>
        </div>
        
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              {totalOrderRevenue.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">MAD Commandes</p>
        </div>
        
        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
          <div className="text-lg font-bold text-orange-600">
            {averageMonthlyRevenue.toFixed(0)}
          </div>
          <p className="text-sm text-orange-700 dark:text-orange-300">MAD/Mois</p>
        </div>
      </div>

      {/* Graphique principal */}
      <div className="h-80">
        {totalRevenue > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="invoicesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="invoices"
                  stackId={viewMode === 'stacked' ? '1' : undefined}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#invoicesGradient)"
                  name="Factures"
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stackId={viewMode === 'stacked' ? '1' : undefined}
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#ordersGradient)"
                  name="Commandes"
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="invoices" 
                  stackId={viewMode === 'stacked' ? 'a' : undefined}
                  fill="#3B82F6"
                  name="Factures"
                  radius={viewMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="orders" 
                  stackId={viewMode === 'stacked' ? 'a' : undefined}
                  fill="#10B981"
                  name="Commandes"
                  radius={viewMode === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun chiffre d'affaires</p>
            <p className="text-sm text-gray-400 mt-1">
              Créez des factures payées et des commandes livrées
            </p>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900 dark:text-purple-100">Performance Globale</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-purple-900 dark:text-purple-100">
              Répartition: {totalInvoiceRevenue > 0 ? ((totalInvoiceRevenue / totalRevenue) * 100).toFixed(1) : 0}% Factures
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300">
              {totalOrderRevenue > 0 ? ((totalOrderRevenue / totalRevenue) * 100).toFixed(1) : 0}% Commandes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}