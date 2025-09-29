// /home/project/src/components/stock/StockManagement.tsx
import React, { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useOrder } from '../../contexts/OrderContext';
import {
  TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle,
  Download, Search, Crown, BarChart3, TrendingDown, CheckCircle, XCircle, Activity, RotateCcw
} from 'lucide-react';
import StockEvolutionChart from './charts/StockEvolutionChart';
import DonutChart from './charts/DonutChart';
import MarginChart from './charts/MarginChart';
import MonthlySalesChart from './charts/MonthlySalesChart';
import SalesHeatmap from './charts/SalesHeatmap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- types souples (contexte projet) ---
type OrderItem = { productName: string; quantity: number; total: number };
type Order = { id: string; orderDate: string; status: string; items: OrderItem[] };
type Product = {
  id: string; name: string; category: string; unit?: string;
  stock: number; minStock: number; purchasePrice: number;
};
type StockMovement = { productId: string; type: 'adjustment'|'in'|'out'; quantity: number; date: string };

export default function StockManagement() {
  const { user } = useAuth();
  const { products, stockMovements = [] } = useData() as { products: Product[]; stockMovements?: StockMovement[] };
  const { orders } = useOrder() as { orders: Order[] };

  const [selectedProduct, setSelectedProduct] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'evolution' | 'margins' | 'heatmap'>('overview');

  const reportRef = useRef<HTMLDivElement>(null);

  // Accès PRO
  const isProActive =
    user?.company?.subscription === 'pro' &&
    user?.company?.expiryDate &&
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
          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold">
            Passer à PRO - 299 MAD/mois
          </button>
        </div>
      </div>
    );
  }

  // ---------- Helpers ----------
  const getSelectedProduct = () => products.find(p => p.id === selectedProduct);
  const unitLabel = () => (selectedProduct !== 'all' ? (getSelectedProduct()?.unit || 'unité') : '');

  const sumRectif = (productId: string) =>
    stockMovements
      .filter(m => m.productId === productId && m.type === 'adjustment')
      .reduce((s, m) => s + (m.quantity || 0), 0);

  const waitForFonts = async () => {
    // évite graphes vides pendant la capture
    // @ts-ignore
    if (document.fonts?.ready) { try { await (document.fonts as any).ready; } catch {} }
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 180)));
  };

  // ---------- Data builders ----------
  const generateStockEvolutionData = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];
    const now = new Date();
    const out: { month: string; initialStock: number; sold: number; remaining: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = dt.getMonth(); const y = dt.getFullYear();
      const sold = orders
        .filter(o => o.status === 'livre')
        .filter(o => { const d = new Date(o.orderDate); return d.getMonth() === m && d.getFullYear() === y; })
        .reduce((sum, o) => sum + o.items
          .filter(it => it.productName === product.name)
          .reduce((s, it) => s + (it.quantity || 0), 0), 0);
      out.push({
        month: dt.toLocaleDateString('fr-FR', { month: 'short' }),
        initialStock: product.stock,
        sold,
        remaining: Math.max(0, product.stock - sold + sumRectif(product.id)),
      });
    }
    return out;
  };

  const getDetailedProductData = () => {
    return products.map(product => {
      let quantitySold = 0, salesValue = 0;
      const ordersSet = new Set<string>();
      orders.forEach(order => {
        if (order.status === 'livre') {
          let has = false;
          order.items.forEach(item => {
            if (item.productName === product.name) {
              quantitySold += item.quantity;
              salesValue += item.total;
              has = true;
            }
          });
          if (has) ordersSet.add(order.id);
        }
      });
      const rectif = sumRectif(product.id);
      const remainingStock = product.stock - quantitySold + rectif;
      const purchaseValue = product.stock * product.purchasePrice;
      const margin = salesValue - quantitySold * product.purchasePrice;
      return { ...product, quantitySold, salesValue, ordersCount: ordersSet.size, remainingStock, purchaseValue, margin, rectif };
    }).filter(p => selectedProduct === 'all' || p.id === selectedProduct);
  };
  const detailedData = getDetailedProductData();

  const generateDonutData = (type: 'sales' | 'stock') => {
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#84CC16', '#F97316', '#14B8A6'];
    if (type === 'sales') {
      const list = products.map(product => {
        const v = orders.reduce((sum, order) => {
          if (order.status === 'livre') return sum + order.items.filter(i => i.productName === product.name).reduce((s, i) => s + i.total, 0);
          return sum;
        }, 0);
        return { product: product.name, value: v };
      }).filter(x => x.value > 0);
      const total = list.reduce((s, x) => s + x.value, 0);
      return list.map((x, i) => ({ label: x.product, value: x.value, color: colors[i % colors.length], percentage: total ? (x.value / total) * 100 : 0 }));
    }
    const list = products.map(product => {
      const soldQ = orders.reduce((sum, order) => {
        if (order.status === 'livre') return sum + order.items.filter(i => i.productName === product.name).reduce((s, i) => s + i.quantity, 0);
        return sum;
      }, 0);
      const remaining = Math.max(0, product.stock - soldQ + sumRectif(product.id));
      return { product: product.name, value: remaining * product.purchasePrice };
    }).filter(x => x.value > 0);
    const total = list.reduce((s, x) => s + x.value, 0);
    return list.map((x, i) => ({ label: x.product, value: x.value, color: colors[i % colors.length], percentage: total ? (x.value / total) * 100 : 0 }));
  };

  const generateMarginData = () => products.map(product => {
    const s = orders.reduce((acc, order) => {
      if (order.status === 'livre') {
        order.items.forEach(it => { if (it.productName === product.name) { acc.quantity += it.quantity; acc.value += it.total; } });
      }
      return acc;
    }, { quantity: 0, value: 0 });
    const purchaseValue = s.quantity * product.purchasePrice;
    return { productName: product.name, margin: s.value - purchaseValue, salesValue: s.value, purchaseValue, unit: product.unit || 'unité' };
  }).filter(x => x.salesValue > 0);

  const generateMonthlySalesData = () => {
    const out: { month: string; quantity: number; value: number; ordersCount: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(selectedYear, i, 1);
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      const monthOrders = orders.filter(order => {
        const dd = new Date(order.orderDate);
        return dd.getMonth() === i && dd.getFullYear() === selectedYear && order.status === 'livre';
      });
      const m = monthOrders.reduce((acc, order) => {
        order.items.forEach(it => {
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

  // ---------- Stats ----------
  const calculateStats = (productFilter: string = 'all') => {
    let filtered = products;
    if (productFilter !== 'all') filtered = products.filter(p => p.id === productFilter);
    let totalStockInitial = 0, totalPurchaseValue = 0, totalSalesValue = 0, totalQuantitySold = 0, totalRemainingStock = 0, dormantProducts = 0, totalRectif = 0;
    filtered.forEach(product => {
      totalStockInitial += product.stock;
      totalPurchaseValue += product.stock * product.purchasePrice;
      let q = 0, v = 0;
      orders.forEach(order => {
        if (order.status === 'livre') {
          order.items.forEach(i => { if (i.productName === product.name) { q += i.quantity; v += i.total; } });
        }
      });
      const rectif = sumRectif(product.id);
      totalRectif += rectif;
      totalQuantitySold += q; totalSalesValue += v;
      totalRemainingStock += (product.stock - q + rectif);
      if (q === 0) dormantProducts++;
    });
    return {
      totalStockInitial, totalPurchaseValue, totalSalesValue,
      totalQuantitySold, totalRemainingStock, dormantProducts,
      totalRectif,
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

  // ---------- Export PDF (sections + scale-to-fit) ----------
  async function exportPDFBySections(container: HTMLElement, filename: string) {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const margin = 10, gap = 4;
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const contentW = pageW - margin * 2;
    const contentH = pageH - margin * 2;

    let y = margin;
    const sections = Array.from(container.querySelectorAll<HTMLElement>('.pdf-section'));
    for (const sec of sections) {
      const canvas = await html2canvas(sec, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      const wpx = canvas.width, hpx = canvas.height;
      const mmHIfFullWidth = (hpx * contentW) / wpx;

      let drawW = contentW, drawH = mmHIfFullWidth;
      if (mmHIfFullWidth > contentH) {
        const scale = contentH / mmHIfFullWidth;
        drawW = contentW * scale;
        drawH = contentH; // fit page
      }

      if (y + drawH > pageH - margin) { pdf.addPage(); y = margin; }
      const x = margin + (contentW - drawW) / 2;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', x, y, drawW, drawH, undefined, 'FAST');
      y += drawH + gap;
    }

    const pages = pdf.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i); pdf.setFontSize(9);
      pdf.text(`${i} / ${pages}`, pageW - margin, pageH - 5, { align: 'right' });
    }
    pdf.save(filename);
  }

  const handleExportPDF = async () => {
    const el = reportRef.current; if (!el) return;
    // rendre visible avec largeur A4 @96dpi
    const prev = { display: el.style.display, position: el.style.position, left: el.style.left, top: el.style.top, width: el.style.width, z: el.style.zIndex, bg: el.style.background, color: el.style.color };
    el.style.display = 'block'; el.style.position = 'fixed'; el.style.left = '0'; el.style.top = '0'; el.style.width = '794px'; el.style.zIndex = '2147483647'; el.style.background = '#fff'; el.style.color = '#111';
    try {
      await waitForFonts();
      await exportPDFBySections(el, `Rapport_Stock_Avance_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`);
    } finally {
      el.style.display = prev.display; el.style.position = prev.position; el.style.left = prev.left; el.style.top = prev.top; el.style.width = prev.width; el.style.zIndex = prev.z; el.style.background = prev.bg; el.style.color = prev.color;
    }
  };

  // ---------- RAPPORT IMPRIMABLE ----------
  const logoUrl = (user?.company as any)?.logo || (user?.company as any)?.logoUrl || '';

  return (
    <div className="space-y-6">
      {/* ========= Rapport (caché) ========= */}
      <div
        ref={reportRef}
        style={{ display: 'none', fontFamily: 'Arial, ui-sans-serif, system-ui', fontSize: 12, lineHeight: 1.4, color: '#111' }}
      >
        {/* Header avec logo */}
        <section className="pdf-section" style={{ padding: 20, borderBottom: '2px solid #8B5CF6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="logo"
                crossOrigin="anonymous"
                style={{ width: 48, height: 48, objectFit: 'contain' }}
              />
            ) : null}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, color: '#8B5CF6', fontWeight: 800, marginBottom: 4 }}>
                RAPPORT DE GESTION DE STOCK AVANCÉ
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.company?.name || ''}</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>Généré le {new Date().toLocaleDateString('fr-FR')}</div>
            </div>
          </div>
        </section>

        {/* KPIs (avec unité si produit sélectionné) */}
        <section className="pdf-section" style={{ padding: '12px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Statistiques Globales</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>Stock initial</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, fontWeight: 700 }}>
                  {stats.totalStockInitial.toFixed(0)} {unitLabel()}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>Valeur d'achat</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, fontWeight: 700 }}>
                  {stats.totalPurchaseValue.toLocaleString()} MAD
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>Valeur de vente</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, fontWeight: 700 }}>
                  {stats.totalSalesValue.toLocaleString()} MAD
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>Marge brute</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, fontWeight: 700, color: stats.grossMargin >= 0 ? '#059669' : '#DC2626' }}>
                  {stats.grossMargin >= 0 ? '+' : ''}{stats.grossMargin.toLocaleString()} MAD
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>Stock vendu</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, fontWeight: 700 }}>
                  {stats.totalQuantitySold.toFixed(0)} {unitLabel()}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>Stock rectif</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, fontWeight: 700, color: stats.totalRectif >= 0 ? '#2563EB' : '#DC2626' }}>
                  {stats.totalRectif >= 0 ? '+' : ''}{stats.totalRectif.toFixed(0)} {unitLabel()}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>Stock restant</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 6, fontWeight: 700 }}>
                  {stats.totalRemainingStock.toFixed(0)} {unitLabel()}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Donuts (taille réduite) */}
        <section className="pdf-section" style={{ padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Répartition des Ventes</div>
              <div style={{ width: '100%', height: 70, transform: 'translateZ(0)' }}>
                <DonutChart data={salesDonutData} title="" subtitle="" centerValue={`${stats.totalSalesValue.toLocaleString()}`} centerLabel="MAD Total" />
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Valeur du Stock Restant</div>
              <div style={{ width: '100%', height: 170, transform: 'translateZ(0)' }}>
                <DonutChart data={stockDonutData} title="" subtitle="" centerValue={`${stockDonutData.reduce((s, i) => s + i.value, 0).toLocaleString()}`} centerLabel="MAD Stock" />
              </div>
            </div>
          </div>
        </section>

        {/* Marges (taille réduite) */}
        <section className="pdf-section" style={{ padding: '10px 20px 0' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Marge Brute par Produit</div>
            <div style={{ width: '100%', height: 180, transform: 'translateZ(0)' }}>
              <MarginChart data={marginData} />
            </div>
          </div>
        </section>

        {/* Ventes mensuelles (taille réduite) */}
        <section className="pdf-section" style={{ padding: '10px 20px 0' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Ventes Mensuelles {selectedYear}</div>
            <div style={{ width: '100%', height: 200, transform: 'translateZ(0)' }}>
              <MonthlySalesChart data={monthlySalesData} selectedYear={selectedYear} />
            </div>
          </div>
        </section>

        {/* Tableau détaillé */}
        <section className="pdf-section" style={{ padding: '10px 20px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Analyse détaillée par produit</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'left' }}>Produit</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Stock initial</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Qté vendue</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Stock rectif</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Stock restant</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Achat (MAD)</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Vente (MAD)</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>Marge (MAD)</th>
              </tr>
            </thead>
            <tbody>
              {getDetailedProductData().map(p => (
                <tr key={p.id}>
                  <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>{p.name}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>{p.stock.toFixed(3)} {p.unit || ''}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right' }}>{p.quantitySold.toFixed(3)} {p.unit || ''}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: 6, textAlign: 'right', color: p.rectif >= 0 ? '#2563EB' : '#DC2626' }}>
                    {p.rectif >= 0 ? '+' : ''}{p.rectif.toFixed(3)} {p.unit || ''}
                  </td>
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
        </section>
      </div>
      {/* ========= /Rapport ========= */}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span>Gestion de Stock Avancée</span>
            <Crown className="w-6 h-6 text-yellow-500" />
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            KPI: Stock vendu, rectif & restant (avec unité si un produit est sélectionné).
          </p>
        </div>
        <button onClick={handleExportPDF} className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg">
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
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tous les produits</option>
              {products.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.category})</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Année d'analyse</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Période d'analyse</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Rechercher..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon as any;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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

      {/* Vue d'ensemble avec KPI supplémentaires */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stock initial */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalStockInitial.toFixed(0)} {unitLabel()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Stock Initial</p>
                </div>
              </div>
            </div>

            {/* Valeur d'achat */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalPurchaseValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Valeur d'Achat (MAD)</p>
                </div>
              </div>
            </div>

            {/* Valeur de vente */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalSalesValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Valeur de Vente (MAD)</p>
                </div>
              </div>
            </div>

            {/* Marge brute */}
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
                    {stats.grossMargin >= 0 ? '+' : ''}{stats.grossMargin.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Marge Brute (MAD)</p>
                </div>
              </div>
            </div>

            {/* Stock restant */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalRemainingStock.toFixed(0)} {unitLabel()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Stock Restant</p>
                </div>
              </div>
            </div>

            {/* Stock vendu */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalQuantitySold.toFixed(0)} {unitLabel()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Stock Vendu</p>
                </div>
              </div>
            </div>

            {/* Stock rectif */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-600 rounded-lg flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stats.totalRectif >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {stats.totalRectif >= 0 ? '+' : ''}{stats.totalRectif.toFixed(0)} {unitLabel()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Stock Rectif</p>
                </div>
              </div>
            </div>
          </div>

          {/* Graphiques synthèse */}
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
          productName={getSelectedProduct()?.name || 'Produit'}
          unit={getSelectedProduct()?.unit || 'unité'}
        />
      )}

      {activeTab === 'evolution' && selectedProduct === 'all' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Sélectionnez un produit</h3>
          <p className="text-gray-600 dark:text-gray-300">Choisissez un produit spécifique dans les filtres.</p>
        </div>
      )}

      {activeTab === 'margins' && <MarginChart data={marginData} />}

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock Rectif</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock Restant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valeur d'Achat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valeur de Vente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Marge Brute</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {detailedData.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{p.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {p.stock.toFixed(3)} {p.unit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Min: {p.minStock.toFixed(3)} {p.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {p.quantitySold.toFixed(3)} {p.unit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{p.ordersCount} commande{p.ordersCount > 1 ? 's' : ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${p.rectif >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {p.rectif >= 0 ? '+' : ''}{p.rectif.toFixed(3)} {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${p.remainingStock <= p.minStock ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                        {p.remainingStock.toFixed(3)} {p.unit}
                      </span>
                      {p.remainingStock <= p.minStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {p.purchaseValue.toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {p.salesValue.toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${p.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {p.margin >= 0 ? '+' : ''}{p.margin.toLocaleString()} MAD
                      </span>
                      {p.margin >= 0 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
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

      {/* Indicateurs globaux */}
      {stats.grossMargin < 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">⚠️ Performance Déficitaire</h3>
          </div>
          <p className="text-red-800 dark:text-red-200">
            Marge brute négative de <strong>{Math.abs(stats.grossMargin).toLocaleString()} MAD</strong>.
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
            Marge brute : <strong>+{stats.grossMargin.toLocaleString()} MAD</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
