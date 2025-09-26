// src/components/stock/StockHistoryModal.tsx
import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useOrder } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../contexts/DataContext';
import Modal from '../common/Modal';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import {
  Package,
  RotateCcw,
  ShoppingCart,
  Download,
  Calendar,
  User,
  FileText,
  Clock,
  ExternalLink,
  X
} from 'lucide-react';

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function StockHistoryModal({ isOpen, onClose, product }: StockHistoryModalProps) {
  const { stockMovements } = useData();
  const { orders, getOrderById } = useOrder();
  const { user } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month' | 'quarter'>('all');
  const [filterType, setFilterType] = useState<'all' | 'orders' | 'adjustments' | 'initial'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [viewingOrder, setViewingOrder] = useState<string | null>(null);

  // --- utils
  const normQty = (type: string, q: number) => {
    if (type === 'order_out') return -Math.abs(q);
    if (type === 'order_cancel_return') return Math.abs(q);
    return q;
  };

  // Déduplication des mouvements de commandes (évite les doublons à l’annulation)
  const dedupeOrderMovements = (movs: any[]) => {
    const map = new Map<string, any>();
    for (const m of movs) {
      const qty = Math.abs(Number(m.quantity || 0));
      const key = [
        m.type,
        String(m.orderId || ''),
        String(m.productId || ''),
        String(m.reference || ''),
        qty.toFixed(3),
      ].join('|');

      const current = map.get(key);
      if (!current) {
        map.set(key, m);
      } else {
        // on garde le plus récent
        const d1 = new Date(current.adjustmentDateTime || current.date).getTime();
        const d2 = new Date(m.adjustmentDateTime || m.date).getTime();
        if (d2 >= d1) map.set(key, m);
      }
    }
    return Array.from(map.values());
  };

  /** Historique brut (initial + rectifs + commandes SM dédupliquées + commandes synthétiques) */
  const buildBaseHistory = () => {
    const history: any[] = [];

    if ((product.initialStock || 0) > 0) {
      history.push({
        id: `initial-${product.id}`,
        type: 'initial',
        date: product.createdAt,
        quantity: Number(product.initialStock) || 0,
        previousStock: 0,
        newStock: Number(product.initialStock) || 0,
        reason: 'Stock initial',
        userName: 'Système',
        reference: '',
        orderId: null,
        orderDetails: null
      });
    }

    // Rectifications
    stockMovements
      .filter(m => m.productId === product.id && m.type === 'adjustment')
      .forEach(m => {
        history.push({
          id: m.id,
          type: m.type,
          date: m.adjustmentDateTime || m.date,
          quantity: Number(m.quantity) || 0,
          previousStock: 0,
          newStock: 0,
          reason: m.reason || 'Rectification',
          userName: m.userName,
          reference: m.reference || '',
          orderId: m.orderId || null,
          orderDetails: m.orderDetails || null
        });
      });

    // Mouvements commandes depuis stockMovements (dédupliqués)
    const orderMovementsFromSMRaw = stockMovements.filter(
      m => m.productId === product.id && (m.type === 'order_out' || m.type === 'order_cancel_return')
    );
    const orderMovementsFromSM = dedupeOrderMovements(orderMovementsFromSMRaw);

    orderMovementsFromSM.forEach(m => {
      history.push({
        id: m.id,
        type: m.type,
        date: m.adjustmentDateTime || m.date,
        quantity: normQty(m.type, Number(m.quantity) || 0),
        previousStock: 0,
        newStock: 0,
        reason: m.type === 'order_out' ? 'Commande livrée' : 'Commande annulée',
        userName: m.userName,
        reference: m.reference || '',
        orderId: m.orderId || null,
        orderDetails: m.orderDetails || null
      });
    });

    // Ordes livrés présents dans orders mais pas dans stockMovements → synthèse
    const smOrderIds = new Set(orderMovementsFromSM.map(m => String(m.orderId || '')));
    orders.forEach(order => {
      if (order.status !== 'livre') return;
      if (smOrderIds.has(String(order.id))) return;

      const qtyForProduct = (order.items || [])
        .filter((i: any) => i?.productName === product.name)
        .reduce((s: number, i: any) => s + Number(i?.quantity || 0), 0);

      if (qtyForProduct > 0) {
        const date =
          (order.deliveryDate as any) ||
          (order.updatedAt as any) ||
          (order.orderDate as any) ||
          new Date().toISOString();

        history.push({
          id: `ord-${order.id}-${product.id}`,
          type: 'order_out',
          date,
          quantity: -Math.abs(qtyForProduct),
          previousStock: 0,
          newStock: 0,
          reason: 'Commande livrée',
          userName: order.createdByName || order.userName || 'Système',
          reference: order.number || '',
          orderId: order.id,
          orderDetails: {
            orderNumber: order.number,
            clientName:
              order.clientType === 'personne_physique'
                ? order.clientName
                : order.client?.name,
            clientType: order.clientType,
            orderTotal: order.totalTTC,
            orderDate: order.orderDate
          }
        });
      }
    });

    return history;
  };

  /** Rejoue les mouvements pour obtenir previous/new corrects */
  const enrichWithRunningStock = (base: any[]) => {
    const asc = [...base].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let running = 0;
    asc.forEach(item => {
      if (item.type === 'initial') {
        item.previousStock = 0;
        running = Number(item.quantity) || 0;
        item.newStock = running;
      } else {
        item.previousStock = running;
        running += Number(item.quantity) || 0;
        item.newStock = running;
      }
    });

    return asc.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const history = enrichWithRunningStock(buildBaseHistory());

  // ------- Résumé -------
  const summary = {
    initialStock: product.initialStock || 0,
    totalOrdersSold: orders.reduce((sum, order) => {
      if (order.status === 'livre') {
        return (
          sum +
          order.items
            .filter((i: any) => i.productName === product.name)
            .reduce((x: number, i: any) => x + (i.quantity || 0), 0)
        );
      }
      return sum;
    }, 0),
    totalAdjustments: stockMovements
      .filter(m => m.productId === product.id && m.type === 'adjustment')
      .reduce((s, m) => s + (m.quantity || 0), 0),
    currentStock: history.length ? Number(history[0].newStock || 0) : Number(product.initialStock || 0)
  };

  // ------- Filtres -------
  const inPeriod = (dateStr: string) => {
    if (selectedPeriod === 'all') return true;
    const d = new Date(dateStr).getTime();
    const now = Date.now();
    if (selectedPeriod === 'week') return d >= now - 7 * 24 * 60 * 60 * 1000;
    if (selectedPeriod === 'month') return d >= now - 30 * 24 * 60 * 60 * 1000;
    if (selectedPeriod === 'quarter') return d >= now - 90 * 24 * 60 * 60 * 1000;
    return true;
  };

  const inRange = (dateStr: string) => {
    if (!startDate && !endDate) return true;
    const d = new Date(dateStr);
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      if (d < s) return false;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      if (d > e) return false;
    }
    return true;
  };

  const typeOK = (t: string) => {
    if (filterType === 'all') return true;
    if (filterType === 'orders') return t === 'order_out' || t === 'order_cancel_return';
    if (filterType === 'adjustments') return t === 'adjustment';
    if (filterType === 'initial') return t === 'initial';
    return true;
  };

  const filteredHistory = history.filter(m => inPeriod(m.date) && inRange(m.date) && typeOK(m.type));

  // ------- UI helpers -------
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'initial':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'order_out':
        return <ShoppingCart className="w-4 h-4 text-red-600" />;
      case 'order_cancel_return':
        return <Package className="w-4 h-4 text-green-600" />;
      case 'adjustment':
        return <RotateCcw className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };
  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'initial':
        return 'Stock initial';
      case 'order_out':
        return 'Commande livrée';
      case 'order_cancel_return':
        return 'Commande annulée';
      case 'adjustment':
        return 'Rectification';
      default:
        return 'Mouvement';
    }
  };
  const getMovementColor = (q: number) => (q > 0 ? 'text-green-600' : q < 0 ? 'text-red-600' : 'text-gray-600');
  const handleViewOrder = (orderId: string) => setViewingOrder(orderId);

  // ------- image -> dataURL -------
  const loadImageAsDataURL = (url: string): Promise<string> =>
    new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve('');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve('');
        img.src = url;
      } catch {
        resolve('');
      }
    });

  // ------- Export PDF (Motif -> Client) -------
  const exportStockPDF = async () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape', compress: true });
    const pageWidth = doc.internal.pageSize.getWidth();
    const lrMargin = 40;
    const usableWidth = pageWidth - lrMargin * 2;
    let y = 100;

    const companyName = user?.company?.name || '';
    const logoUrl = (user?.company as any)?.logo || (user?.company as any)?.logoUrl || '';
    if (companyName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text(companyName, lrMargin, y);
    }

    if (logoUrl) {
      const dataUrl = await loadImageAsDataURL(logoUrl);
      if (dataUrl) {
        const imgW = 70;
        const imgH = 70;
        doc.addImage(dataUrl, 'PNG', pageWidth - lrMargin - imgW , imgH + 6, imgW, imgH, undefined, 'FAST');
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text('Historique du Stock', pageWidth / 2, y, { align: 'center' });
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text(`${product.name} • ${product.category} • ${product.unit}`, pageWidth / 2, y, { align: 'center' });
    y += 16;
    doc.setTextColor(71, 85, 105);
    const filtDates =
      startDate || endDate
        ? ` • Période: ${startDate || '…'} → ${endDate || '…'}`
        : '';
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}${filtDates}`, pageWidth / 2, y, { align: 'center' });
    y += 24;

    const gap = 30;
    const cardW = (usableWidth - gap * 3) / 4;
    const cardH = 64;
    const startX = lrMargin;
    const cards = [
      { label: 'Stock initial', value: summary.initialStock.toFixed(3), color: [37, 99, 235] as const },
      { label: 'Total commandé', value: summary.totalOrdersSold.toFixed(3), color: [220, 38, 38] as const },
      { label: 'Rectifications', value: `${summary.totalAdjustments > 0 ? '+' : ''}${summary.totalAdjustments.toFixed(3)}`, color: [124, 58, 237] as const },
      { label: 'Stock actuel', value: summary.currentStock.toFixed(3), color: [22, 163, 74] as const }
    ];

    cards.forEach((c, i) => {
      const x = startX + i * (cardW + gap);
      const [r, g, b] = c.color;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.roundedRect(x, y, cardW, cardH, 10, 10);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(c.label, x + 12, y + 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(r, g, b);
      doc.text(c.value, x + 12, y + 42);
      doc.setFont('helvetica', 'normal');
    });

    y += cardH + 20;

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Mouvements', lrMargin, y);
    y += 8;

    const body: RowInput[] =
      filteredHistory.length === 0
        ? [['—', '—', '—', '—', '—', '—']]
        : filteredHistory.map(h => {
            const d = new Date(h.date);
            const dateTime = `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}`;
            const qty = Number(h.quantity ?? 0);
            const qtyText = `${qty > 0 ? '+' : ''}${qty.toFixed(3)} ${product.unit}`;
            const stockText = `${Number(h.previousStock ?? 0).toFixed(3)} --> ${Number(h.newStock ?? 0).toFixed(3)}`;

            let clientText = '—';
            if (h.orderDetails?.clientName) {
              clientText = String(h.orderDetails.clientName);
            } else if (h.orderId) {
              const od = getOrderById(h.orderId);
              if (od) {
                clientText = od.clientType === 'personne_physique' ? (od.clientName || '—') : (od.client?.name || '—');
              }
            }

            return [dateTime, getMovementLabel(h.type), qtyText, stockText, clientText, h.reference || ''];
          });

    autoTable(doc, {
      startY: y + 10,
      head: [[ 'Date & Heure', 'Type', 'Quantité', 'Stock', 'Client', 'Réf.' ]],
      body,
      margin: { left: lrMargin, right: lrMargin },
      tableWidth: usableWidth,
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, overflow: 'linebreak', valign: 'middle' },
      headStyles: { fillColor: [239, 246, 255], textColor: [15, 23, 42], lineColor: [226, 232, 240] },
      bodyStyles: { lineColor: [226, 232, 240] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 110 },
        2: { cellWidth: 100 },
        3: { cellWidth: 120 },
        4: { cellWidth: 150 },
        5: { cellWidth: 100 }
      },
      didParseCell: data => {
        if (data.section === 'body' && data.column.index === 2) {
          const txt = String(data.cell.raw || '');
          if (txt.startsWith('+')) data.cell.styles.textColor = [22, 163, 74];
          else if (txt.startsWith('-')) data.cell.styles.textColor = [220, 38, 38];
        }
      }
    });

    const filename = `historique_${product.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historique du Stock" size="xl">
      <div className="space-y-6">
        {/* Header + cartes résumé */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">{product.name}</h3>
                <p className="text-blue-700 dark:text-blue-300">
                  {product.category} • {product.unit}
                </p>
              </div>
            </div>
            <button onClick={exportStockPDF} className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600">
              <div className="text-lg font-bold text-blue-600">{summary.initialStock.toFixed(3)}</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Stock initial</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-600">
              <div className="text-lg font-bold text-red-600">{summary.totalOrdersSold.toFixed(3)}</div>
              <div className="text-xs text-red-700 dark:text-red-300">Total commandé</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-600">
              <div className={`text-lg font-bold ${summary.totalAdjustments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.totalAdjustments > 0 ? '+' : ''}
                {summary.totalAdjustments.toFixed(3)}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">Rectifications</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-600">
              <div className="text-lg font-bold text-green-600">{summary.currentStock.toFixed(3)}</div>
              <div className="text-xs text-green-700 dark:text-green-300">Stock actuel</div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Période rapide</label>
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Toute la période</option>
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="quarter">3 derniers mois</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type de mouvement</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Tous</option>
                <option value="orders">Commandes</option>
                <option value="adjustments">Rectifications</option>
                <option value="initial">Stock initial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Du</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Au</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={exportStockPDF}
                className="w-full inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Liste mouvements */}
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((movement: any) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                      {getMovementIcon(movement.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {getMovementLabel(movement.type)}
                        </span>
                        <span className={`font-bold ${getMovementColor(movement.quantity ?? 0)}`}>
                          {(movement.quantity ?? 0) > 0 ? '+' : ''}
                          {Number(movement.quantity ?? 0).toFixed(3)} {product.unit}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(movement.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(movement.date).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{movement.userName}</span>
                        </div>
                        {movement.reference && (
                          <div className="flex items-center space-x-1">
                            <span className="font-mono text-xs bg-gray-200 dark:bg-gray-600 px-1 rounded">
                              {movement.reference}
                            </span>
                          </div>
                        )}
                      </div>

                      {movement.orderId && (
                        <button
                          onClick={() => handleViewOrder(movement.orderId!)}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          title="Voir la commande"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Commande</span>
                        </button>
                      )}

                      {movement.orderDetails && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                          <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                            <p><strong>Commande:</strong> {movement.orderDetails.orderNumber}</p>
                            <p><strong>Client:</strong> {movement.orderDetails.clientName} ({movement.orderDetails.clientType === 'personne_physique' ? 'Particulier' : 'Société'})</p>
                            <p><strong>Total commande:</strong> {Number(movement.orderDetails.orderTotal || 0).toLocaleString()} MAD</p>
                            <p><strong>Date commande:</strong> {new Date(movement.orderDetails.orderDate).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {Number(movement.previousStock ?? 0).toFixed(3)} → {Number(movement.newStock ?? 0).toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">Stock après mouvement</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucun mouvement de stock</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  L'historique apparaîtra après les premiers mouvements
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal commande liée */}
        {viewingOrder && (
          <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Détails de la Commande</h3>
                  <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {(() => {
                  const order = getOrderById(viewingOrder);
                  if (!order) {
                    return <div className="text-center py-8"><p className="text-gray-500 dark:text-gray-400">Commande non trouvée</p></div>;
                  }
                  return (
                    <div className="space-y-4">
                      {/* détails de commande */}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6">
          <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
