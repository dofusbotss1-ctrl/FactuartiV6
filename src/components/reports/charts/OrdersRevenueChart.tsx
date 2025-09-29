import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ShoppingCart, Users, Building2, TrendingUp } from 'lucide-react';

interface OrdersRevenueData {
  month: string;
  totalRevenue: number;
  societesRevenue: number;
  particuliersRevenue: number;
  ordersCount: number;
}

interface OrdersRevenueChartProps {
  data: OrdersRevenueData[];
}

export default function OrdersRevenueChart({ data }: OrdersRevenueChartProps) {
  const [viewMode, setViewMode] = useState<'total' | 'breakdown'>('breakdown');
  
  const totalOrderRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalSocietesRevenue = data.reduce((sum, item) => sum + item.societesRevenue, 0);
  const totalParticuliersRevenue = data.reduce((sum, item) => sum + item.particuliersRevenue, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.ordersCount, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <p className="text-sm text-gray-600">Total: {data.totalRevenue.toLocaleString()} MAD</p>
          <p className="text-sm text-blue-600">Sociétés: {data.societesRevenue.toLocaleString()} MAD</p>
          <p className="text-sm text-green-600">Particuliers: {data.particuliersRevenue.toLocaleString()} MAD</p>
          <p className="text-sm text-gray-600">Commandes: {data.ordersCount}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chiffre d'Affaires Commandes</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Analyse par type de client (commandes livrées)</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('breakdown')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'breakdown' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Détaillé
            </button>
            <button
              onClick={() => setViewMode('total')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'total' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Total
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              {totalOrderRevenue.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">MAD Total Commandes</p>
        </div>
        
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">
              {totalSocietesRevenue.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">MAD Sociétés</p>
        </div>
        
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-lg font-bold text-purple-600">
              {totalParticuliersRevenue.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-300">MAD Particuliers</p>
        </div>
      </div>

      {/* Graphique */}
      <div className="h-64">
        {totalOrderRevenue > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
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
              
              {viewMode === 'breakdown' ? (
                <>
                  <Bar 
                    dataKey="societesRevenue" 
                    stackId="a"
                    fill="#3B82F6"
                    name="Sociétés"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="particuliersRevenue" 
                    stackId="a"
                    fill="#8B5CF6"
                    name="Particuliers"
                    radius={[4, 4, 0, 0]}
                  />
                </>
              ) : (
                <Bar 
                  dataKey="totalRevenue" 
                  fill="#10B981"
                  name="Total Commandes"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune commande livrée</p>
            <p className="text-sm text-gray-400 mt-1">
              Créez et livrez des commandes pour voir les données
            </p>
          </div>
        )}
      </div>

      {/* Analyse de répartition */}
      {totalOrderRevenue > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900 dark:text-green-100">Répartition Clients</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-green-900 dark:text-green-100">
                Sociétés: {totalSocietesRevenue > 0 ? ((totalSocietesRevenue / totalOrderRevenue) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Particuliers: {totalParticuliersRevenue > 0 ? ((totalParticuliersRevenue / totalOrderRevenue) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}