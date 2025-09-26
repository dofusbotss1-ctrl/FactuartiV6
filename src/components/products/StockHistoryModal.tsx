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

/** Pourquoi: assurer des valeurs numériques sûres partout. */
const toNum = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

type MovementType = 'initial' | 'order_out' | 'order_cancel_return' | 'adjustment';

type StockRow = {
  id: string;
  type: MovementType;
  date: string | number | Date;
  quantity: number;           // normalisée (+/-)
  previousStock: number;      // calculé
  newStock: number;           // calculé
  reason?: string;
  userName?: string;
  reference?: string;
  orderId?: string | null;
  orderDetails?: any | null;
};

export default function StockHistoryModal({ isOpen, onClose, product }: StockHistoryModalProps) {
  const { stockMovements } = useData();
  const { orders, getOrderById } = useOrder();
  const { user } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month' | 'quarter'>('all');
  const [filterType, setFilterType] = useState<'all' | 'orders' | 'adjustments' | 'initial'>('all');

  // ✅ filtres dates
  const [startDate, setStartDate] = useState<string>(''); // yyyy-mm-dd
  const [endDate, setEndDate] = useState<string>('');     // yyyy-mm-dd

  const [viewingOrder, setViewingOrder] = useState<string | null>(null);

  // ------- Historique complet du produit (ENRICHI: previous/new stock calculés) -------
  const generateProductHistory = (): StockRow[] => {
    const rows: StockRow[] = [];

    // Initial (virtuel si > 0)
    if (toNum(product.initialStock) !== 0) {
      rows.push({
        id: `initial-${product.id}`,
        type: 'initial',
        date: product.createdAt || new Date(0).toISOString(),
        quantity: toNum(product.initialStock), // +initial
        previousStock: 0,
        newStock: toNum(product.initialStock),
        reason: 'Stock initial',
        userName: 'Système',
        reference: '',
        orderId: null,
        orderDetails: null
      });
    }

    // Adjustments
    stockMovements
      .filter(m => m.productId === product.id && m.type === 'adjustment')
      .forEach(m => {
        rows.push({
          id: m.id,
          type: 'adjustment',
          date: m.adjustmentDateTime || m.date,
          quantity: toNum(m.quantity), // peut être +/- (on respecte)
          previousStock: toNum(m.previousStock, NaN),
          newStock: toNum(m.newStock, NaN),
          reason: m.reason || 'Rectification',
          userName: m.userName,
          reference: m.reference || '',
          orderId: m.orderId || null,
          orderDetails: m.orderDetails || null
        });
      });

    // Commandes: sorties & retours d’annulation
    stockMovements
      .filter(m => m.productId === product.id && (m.type === 'order_out' || m.type === 'order_cancel_return'))
      .forEach(m => {
        const rawQ = toNum(m.quantity);
        // Normalisation du signe: sortie négative, retour positif.
        const qty =
          m.type === 'order_out'
            ? -Math.abs(rawQ)
            : Math.abs(rawQ);

        rows.push({
          id: m.id,
          type: m.type,
          date: m.adjustmentDateTime || m.date,
          quantity: qty,
          previousStock: toNum(m.previousStock, NaN),
          newStock: toNum(m.newStock, NaN),
          reason: m.type === 'order_out' ? 'Commande livrée' : 'Commande annulée',
          userName: m.userName,
          reference: m.reference || '',
          orderId: m.orderId || null,
          orderDetails: m.orderDetails || null
        });
      });

    // 1) tri ascendant pour calcul du running stock
    const asc = rows.sort((a, b) => new Date(a.date as any).getTime() - new Date(b.date as any).getTime());

    // 2) running stock robuste (ignore les previous/new stock manquants/erronés)
    let running = 0;
    // Si la première ligne est "initial" on démarre à 0 puis + initial, sinon on démarre à 0.
    asc.forEach((r, idx) => {
      // Toujours recalculer pour cohérence.
      const prev = idx === 0 ? 0 : running;
      const next = prev + toNum(r.quantity);
      r.previousStock = prev;
      r.newStock = next;
      running = next;
    });

    // 3) tri descendant pour le rendu
    return [...asc].sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime());
  };

  const history: StockRow[] = generateProductHistory();

  // ------- Résumé -------
  const calculateCurrentStock = () => {
    // Pourquoi: se baser sur l’historique réel (fiable pour “Stock après mouvement”).
    if (history.length === 0) return toNum(product.initialStock);
    return toNum(history[0].newStock); // histoire triée desc -> [0] = dernier mouvement
  };

  const summary = {
    initialStock: toNum(product.initialStock),
    totalOrdersSold: orders.reduce((sum, order) => {
      if (order.status === 'livre') {
        return (
          sum +
          order.items
            .filter(i => i.productName === product.name)
            .reduce((x, i) => x + toNum(i.quantity), 0)
        );
      }
      return sum;
    }, 0),
    totalAdjustments: stockMovements
      .filter(m => m.productId === product.id && m.type === 'adjustment')
      .reduce((s, m) => s + toNum(m.quantity), 0),
    currentStock: calculateCurrentStock()
  };

  // ------- Filtres -------
  const inPeriod = (dateStr: string | number | Date) => {
    if (selectedPeriod === 'all') return true;
    const d = new Date(dateStr).getTime();
    const now = Date.now();
    if (selectedPeriod === 'week') return d >= now - 7 * 24 * 60 * 60 * 1000;
    if (selectedPeriod === 'month') return d >= now - 30 * 24 * 60 * 60 * 1000;
    if (selectedPeriod === 'quarter') return d >= now - 90 * 24 * 60 * 60 * 1000;
    return true;
  };

  const inRange = (dateStr: string | number | Date) => {
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

  const typeOK = (t: MovementType) => {
    if (filterType === 'all') return true;
    if (filterType === 'orders') return t === 'order_out' || t === 'order_cancel_return';
    if (filterType === 'adjustments') return t === 'adjustment';
    if (filterType === 'initial') return t === 'initial';
    return true;
  };

  const filteredHistory = history.filter(m => inPeriod(m.date) && inRange(m.date) && typeOK(m.type));

  // ------- Helpers UI -------
  const getMovementIcon = (type: MovementType) => {
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
  const getMovementLabel = (type: MovementType) => {
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

  // ------- helpers image logo -> dataURL -------
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

  // ------- Export PDF -------
  const exportStockPDF = async () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape', compress: true });
    const pageWidth = doc.internal.pageSize.getWidth();
    const lrMargin = 40;
    const usableWidth = pageWidth - lrMargin * 2;
    let y = 36;

    // En-tête gauche : société
    const companyName = user?.company?.name || '';
    const logoUrl = (user?.company as any)?.logo || (user?.company as any)?.logoUrl || '';
    if (companyName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(companyName, lrMargin, y);
    }

    // En-tête droite : logo (optionnel)
    if (logoUrl) {
      const dataUrl = await loadImageAsDataURL(logoUrl);
      if (dataUrl) {
        const imgW = 90;
        const imgH = 30;
        // Pourquoi: éviter un placement accidentel trop bas.
        doc.addImage(dataUrl, 'PNG', pageWidth - lrMargin - imgW, y - 20, imgW, imgH, undefined, 'FAST');
      }
    }

    // Titre centré
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text('Historique du Stock', pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Sous-titre
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

    // Cartes résumé
    const gap = 30;
    const cardW = (usableWidth - gap * 3) / 4;
    const cardH = 64;
    const startX = lrMargin;
    const cards = [
      { label: 'Stock initial', value: summary.initialStock.toFixed(3), color: [37, 99, 235] as const },
      { label: 'Total commandé', value: summary.totalOrdersSold.toFixed(3), color: [220, 38, 38] as const },
      {
        label: 'Rectifications',
        value: `${summary.totalAdjustments > 0 ? '+' : ''}${summary.totalAdjustments.toFixed(3)}`,
        color: [124, 58, 237] as const
      },
      { label: 'Stock actuel', value: summary.currentStock.toFixed(3), color: [22, 163, 74] as const }
    ];

    cards.forEach((c, i) => {
      const x = startX + i * (cardW + gap);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.roundedRect(x, y, cardW, cardH, 10, 10);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(c.label, x + 12, y + 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.value, x + 12, y + 42);
      doc.setFont('helvetica', 'normal');
    });

    y += cardH + 20;

    // Titre section
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Mouvements', lrMargin, y);
    y += 8;

    // Corps du tableau (utilise l'historique enrichi)
    const body: RowInput[] =
      filteredHistory.length === 0
        ? [['—', '—', '—', '—', '—', '—']]
        : filteredHistory.map(h => {
            const d = new Date(h.date as any);
            const dateTime = `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}`;
            const qty = toNum(h.quantity);
            const qtyText = `${qty > 0 ? '+' : ''}${qty.toFixed(3)} ${product.unit}`;
            const stockText = `${toNum(h.previousStock).toFixed(3)} → ${toNum(h.newStock).toFixed(3)}`;
            return [
              dateTime,
              getMovementLabel(h.type),
              qtyText,
              stockText,
              h.reason || '',
              h.reference || ''
            ];
          });

    autoTable(doc, {
      startY: y + 10,
      head: [[ 'Date & Heure', 'Type', 'Quantité', 'Stock', 'Motif', 'Réf.' ]],
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
        {/* En-tête & résumé */}
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
            <button
              onClick={exportStockPDF}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
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

            {/* Du */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Du</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Au */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Au</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Export PDF */}
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

        {/* Liste mouvements (UI) */}
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((movement: StockRow) => (
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
                        <span className={`font-bold ${getMovementColor(toNum(movement.quantity))}`}>
                          {toNum(movement.quantity) > 0 ? '+' : ''}
                          {toNum(movement.quantity).toFixed(3)} {product.unit}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(movement.date as any).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(movement.date as any).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{movement.userName}</span>
                        </div>
                        {movement.reason && (
                          <div className="flex items-center space-x-1">
                            <FileText className="w-3 h-3" />
                            <span>{movement.reason}</span>
                          </div>
                        )}
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
                      {toNum(movement.previousStock).toFixed(3)} → {toNum(movement.newStock).toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-400
