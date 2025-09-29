import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Users, Building2, FileText, ShoppingCart, TrendingUp } from 'lucide-react';

interface ClientTypeData {
  invoices: {
    societes: { count: number; revenue: number };
    particuliers: { count: number; revenue: number };
  };
  orders: {
    societes: { count: number; revenue: number };
    particuliers: { count: number; revenue: number };
  };
  combined: {
    societes: { count: number; revenue: number };
    particuliers: { count: number; revenue: number };
  };
}

interface ClientTypeAnalysisChartProps {
  data: ClientTypeData;
}

export default function ClientTypeAnalysisChart({ data }: ClientTypeAnalysisChartProps) {
  const [viewMode, setViewMode] = useState<'revenue' | 'count'>('revenue');
  
  // Données pour le graphique en barres
  const chartData = [
    {
      type: 'Factures',
      societes: viewMode === 'revenue' ? data.invoices.societes.revenue : data.invoices.societes.count,
      particuliers: viewMode === 'revenue' ? data.invoices.particuliers.revenue : data.invoices.particuliers.count
    },
    {
      type: 'Commandes',
      societes: viewMode === 'revenue' ? data.orders.societes.revenue : data.orders.societes.count,
      particuliers: viewMode === 'revenue' ? data.orders.particuliers.revenue : data.orders.particuliers.count
    }
  ];

  // Données pour le graphique en camembert (revenus combinés)
  const pieData = [
    {
      name: 'Sociétés',
      value: data.combined.societes.revenue,
      color: '#3B82F6',
      count: data.combined.societes.count
    },
    {
      name: 'Particuliers',
      value: data.combined.particuliers.revenue,
      color: '#8B5CF6',
      count: data.combined.particuliers.count
    }
  ].filter(item => item.value > 0);

  const totalRevenue = data.combined.societes.revenue + data.combined.particuliers.revenue;
  const totalCount = data.combined.societes.count + data.combined.particuliers.count;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'societes' ? 'Sociétés' : 'Particuliers'}: {' '}
              {viewMode === 'revenue' 
                ? `${entry.value.toLocaleString()} MAD` 
                : `${entry.value} ${entry.value > 1 ? 'documents' : 'document'}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.name}</p>
          <p className="text-sm text-gray-600">Revenus: {data.value.toLocaleString()} MAD</p>
          <p className="text-sm text-gray-600">Documents: {data.count}</p>
          <p className="text-sm text-gray-600">
            Part: {totalRevenue > 0 ? ((data.value / totalRevenue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analyse par Type de Client</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Répartition Sociétés vs Particuliers</p>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('revenue')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'revenue' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Revenus
          </button>
          <button
            onClick={() => setViewMode('count')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'count' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Nombre
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">
              {data.combined.societes.count}
            </span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300">Docs Sociétés</p>
        </div>
        
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-lg font-bold text-purple-600">
              {data.combined.particuliers.count}
            </span>
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-300">Docs Particuliers</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="text-lg font-bold text-green-600">
            {totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-green-700 dark:text-green-300">MAD Total</p>
        </div>
        
        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
          <div className="text-lg font-bold text-orange-600">
            {totalCount > 0 ? (totalRevenue / totalCount).toFixed(0) : '0'}
          </div>
          <p className="text-xs text-orange-700 dark:text-orange-300">MAD Moyen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en barres */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="type" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => 
                  viewMode === 'revenue' 
                    ? `${(value / 1000).toFixed(0)}k` 
                    : value.toString()
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="societes" 
                fill="#3B82F6"
                name="Sociétés"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="particuliers" 
                fill="#8B5CF6"
                name="Particuliers"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique en camembert */}
        <div className="h-64">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Aucune donnée</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analyse comparative */}
      {totalRevenue > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
          <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-3">📊 Analyse Comparative</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-indigo-800 dark:text-indigo-200">Sociétés (revenus):</span>
                <span className="font-bold text-blue-600">
                  {totalRevenue > 0 ? ((data.combined.societes.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-800 dark:text-indigo-200">Particuliers (revenus):</span>
                <span className="font-bold text-purple-600">
                  {totalRevenue > 0 ? ((data.combined.particuliers.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-indigo-800 dark:text-indigo-200">Panier moyen sociétés:</span>
                <span className="font-bold text-blue-600">
                  {data.combined.societes.count > 0 
                    ? (data.combined.societes.revenue / data.combined.societes.count).toFixed(0) 
                    : '0'} MAD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-800 dark:text-indigo-200">Panier moyen particuliers:</span>
                <span className="font-bold text-purple-600">
                  {data.combined.particuliers.count > 0 
                    ? (data.combined.particuliers.revenue / data.combined.particuliers.count).toFixed(0) 
                    : '0'} MAD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}