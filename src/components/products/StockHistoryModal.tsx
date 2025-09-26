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
    // Pourquoi: garantir le bon signe pour le calcul de stock
    if (type === 'order_out') return -Math.abs(q);
    if (type === 'order_cancel_return') return Math.abs(q);
    return q;
  };

  // Déduplication pour éviter les doublons ré-importés
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

      const cur = map.get(key);
      if (!cur) map.set(key, m);
      else {
        const d1 = new Date(cur.adjustmentDateTime || cur.date).getTime();
        const d2 = new Date(m.adjustmentDateTime || m.date).getTime();
        if (d2 >= d1) map.set(key, m); // garder le plus récent
      }
    }
    return Array.from(map.values());
  };

  /** Historique complet (avec reconstruction de la sortie si manquante) */
  const buildBaseHistory = () => {
    const history: any[] = [];

    // Initial
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

    // Index des "order_out" existants (pour détecter les sorties manquantes après annulation)
    const outKeys = new Set(
      orderMovementsFromSM
        .filter(m => m.type === 'order_out')
        .map(m => `${m.orderId || ''}|${m.productId || ''}|${Math.abs(Number(m.quantity || 0)).toFixed(3)}`)
    );

    // Reconstruction d'une sortie fantôme si on a un retour sans sortie
    const ghosts: any[] = [];
    for (const c of orderMovementsFromSM.filter(m => m.type === 'order_cancel_return')) {
      const k = `${c.orderId || ''}|${c.productId || ''}|${Math.abs(Number(c.quantity || 0)).toFixed(3)}`;
      if (!outKeys.has(k)) {
        const cancelDate = new Date(c.adjustmentDateTime || c.date);
        const outDate = new Date(cancelDate.getTime() - 60 * 1000); // 1 min avant: ordre logique
        const maybeOrder = c.orderId ? getOrderById(String(c.orderId)) : null;

        ghosts.push({
          id: `ghost-out-${c.id}`,
          type: 'order_out',
          date: outDate.toISOString(),
          quantity: -Math.abs(Number(c.quantity || 0)),
          previousStock: 0,
          newStock: 0,
          reason: 'Commande livrée (reconstituée)',
          userName: c.userName || maybeOrder?.createdByName || 'Système',
          reference: c.reference || maybeOrder?.number || '',
          orderId: c.orderId || maybeOrder?.id || null,
          orderDetails: maybeOrder
            ? {
                orderNumber: maybeOrder.number,
                clientName:
                  maybeOrder.clientType === 'personne_physique'
                    ? maybeOrder.clientName
                    : maybeOrder.client?.name,
                clientType: maybeOrder.clientType,
                orderTotal: maybeOrder.totalTTC,
                orderDate: maybeOrder.orderDate
              }
            : null
        });
        outKeys.add(k);
      }
    }

    // Push: order_out / order_cancel_return + éventuels ghosts
    [...orderMovementsFromSM, ...ghosts].forEach(m => {
      history.push({
        id: m.id,
        type: m.type,
        date: m.adjustmentDateTime || m.date,
        quantity: normQty(m.type, Number(m.quantity) || 0),
        previousStock: 0,
        newStock: 0,
        reason: m.type === 'order_out'
          ? (m.reason || 'Commande livrée')
          : (m.reason || 'Commande annulée'),
        userName: m.userName,
        reference: m.reference || '',
        orderId: m.orderId || null,
        orderDetails: m.orderDetails || null
      });
    });

    // Ordes livrés présents dans orders mais absents des mouvements → synthèse
    const smOrderIds = new Set(orderMovementsFromSM.map(m => String(m.orderId || '')));
    orders.forEach(order => {
      if (order.status !== 'livre') return;          // on ne crée pas de sortie si annulée
      if (smOrderIds.has(String(order.id))) return;  // déjà dans les mouvements

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

  // ------- Résumé (source de vérité = dernier newStock) -------
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
            if (h.orderDetails?.clientName) clientText = String(h.orderDetails.clientName);
            else if (h.orderId) {
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
      columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 110 }, 2: { cellWidth: 100 }, 3: { cellWidth: 120 }, 4: { cellWidth: 150 }, 5: { cellWidth: 100 } },
      didParseCell: data => {
        if (data.section === 'body' && data.column.index === 2) {
          const txt = String(data.cell.raw || '');
          if (txt.startsWith('+')) data.cell.styles.textColor = [22, 163, 74];
          else if (txt.startsWith('-')) data.cell.styles.textColor = [220, 38, 38];
       
