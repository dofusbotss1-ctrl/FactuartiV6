// /home/project/src/components/stock/StockManagement.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useOrder } from '../../contexts/OrderContext';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Download,
  Search,
  Crown,
  BarChart3,
  TrendingDown,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import StockEvolutionChart from './charts/StockEvolutionChart';
import DonutChart from './charts/DonutChart';
import MarginChart from './charts/MarginChart';
import MonthlySalesChart from './charts/MonthlySalesChart';
import SalesHeatmap from './charts/SalesHeatmap';
import html2pdf from 'html2pdf.js';

export default function StockManagement() {
  const { user } = useAuth();
  const { products } = useData();
  const { orders } = useOrder();
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'evolution' | 'margins' | 'heatmap'>('overview');

  // PRO only
  const isProActive =
    user?.company.subscription === 'pro' &&
    user?.company.expiryDate &&
    new Date(user.company.expiryDate) > new Date();

  if (!isProActive) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">🔒 Fonctionnalité PRO</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            La Gestion de Stock est réservée aux abonnés PRO.
          </p>
          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200">
            <span className="flex items-center justify-center space-x-2">
              <Crown className="w-5 h-5" />
              <span>Passer à PRO - 299 MAD/mois</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Evolution (fix: utilise orders, pas 'invoices')
  const generateStockEvolutionData = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    const now = new Date();
    const months: Array<{ month: string; initialStock: number; sold: number; remaining: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = dt.getMonth();
      const y = dt.getFullYear();
      const monthName = dt.toLocaleDateString('fr-FR', { month: 'short' });

      // somme des quantités vendues pour ce produit/mois
      const sold = orders
        .filter(o => o.status === 'livre')
        .filter(o => {
          const d = new Date(o.orderDate);
          return d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((sum, o) => {
          return (
            sum +
            o.items
              .filter(it => it.productName === product.name)
              .reduce((s, it) => s + (it.quantity || 0), 0)
          );
        }, 0);

      const remaining = Math.max(0, product.stock - sold);
      months.push({ month: monthName, initialStock: product.stock, sold, remaining });
    }
    return months;
  };

  // Détails produits
  const getDetailedProductData = () => {
    return products
      .map(product => {
        let quantitySold = 0;
        let salesValue = 0;
        const ordersSet = new Set<string>();

        orders.forEach(order => {
          if (order.status === 'livre') {
            let hasProduct = false;
            order.items.forEach(item => {
              if (item.productName === product.name) {
                quantitySold += item.quantity;
                salesValue += item.total;
                hasProduct = true;
              }
            });
            if (hasProduct) ordersSet.add(order.id);
          }
        });

        const ordersCount = ordersSet.size;
        const remainingStock = product.stock - quantitySold;
        const purchaseValue = product.stock * product.purchasePrice;
        const margin = salesValue - quantitySold * product.purchasePrice;

        return {
          ...product,
          quantitySold,
          salesValue,
          ordersCount,
          remainingStock,
          purchaseValue,
          margin
        };
      })
      .filter(product => (selectedProduct === 'all' ? true : product.id === selectedProduct));
  };

  const detailedData = getDetailedProductData();

  const generateDonutData = (type: 'sales' | 'stock') => {
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#84CC16', '#F97316', '#14B8A6'];

    if (type === 'sales') {
      const salesByProduct = products
        .map(product => {
          const totalSales = orders.reduce((sum, order) => {
            if (order.status === 'livre') {
              return (
                sum +
                order.items
                  .filter(item => item.productName === product.name)
                  .reduce((itemSum, item) => itemSum + item.total, 0)
              );
            }
            return sum;
          }, 0);
          return { product: product.name, value: totalSales };
        })
        .filter(item => item.value > 0);

      const totalSales = salesByProduct.reduce((sum, item) => sum + item.value, 0);
      return salesByProduct.map((item, index) => ({
        label: item.product,
        value: item.value,
        color: colors[index % colors.length],
        percentage: totalSales > 0 ? (item.value / totalSales) * 100 : 0
      }));
    } else {
      const stockByProduct = products
        .map(product => {
          const soldQuantity = orders.reduce((sum, order) => {
            if (order.status === 'livre') {
              return (
                sum +
                order.items
                  .filter(item => item.productName === product.name)
                  .reduce((itemSum, item) => itemSum + item.quantity, 0)
              );
            }
            return sum;
          }, 0);
          const remainingStock = Math.max(0, product.stock - soldQuantity);
          const stockValue = remainingStock * product.purchasePrice;
          return { product: product.name, value: stockValue };
        })
        .filter(item => item.value > 0);

      const totalStockValue = stockByProduct.reduce((sum, item) => sum + item.value, 0);
      return stockByProduct.map((item, index) => ({
        label: item.product,
        value: item.value,
        color: colors[index % colors.length],
        percentage: totalStockValue > 0 ? (item.value / totalStockValue) * 100 : 0
      }));
    }
  };

  const generateMarginData = () => {
    return products
      .map(product => {
        const salesData = orders.reduce(
          (acc, order) => {
            if (order.status === 'livre') {
              order.items.forEach(item => {
                if (item.productName === product.name) {
                  acc.quantity += item.quantity;
                  acc.value += item.total;
                }
              });
            }
            return acc;
          },
          { quantity: 0, value: 0 }
        );

        const purchaseValue = salesData.quantity * product.purchasePrice;
        const margin = salesData.value - purchaseValue;

        return {
          productName: product.name,
          margin,
          salesValue: salesData.value,
          purchaseValue,
          unit: product.unit || 'unité'
        };
      })
      .filter(item => item.salesValue > 0);
  };

  const generateMonthlySalesData = () => {
    const months: Array<{ month: string; quantity: number; value: number; ordersCount: number }> = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(selectedYear, i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate.getMonth() === i && orderDate.getFullYear() === selectedYear && order.status === 'livre';
      });

      const monthData = monthOrders.reduce(
        (acc, order) => {
          order.items.forEach(item => {
            if (selectedProduct === 'all' || item.productName === products.find(p => p.id === selectedProduct)?.name) {
              acc.quantity += item.quantity;
              acc.value += item.total;
            }
          });
          acc.ordersCount += 1;
          return acc;
        },
        { quantity: 0, value: 0, ordersCount: 0 }
      );

      months.push({ month: monthName, ...monthData });
    }
    return months;
  };

  const generateHeatmapData = () => {
    const months: string[] = [];
    const productNames = products.map(p => p.name);

    for (let i = 0; i < 12; i++) {
      const date = new Date(selectedYear, i, 1);
      months.push(date.toLocaleDateString('fr-FR', { month: 'short' }));
    }

    const heatmapData: any[] = [];
    let maxQuantity = 0;

    productNames.forEach(productName => {
      months.forEach((month, monthIndex) => {
        const monthSales = orders
          .filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.getMonth() === monthIndex && orderDate.getFullYear() === selectedYear && order.status === 'livre';
          })
          .reduce((sum, order) => {
            return (
              sum +
              order.items
                .filter(item => item.productName === productName)
                .reduce((itemSum, item) => itemSum + item.quantity, 0)
            );
          }, 0);

        const monthValue = orders
          .filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.getMonth() === monthIndex && orderDate.getFullYear() === selectedYear && order.status === 'livre';
          })
          .reduce((sum, order) => {
            return (
              sum +
              order.items
                .filter(item => item.productName === productName)
                .reduce((itemSum, item) => itemSum + item.total, 0)
            );
          }, 0);

        maxQuantity = Math.max(maxQuantity, monthSales);
        heatmapData.push({ month, productName, quantity: monthSales, value: monthValue, intensity: 0 });
      });
    });

    return heatmapData.map(item => ({ ...item, intensity: maxQuantity > 0 ? item.quantity / maxQuantity : 0 }));
  };

  const calculateStats = (productFilter: string = 'all') => {
    let filteredProducts = products;
    if (productFilter !== 'all') filteredProducts = products.filter(p => p.id === productFilter);

    let totalStockInitial = 0;
    let totalPurchaseValue = 0;
    let totalSalesValue = 0;
    let totalQuantitySold = 0;
    let totalRemainingStock = 0;
    let dormantProducts = 0;

    filteredProducts.forEach(product => {
      totalStockInitial += product.stock;
      totalPurchaseValue += product.stock * product.purchasePrice;

      let productQuantitySold = 0;
      let productSalesValue = 0;

      orders.forEach(order => {
        if (order.status === 'livre') {
          order.items.forEach(item => {
            if (item.productName === product.name) {
              productQuantitySold += item.quantity;
              productSalesValue += item.total;
            }
          });
        }
      });

      totalQuantitySold += productQuantitySold;
      totalSalesValue += productSalesValue;
      const remainingStock = product.stock - productQuantitySold;
      totalRemainingStock += remainingStock;
      if (productQuantitySold === 0) dormantProducts++;
    });

    const grossMargin = totalSalesValue - totalPurchaseValue;
    return {
      totalStockInitial,
      totalPurchaseValue,
      totalSalesValue,
      totalQuantitySold,
      totalRemainingStock,
      dormantProducts,
      grossMargin
    };
  };

  const stats = calculateStats(selectedProduct);
  const salesDonutData = generateDonutData('sales');
  const stockDonutData = generateDonutData('stock');
  const marginData = generateMarginData();
  const monthlySalesData = generateMonthlySalesData();
  const heatmapData = generateHeatmapData();

  // Fallback année si aucune commande
  const yearsFromOrders = [...new Set(orders.map(o => new Date(o.orderDate).getFullYear()))].sort((a, b) => b - a);
  const availableYears = yearsFromOrders.length ? yearsFromOrders : [new Date().getFullYear()];

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  const tabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: BarChart3 },
    { id: 'evolution', label: 'Évolution', icon: TrendingUp },
    { id: 'margins', label: 'Marges', icon: DollarSign },
    { id: 'heatmap', label: 'Heatmap', icon: Activity }
  ] as const;

  const handleExportPDF = async () => {
    // IMPORTANT: ne pas mettre opacity:0 (sinon pdf blanc)
    const container = document.createElement('div');
    container.id = 'stock-report-pdf';
    container.style.position = 'absolute';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.background = '#ffffff';
    container.style.opacity = '1';
    container.style.zIndex = '1';
    container.innerHTML = generateReportHTML();
    document.body.appendChild(container);

    const options = {
      margin: [10, 10, 10, 10],
      filename: `Rapport_Stock_Avance_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(options).from(container).save();
    } catch (err) {
      console.error('Erreur PDF:', err);
      alert("Erreur lors de la génération du PDF");
    } finally {
      // Toujours nettoyer
      if (document.body.contains(container)) document.body.removeChild(container);
    }
  };

  const generateReportHTML = () => {
    // Minimal; ajoute ce dont tu as besoin
    return `
      <div style="padding:20px;font-family:Arial,sans-serif;background:#fff;color:#111;">
        <div style="text-align:center;margin-bottom:24px;border-bottom:2px solid #8B5CF6;padding-bottom:16px;">
          <h1 style="font-size:22px;color:#8B5CF6;margin:0 0 6px;font-weight:700;">RAPPORT DE GESTION DE STOCK AVANCÉ</h1>
          <h2 style="font-size:16px;margin:0 0 6px;font-weight:700;">${user?.company?.name || ''}</h2>
          <p style="font-size:12px;color:#555;margin:0;">Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <h3 style="font-size:14px;margin:0 0 10px;font-weight:700;">Statistiques Globales</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px;">
          <tbody>
            <tr>
              <td style="border:1px solid #e5e7eb;padding:8px;">Stock initial</td>
              <td style="border:1px solid #e5e7eb;padding:8px;font-weight:700;">${stats.totalStockInitial.toFixed(0)} ${products[0]?.unit || ''}</td>
            </tr>
            <tr>
              <td style="border:1px solid #e5e7eb;padding:8px;">Valeur d'achat</td>
              <td style="border:1px solid #e5e7eb;padding:8px;font-weight:700;">${stats.totalPurchaseValue.toLocaleString()} MAD</td>
            </tr>
            <tr>
              <td style="border:1px solid #e5e7eb;padding:8px;">Valeur de vente</td>
              <td style="border:1px solid #e5e7eb;padding:8px;font-weight:700;">${stats.totalSalesValue.toLocaleString()} MAD</td>
            </tr>
            <tr>
              <td style="border:1px solid #e5e7eb;padding:8px;">Marge brute</td>
              <td style="border:1px solid #e5e7eb;padding:8px;font-weight:700;color:${stats.grossMargin >= 0 ? '#059669' : '#DC2626'};">
                ${stats.grossMargin >= 0 ? '+' : ''}${stats.grossMargin.toLocaleString()} MAD
              </td>
            </tr>
            <tr>
              <td style="border:1px solid #e5e7eb;padding:8px;">Stock restant</td>
              <td style="border:1px solid #e5e7eb;padding:8px;font-weight:700;">${stats.totalRemainingStock.toFixed(0)} ${products[0]?.unit || ''}</td>
            </tr>
            <tr>
              <td style="border:1px solid #e5e7eb;padding:8px;">Produits non vendus</td>
              <td style="border:1px solid #e5e7eb;padding:8px;font-weight:700;">${stats.dormantProducts}</td>
            </tr>
          </tbody>
        </table>

        <h3 style="font-size:14px;margin:16px 0 8px;font-weight:700;">Analyse détaillée par produit</h3>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr>
              <th style="border:1px solid #e5e7eb;padding:6px;text-align:left;">Produit</th>
              <th style="border:1px solid #e5e7eb;padding:6px;text-align:right;">Stock initial</th>
              <th style="border:1px solid #e5e7eb;padding:6px;text-align:right;">Qté vendue</th>
              <th style="border:1px solid #e5e7eb;padding:6px;text-align:right;">Stock restant</th>
              <th style="border:1px solid #e5e7eb;padding:6px;text-align:right;">Achat (MAD)</th>
              <th style="border:1px solid #e5e7eb;padding:6px;text-align:right;">Vente (MAD)</th>
              <th style="border:1px solid #e5e7eb;padding:6px;text-align:right;">Marge (MAD)</th>
            </tr>
          </thead>
          <tbody>
            ${detailedData
              .map(
                p => `
              <tr>
                <td style="border:1px solid #e5e7eb;padding:6px;">${p.name}</td>
                <td style="border:1px solid #e5e7eb;padding:6px;text-align:right;">${p.stock.toFixed(3)} ${p.unit || ''}</td>
                <td style="border:1px solid #e5e7eb;padding:6px;text-align:right;">${p.quantitySold.toFixed(3)} ${p.unit || ''}</td>
                <td style="border:1px solid #e5e7eb;padding:6px;text-align:right;">${p.remainingStock.toFixed(3)} ${p.unit || ''}</td>
                <td style="border:1px solid #e5e7eb;padding:6px;text-align:right;">${p.purchaseValue.toLocaleString()}</td>
                <td style="border:1px solid #e5e7eb;padding:6px;text-align:right;">${p.salesValue.toLocaleString()}</td>
                <td style="border:1px solid #e5e7eb;padding:6px;text-align:right;color:${p.margin >= 0 ? '#059669' : '#DC2626'};">
                  ${p.margin >= 0 ? '+' : ''}${p.margin.toLocaleString()}
                </td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span>Gestion de Stock Avancée</span>
            <Crown className="w-6 h-6 text-yellow-500" />
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Analysez vos stocks avec des graphiques interactifs et des visualisations avancées. Fonctionnalité PRO avec export PDF.
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrer par produit</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tous les produits</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Année d'analyse</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Période d'analyse</label>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="month">Mensuel</option>
              <option value="quarter">Trimestriel</option>
              <option value="year">Annuel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rechercher</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Rechercher..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenu */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalStockInitial.toFixed(0)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Stock Initial</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPurchaseValue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Valeur d'Achat (MAD)</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSalesValue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Valeur de Vente (MAD)</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    stats.grossMargin >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-red-600'
                  }`}
                >
                  {stats.grossMargin >= 0 ? <TrendingUp className="w-6 h-6 text-white" /> : <TrendingDown className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stats.grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.grossMargin >= 0 ? '+' : ''}
                    {stats.grossMargin.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Marge Brute (MAD)</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalRemainingStock.toFixed(0)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Stock Restant</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalQuantitySold.toFixed(0)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Quantité Vendue</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.dormantProducts}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Produits Non Vendus</p>
                </div>
              </div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DonutChart
              data={salesDonutData}
              title="Répartition des Ventes"
              subtitle="Par produit (valeur)"
              centerValue={`${stats.totalSalesValue.toLocaleString()}`}
              centerLabel="MAD Total"
            />
            <DonutChart
              data={stockDonutData}
              title="Valeur du Stock Restant"
              subtitle="Par produit (valeur d'achat)"
              centerValue={`${stockDonutData.reduce((s, i) => s + i.value, 0).toLocaleString()}`}
              centerLabel="MAD Stock"
            />
          </div>
        </div>
      )}

      {activeTab === 'evolution' && selectedProduct !== 'all' && (
        <StockEvolutionChart
          data={generateStockEvolutionData(selectedProduct)}
          productName={products.find(p => p.id === selectedProduct)?.name || 'Produit'}
          unit={products.find(p => p.id === selectedProduct)?.unit || 'unité'}
        />
      )}

      {activeTab === 'evolution' && selectedProduct === 'all' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Sélectionnez un produit</h3>
          <p className="text-gray-600 dark:text-gray-300">Sélectionnez un produit dans les filtres.</p>
        </div>
      )}

      {activeTab === 'margins' && <MarginChart data={generateMarginData()} />}

      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          <MonthlySalesChart data={monthlySalesData} selectedYear={selectedYear} />
          <SalesHeatmap data={heatmapData} products={products.map(p => p.name)} months={months} selectedYear={selectedYear} />
        </div>
      )}

      {/* Tableau détaillé */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analyse Détaillée par Produit</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock Initial</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Qté Vendue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock Restant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valeur d'Achat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valeur de Vente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Marge Brute</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {detailedData.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{product.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {product.stock.toFixed(3)} {product.unit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Min: {product.minStock.toFixed(3)} {product.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {product.quantitySold.toFixed(3)} {product.unit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {product.ordersCount} commande{product.ordersCount > 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm font-medium ${
                          product.remainingStock <= product.minStock ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {product.remainingStock.toFixed(3)} {product.unit}
                      </span>
                      {product.remainingStock <= product.minStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {product.purchaseValue.toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {product.salesValue.toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${product.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.margin >= 0 ? '+' : ''}
                        {product.margin.toLocaleString()} MAD
                      </span>
                      {product.margin >= 0 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    {product.margin < 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">Besoin: +{Math.abs(product.margin).toLocaleString()} MAD</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {detailedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun produit trouvé</p>
          </div>
        )}
      </div>

      {/* Indicateurs */}
      {stats.grossMargin < 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">⚠️ Performance Déficitaire</h3>
          </div>
          <p className="text-red-800 dark:text-red-200">
            Votre marge brute est négative de <strong>{Math.abs(stats.grossMargin).toLocaleString()} MAD</strong>.
          </p>
        </div>
      )}

      {stats.grossMargin > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">✅ Performance Positive</h3>
          </div>
          <p className="text-green-800 dark:text-green-200">
            Excellente performance ! Votre marge brute est de <strong>+{stats.grossMargin.toLocaleString()} MAD</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
