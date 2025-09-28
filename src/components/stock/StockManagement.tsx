// /home/project/src/components/stock/StockManagement.tsx
import React, { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useOrder } from '../../contexts/OrderContext';
import {
  TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle,
  Download, Search, Crown, BarChart3, TrendingDown, CheckCircle, XCircle, Activity
} from 'lucide-react';
import StockEvolutionChart from './charts/StockEvolutionChart';
import DonutChart from './charts/DonutChart';
import MarginChart from './charts/MarginChart';
import MonthlySalesChart from './charts/MonthlySalesChart';
import SalesHeatmap from './charts/SalesHeatmap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function StockManagement() {
  const { user } = useAuth();
  const { products } = useData();
  const { orders } = useOrder();

  const [selectedProduct, setSelectedProduct] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'evolution' | 'margins' | 'heatmap'>('overview');

  const reportRef = useRef<HTMLDivElement>(null);

  // PRO gate
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
          <p className="text-gray-600 dark:text-gray-300 mb-6">La Gestion de Stock est réservée aux abonnés PRO.</p>
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

  // ---------- Data helpers ----------
  const generateStockEvolutionData = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];
    const now = new Date();
    const out: { month: string; initialStock: number; sold: number; remaining: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = dt.getMonth(); const y = dt.getFullYear();
      const monthName = dt.toLocaleDateString('fr-FR', { month: 'short' });
      const sold = orders
        .filter(o => o.status === 'livre')
        .filter(o => { const d = new Date(o.orderDate); return d.getMonth() === m && d.getFullYear() === y; })
        .reduce((sum, o) => sum + o.items
          .filter(it => it.productName === product.name)
          .reduce((s, it) => s + (it.quantity || 0), 0), 0);
      out.push({ month: monthName, initialStock: product.stock, sold, remaining: Math.max(0, product.stock - sold) });
    }
    return out;
  };

  const getDetailedProductData = () => {
    return products.map(product => {
      let quantitySold = 0, salesValue = 0;
      const orderIds = new Set<string>();
      orders.forEach(o => {
        if (o.status === 'livre') {
          let has = false;
          o.items.forEach(it => {
            if (it.productName === product.name) {
              quantitySold += it.quantity;
              salesValue += it.total;
              has = true;
            }
          });
          if (has) orderIds.add(o.id);
        }
      });
      const remainingStock = product.stock - quantitySold;
      const purchaseValue = product.stock * product.purchasePrice;
      const margin = salesValue - quantitySold * product.purchasePrice;
      return { ...product, quantitySold, salesValue, ordersCount: orderIds.size, remainingStock, purchaseValue, margin };
    }).filter(p => selectedProduct === 'all' || p.id === selectedProduct);
  };
  const detailedData = getDetailedProductData();

  const generateDonutData = (type: 'sales' | 'stock') => {
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#84CC16', '#F97316', '#14B8A6'];
    if (type === 'sales') {
      const byProduct = products.map(p => {
        const v = orders.reduce((sum, o) => {
          if (o.status === 'livre') {
            return sum + o.items.filter(i => i.productName === p.name).reduce((s, i) => s + i.total, 0);
          }
          return sum;
        }, 0);
        return { product: p.name, value: v };
      }).filter(x => x.value > 0);
      const total = byProduct.reduce((s, x) => s + x.value, 0);
      return byProduct.map((x, i) => ({ label: x.product, value: x.value, color: colors[i % colors.length], percentage: total ? (x.value / total) * 100 : 0 }));
    }
    const stockBy = products.map(p => {
      const soldQty = orders.reduce((sum, o) => {
        if (o.status === 'livre') {
          return sum + o.items.filter(i => i.productName === p.name).reduce((s, i) => s + i.quantity, 0);
        }
        return sum;
      }, 0);
      const remaining = Math.max(0, p.stock - soldQty);
      return { product: p.name, value: remaining * p.purchasePrice };
    }).filter(x => x.value > 0);
    const total = stockBy.reduce((s, x) => s + x.value, 0);
    return stockBy.map((x, i) => ({ label: x.product, value: x.value, color: colors[i % colors.length], percentage: total ? (x.value / total) * 100 : 0 }));
  };

  const generateMarginData = () => products.map(p => {
    const s = orders.reduce((acc, o) => {
      if (o.status === 'livre') {
        o.items.forEach(i => { if (i.productName === p.name) { acc.quantity += i.quantity; acc.value += i.total; } });
      }
      return acc;
    }, { quantity: 0, value: 0 });
    const purchaseValue = s.quantity * p.purchasePrice;
    return { productName: p.name, margin: s.value - purchaseValue, salesValue: s.value, purchaseValue, unit: p.unit || 'unité' };
  }).filter(x => x.salesValue > 0);

  const generateMonthlySalesData = () => {
    const out: { month: string; quantity: number; value: number; ordersCount: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(selectedYear, i, 1);
      const label = date.toLocaleDateString('fr-FR', { month: 'short' });
      const monthOrders = orders.filter(o => {
        const d = new Date(o.orderDate);
        return d.getMonth() === i && d.getFullYear() === selectedYear && o.status === 'livre';
      });
      const m = monthOrders.reduce((acc, o) => {
        o.items.forEach(it => {
          if (selectedProduct === 'all' || it.productName === products.find(p => p.id === selectedProduct)?.name) {
            acc.quantity += it.quantity; acc.value += it.total;
          }
        });
        acc.ordersCount += 1;
        return acc;
      }, { quantity: 0, value: 0, ordersCount: 0 });
      out.push({ month: label, ...m });
    }
    return out;
  };

  const generateHeatmapData = () => {
    const months: string[] = Array.from({ length: 12 }, (_, i) =>
      new Date(selectedYear, i, 1).toLocaleDateString('fr-FR', { month: 'short' })
    );
    const names = products.map(p => p.name);
    const rows: any[] = [];
    let maxQ = 0;
    names.forEach(name => {
      months.forEach((m, idx) => {
        const q = orders.filter(o => {
          const d = new Date(o.orderDate);
          return d.getMonth() === idx && d.getFullYear() === selectedYear && o.status === 'livre';
        }).reduce((s, o) => s + o.items.filter(i => i.productName === name).reduce((a, i) => a + i.quantity, 0), 0);
        const v = orders.filter(o => {
          const d = new Date(o.orderDate);
          return d.getMonth() === idx && d.getFullYear() === selectedYear && o.status === 'livre';
        }).reduce((s, o) => s + o.items.filter(i => i.productName === name).reduce((a, i) => a + i.total, 0), 0);
        maxQ = Math.max(maxQ, q);
        rows.push({ month: m, productName: name, quantity: q, value: v, intensity: 0 });
      });
    });
    return rows.map(r => ({ ...r, intensity: maxQ ? r.quantity / maxQ : 0 }));
  };

  const calculateStats = (productFilter: string = 'all') => {
    let filtered = products;
    if (productFilter !== 'all') filtered = products.filter(p => p.id === productFilter);
    let totalStockInitial = 0, totalPurchaseValue = 0, totalSalesValue = 0, totalQuantitySold = 0, totalRemainingStock = 0, dormantProducts = 0;
    filtered.forEach(p => {
      totalStockInitial += p.stock;
      totalPurchaseValue += p.stock * p.purchasePrice;
      let q = 0, v = 0;
      orders.forEach(o => {
        if (o.status === 'livre') {
          o.items.forEach(i => { if (i.productName === p.name) { q += i.quantity; v += i.total; } });
        }
      });
      totalQuantitySold += q; totalSalesValue += v;
      const remaining = p.stock - q; totalRemainingStock += remaining;
      if (q === 0) dormantProducts++;
    });
    return {
      totalStockInitial, totalPurchaseValue, totalSalesValue,
      totalQuantitySold, totalRemainingStock, dormantProducts,
      grossMargin: totalSalesValue - totalPurchaseValue
    };
  };

  const stats = calculateStats(selectedProduct);
  const salesDonutData = generateDonutData('sales');
  const stockDonutData = generateDonutData('stock');
  const marginData = generateMarginData();
  const monthlySalesData = generateMonthlySalesData();
  const heatmapData = generateHeatmapData();

  const yearsFromOrders = [...new Set(orders.map(o => new Date(o.orderDate).getFullYear()))].sort((a, b) => b - a);
  const availableYears = yearsFromOrders.length ? yearsFromOrders : [new Date().getFullYear()];
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const tabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: BarChart3 },
    { id: 'evolution', label: 'Évolution', icon: TrendingUp },
    { id: 'margins', label: 'Marges', icon: DollarSign },
    { id: 'heatmap', label: 'Heatmap', icon: Activity }
  ] as const;

  // ---------- Export helpers ----------
  const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

  async function withTemporarilyVisible<T>(el: HTMLElement, work: () => Promise<T>): Promise<T> {
    const prev = {
      display: el.style.display,
      position: el.style.position,
      left: el.style.left,
      top: el.style.top,
      width: el.style.width,
      zIndex: el.style.zIndex,
      background: el.style.background,
      color: el.style.color
    };
    // rendre VISIBLE dans le viewport (sinon capture blanche)
    el.style.display = 'block';
    el.style.position = 'fixed';
    el.style.left = '0';
    el.style.top = '0';
    el.style.width = '794px'; // ~A4 @96dpi
    el.style.zIndex = '2147483647';
    el.style.background = '#ffffff';
    el.style.color = '#111111';

    try {
      // attendre fonts + layout
      // @ts-ignore
      if (document.fonts && document.fonts.ready) { try { await (document.fonts as any).ready; } catch {} }
      await wait(120);
      if (el.offsetHeight === 0 || el.offsetWidth === 0) {
        console.warn('PDF: élément sans taille => capture blanche', { w: el.offsetWidth, h: el.offsetHeight });
      } else {
        console.log('PDF node size', el.offsetWidth, el.offsetHeight);
      }
      return await work();
    } finally {
      // restore
      el.style.display = prev.display;
      el.style.position = prev.position;
      el.style.left = prev.left;
      el.style.top = prev.top;
      el.style.width = prev.width;
      el.style.zIndex = prev.zIndex;
      el.style.background = prev.background;
      el.style.color = prev.color;
    }
  }

  const doHtml2CanvasFallback = async (el: HTMLElement, filename: string) => {
    const a4pt = { w: 595.28, h: 841.89 };
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
    const img = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    const imgW = a4pt.w, imgH = (canvas.height * imgW) / canvas.width;
    let y = 0;
    pdf.addImage(img, 'JPEG', 0, y, imgW, imgH, undefined, 'FAST');
    let remaining = imgH - a4pt.h;
    while (remaining > 0) {
      pdf.addPage();
      y -= a4pt.h;
      pdf.addImage(img, 'JPEG', 0, y, imgW, imgH, undefined, 'FAST');
      remaining -= a4pt.h;
    }
    pdf.save(filename);
  };

  const handleExportPDF = async () => {
    const el = reportRef.current;
    if (!el) return;
    const filename = `Rapport_Stock_Avance_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;

    await withTemporarilyVisible(el, async () => {
      try {
        const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
        // @ts-ignore
        await doc.html(el, {
          margin: 20,
          autoPaging: 'text',
          html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false },
          windowWidth: el.scrollWidth,
          callback: (pdf: jsPDF) => pdf.save(filename)
        });
      } catch (e) {
        console.warn('jsPDF.html failed, fallback to html2canvas', e);
        await doHtml2CanvasFallback(el, filename);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ===== SOURCE PDF : caché par défaut (display:none), rendu visible TEMPORAIREMENT au moment de l'export ===== */}
      <div ref={reportRef} style={{ display: 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #8B5CF6', paddingBottom: 12 }}>
          <h1 style={{ fontSize: 22, color: '#8B5CF6', margin: 0, fontWeight: 700 }}>RAPPORT DE GESTION DE STOCK AVANCÉ</h1>
          <h2 style={{ fontSize: 16, margin: '6px 0', fontWeight: 700, color: '#111' }}>{user?.company?.name || ''}</h2>
          <p style={{ fontSize: 12, color: '#111', margin: 0 }}>Généré le {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <h3 style={{ fontSize: 14, margin: '0 0 8px', fontWeight: 700, color: '#111' }}>Statistiques Globales</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12, color: '#111' }}>
          <tbody>
            <tr><td style={{ border: '1px solid #e5e7eb', padding: 8 }}>Stock initial</td><td style={{ border: '1px solid #e5e7eb', padding: 8, fontWeight: 700 }}>{stats.totalStockInitial.toFixed(0)} {products[0]?.unit || ''}</td></tr>
            <tr><td style={{ border: '1px solid #e5e7eb', padding: 8 }}>Valeur d'achat</td><td style={{ border: '1px solid #e5e7eb', padding: 8, fontWeight: 700 }}>{stats.totalPurchaseValue.toLocaleString()} MAD</td></tr>
            <tr><td style={{ border: '1px solid #e5e7eb', padding: 8 }}>Valeur de vente</td><td style={{ border: '1px solid #e5e7eb', padding: 8, fontWeight: 700 }}>{stats.totalSalesValue.toLocaleString()} MAD</td></tr>
            <tr><td style={{ border: '1px solid #e5e7eb', padding: 8 }}>Marge brute</td>
              <td style={{ border: '1px solid #e5e7eb', padding: 8, fontWeight: 700, color: stats.grossMargin >= 0 ? '#059669' : '#DC2626' }}>
                {stats.grossMargin >= 0 ? '+' : ''}{stats.grossMargin.toLocaleString()} MAD
              </td></tr>
            <tr><td style={{ border: '1px solid #e5e7eb', padding: 8 }}>Stock restant</td><td style={{ border: '1px solid #e5e7eb', padding: 8, fontWeight: 700 }}>{stats.totalRemainingStock.toFixed(0)} {products[0]?.unit || ''}</td></tr>
            <tr><td style={{ border: '1px solid #e5e7eb', padding: 8 }}>Produits non vendus</td><td style={{ border: '1px solid #e5e7eb', padding: 8, fontWeight: 700 }}>{stats.dormantProducts}</td></tr>
          </tbody>
        </table>

        <h3 style={{ fontSize: 14, margin: '16px 0 8px', fontWeight: 700, color: '#111' }}>Analyse détaillée par produit</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, color: '#111' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'left' }}>Produit</th>
              <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Stock initial</th>
              <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Qté vendue</th>
              <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Stock restant</th>
              <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Achat (MAD)</th>
              <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Vente (MAD)</th>
              <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Marge (MAD)</th>
            </tr>
          </thead>
          <tbody>
            {detailedData.map(p => (
              <tr key={p.id}>
                <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>{p.name}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>{p.stock.toFixed(3)} {p.unit || ''}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>{p.quantitySold.toFixed(3)} {p.unit || ''}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>{p.remainingStock.toFixed(3)} {p.unit || ''}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>{p.purchaseValue.toLocaleString()}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>{p.salesValue.toLocaleString()}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right', color: p.margin >= 0 ? '#059669' : '#DC2626' }}>
                  {p.margin >= 0 ? '+' : ''}{p.margin.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* ===== /SOURCE PDF ===== */}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span>Gestion de Stock Avancée</span>
            <Crown className="w-6 h-6 text-yellow-500" />
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Analyse avancée + export PDF.</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Filtres / Tabs / Contenu — gardez votre UI existante ici */}
      {/* … vos blocs KPI, graphiques, tableaux (inchangés) … */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
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
          <p className="text-gray-600 dark:text-gray-300">Choisissez un produit dans les filtres.</p>
        </div>
      )}
      {activeTab === 'margins' && <MarginChart data={marginData} />}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          <MonthlySalesChart data={generateMonthlySalesData()} selectedYear={selectedYear} />
          <SalesHeatmap data={heatmapData} products={products.map(p => p.name)} months={months} selectedYear={selectedYear} />
        </div>
      )}
      {/* … votre grand tableau détaillé … */}
    </div>
  );
}
