// src/components/suppliers/SupplierDetailView.tsx
import React, { useState } from 'react';
import { useSupplier, Supplier } from '../../contexts/SupplierContext';
import AddPurchaseOrderModal from './AddPurchaseOrderModal';
import EditPurchaseOrderModal from './EditPurchaseOrderModal';
import AddSupplierPaymentModal from './AddSupplierPaymentModal';
import EditSupplierPaymentModal from './EditSupplierPaymentModal';
import {
  Building2, Phone, Mail, MapPin, User, DollarSign, FileText,
  CreditCard, Download, AlertTriangle, CheckCircle, Target,
  ArrowLeft, TrendingUp, TrendingDown, Plus, Edit, Trash2
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable, { CellDef, RowInput, UserOptions } from 'jspdf-autotable';

interface SupplierDetailViewProps {
  supplier: Supplier;
  onBack: () => void;
}

export default function SupplierDetailView({ supplier, onBack }: SupplierDetailViewProps) {
  const {
    purchaseOrders,
    supplierPayments,
    getSupplierStats,
    deletePurchaseOrder,
    deleteSupplierPayment
  } = useSupplier();

  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'balance'>('orders');
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);

  const stats = getSupplierStats(supplier.id);
  const supplierOrders = purchaseOrders.filter(o => o.supplierId === supplier.id);
  const supplierPaymentsData = supplierPayments.filter(p => p.supplierId === supplier.id);

  const tabs = [
    { id: 'orders', label: 'Commandes', icon: FileText },
    { id: 'payments', label: 'Paiements', icon: CreditCard },
    { id: 'balance', label: 'Balance', icon: DollarSign }
  ] as const;

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Payé</span>;
      case 'received': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Reçu</span>;
      case 'sent': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Envoyé</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Brouillon</span>;
    }
  };
  const getPaymentMethodBadge = (method: string) => {
    const badges = {
      virement: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Virement' },
      cheque: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chèque' },
      espece: { bg: 'bg-green-100', text: 'text-green-800', label: 'Espèces' },
      carte: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Carte' }
    } as const;
    const badge = (badges as any)[method] || badges.virement;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>;
  };

  const handleDeleteOrder = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) deletePurchaseOrder(id);
  };
  const handleDeletePayment = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) deleteSupplierPayment(id);
  };

  // ---------------- PDF programmatique stylé ----------------
  const COLORS = {
    blue: [37, 99, 235] as [number, number, number],        // bleu 600
    blueLight: [239, 246, 255] as [number, number, number], // bleu 50
    red: [239, 68, 68] as [number, number, number],         // rouge 500
    redLight: [254, 242, 242] as [number, number, number],  // rouge 50
    green: [34, 197, 94] as [number, number, number],       // vert 500
    greenLight: [240, 253, 244] as [number, number, number],
    grayText: [17, 24, 39] as [number, number, number],
    grayHead: [243, 244, 246] as [number, number, number]
  };

  const fmtMAD = (n: number | undefined | null) =>
    Number(n ?? 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const textOrDash = (v: any) => (v == null || v === '' ? '-' : String(v));

  /** Pourquoi: éviter CORS/taint; si KO on ignore le logo sans planter */
  const fetchAsDataURL = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = () => reject(fr.error);
        fr.readAsDataURL(blob);
      });
    } catch { return null; }
  };

  /** Titre centré, gras, avec espace avant/après pour bien séparer les tableaux */
  const drawCenteredTitle = (doc: jsPDF, text: string, y: number, colorRGB?: [number, number, number]) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    if (colorRGB) doc.setTextColor(...colorRGB); else doc.setTextColor(...COLORS.grayText);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    doc.setTextColor(...COLORS.grayText);
  };

  const exportSupplierReportPDF = async () => {
    const companyName =
      (supplier as any).companyName ||
      (supplier as any).societe ||
      'Nom de la société';

    const supplierName = supplier.name || 'Fournisseur';
    const logoUrl: string | undefined = (supplier as any).logoUrl;
    const logoDataUrl = logoUrl ? await fetchAsDataURL(logoUrl) : null;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const totalPagesExp = '{total_pages_count_string}';
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const m = 12;
    const headerH = 28;
    const footerH = 12;

    /** En-tête: logo à gauche + nom à droite du logo; titre centré */
    const drawHeaderFooter = (pageNumber: number) => {
      let x = m, y = m;
      if (logoDataUrl) {
        try {
          const imgType = logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(logoDataUrl, imgType as any, x, y, 18, 18);
        } catch { /* ignorer */ }
      }
      // Nom société à droite du logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.grayText);
      doc.text(companyName, x + 22, y + 6);

      // Date, discret, sous le nom
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, x + 22, y + 12);

      // Titre centré
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(234, 88, 12);
      doc.text('FICHE DE SUIVI FOURNISSEUR', pageWidth / 2, y + 6, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.grayText);
      doc.text(`« ${supplierName} »`, pageWidth / 2, y + 12, { align: 'center' });

      // Ligne base header
      doc.setDrawColor(234, 88, 12);
      doc.setLineWidth(0.6);
      doc.line(m, y + 16, pageWidth - m, y + 16);

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const pageLabel = `Page ${pageNumber} / ${totalPagesExp}`;
      doc.text(pageLabel, pageWidth - m, pageHeight - 6, { align: 'right' });
    };

    const baseTableOpts: Partial<UserOptions> = {
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, lineColor: [229, 231, 235], textColor: COLORS.grayText },
      headStyles: { fillColor: COLORS.grayHead, textColor: [31, 41, 55], fontStyle: 'bold' },
      margin: { top: m + headerH, bottom: m + footerH, left: m, right: m },
      didDrawPage: (data) => drawHeaderFooter(data.pageNumber)
    };

    // --- 1) Infos fournisseur ---
    drawCenteredTitle(doc, 'Informations Fournisseur', m + headerH + 6);
    autoTable(doc, {
      ...baseTableOpts,
      startY: m + headerH + 10,
      head: [['Champ', 'Valeur']],
      body: [
        ['Nom', textOrDash(supplier.name)],
        ['ICE', textOrDash((supplier as any).ice)],
        ['Contact', textOrDash((supplier as any).contactPerson)],
        ['Téléphone', textOrDash((supplier as any).phone)],
        ['Email', textOrDash((supplier as any).email)],
        ['Adresse', textOrDash((supplier as any).address)],
        ['Délai de paiement (jours)', String((supplier as any).paymentTerms ?? '-')],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 'auto' } }
    });

    let y = (doc as any).lastAutoTable?.finalY ?? (m + headerH + 10);

    // --- 2) Résumé financier (Balance colorée: vert si ≥ 0, rouge sinon) ---
    drawCenteredTitle(doc, 'Résumé Financier', y + 10);
    autoTable(doc, {
      ...baseTableOpts,
      startY: y + 14,
      head: [['Total Commandes', 'Total Paiements', 'Balance']],
      body: [[
        `${fmtMAD(stats.totalPurchases)} MAD`,
        `${fmtMAD(stats.totalPayments)} MAD`,
        `${fmtMAD(stats.balance)} MAD`
      ]],
      didParseCell: (hook) => {
        if (hook.section === 'body' && hook.column.index === 2) {
          const bal = Number(stats.balance ?? 0);
          hook.cell.styles.textColor = bal >= 0 ? COLORS.green : COLORS.red; // Pourquoi: signal clair
          hook.cell.styles.fontStyle = 'bold';
          hook.cell.styles.fillColor = bal >= 0 ? COLORS.greenLight : COLORS.redLight;
          hook.cell.styles.halign = 'center';
        }
      },
      columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'center' } }
    });

    y = (doc as any).lastAutoTable?.finalY ?? (m + headerH + 14);

    // --- 3) Commandes (bleu) ---
    drawCenteredTitle(doc, '📦 Commandes', y + 12, COLORS.blue);
    autoTable(doc, {
      ...baseTableOpts,
      startY: y + 16,
      head: [['N°', 'Date', 'Sous-total HT', 'TVA', 'Total TTC', 'Statut']],
      body: (supplierOrders.length
        ? supplierOrders.map<RowInput>((o) => ([
            textOrDash(o.number),
            new Date(o.date).toLocaleDateString('fr-FR'),
            `${fmtMAD(o.subtotal)} MAD`,
            `${fmtMAD(o.totalVat)} MAD`,
            `${fmtMAD(o.totalTTC)} MAD`,
            textOrDash(o.status)
          ] as CellDef[]))
        : [['-', '-', '-', '-', '-', '-']]
      ),
      headStyles: { ...baseTableOpts.headStyles!, fillColor: COLORS.blue, textColor: [255, 255, 255] },
      styles: { ...baseTableOpts.styles!, textColor: COLORS.grayText },
      alternateRowStyles: { fillColor: COLORS.blueLight },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 24, halign: 'center' },
        2: { cellWidth: 32, halign: 'right' },
        3: { cellWidth: 26, halign: 'right' },
        4: { cellWidth: 32, halign: 'right' },
        5: { cellWidth: 'auto', halign: 'center' }
      }
    });

    y = (doc as any).lastAutoTable?.finalY ?? (m + headerH + 16);

    // --- 4) Paiements (rouge) ---
    drawCenteredTitle(doc, '💳 Paiements', y + 12, COLORS.red);
    autoTable(doc, {
      ...baseTableOpts,
      startY: y + 16,
      head: [['Date', 'Montant', 'Mode', 'Référence', 'Description']],
      body: (supplierPaymentsData.length
        ? supplierPaymentsData.map<RowInput>((p) => ([
            new Date(p.paymentDate).toLocaleDateString('fr-FR'),
            `${fmtMAD(p.amount)} MAD`,
            textOrDash(p.paymentMethod),
            textOrDash(p.reference),
            textOrDash(p.description)
          ] as CellDef[]))
        : [['-', '-', '-', '-', '-']]
      ),
      headStyles: { ...baseTableOpts.headStyles!, fillColor: COLORS.red, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: COLORS.redLight },
      columnStyles: {
        0: { cellWidth: 24, halign: 'center' },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 36, halign: 'center' },
        4: { cellWidth: 'auto' }
      }
    });

    try { (doc as any).putTotalPages(totalPagesExp); } catch {}

    const fileName = `Fournisseur_${supplierName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fiche Fournisseur</h1>
            <p className="text-gray-600 dark:text-gray-300">{supplier.name}</p>
          </div>
        </div>
        <button
          onClick={exportSupplierReportPDF}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Informations générales */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2 transition-colors duration-300">
              <Building2 className="w-5 h-5 text-orange-600" />
              <span>Informations générales</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">{supplier.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">ICE: {(supplier as any).ice}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">{(supplier as any).contactPerson}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Personne de contact</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{(supplier as any).phone}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{(supplier as any).email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{(supplier as any).address}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2 transition-colors duration-300">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Résumé financier</span>
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalPurchases.toLocaleString()}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">MAD Total Commandes</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalPayments.toLocaleString()}</div>
                <div className="text-sm text-green-700 dark:text-green-300">MAD Total Paiements</div>
              </div>
              <div
                className={`border rounded-lg p-4 text-center ${
                  stats.balance >= 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                }`}
              >
                <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.balance.toLocaleString()}
                </div>
                <div className={`text-sm ${stats.balance >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  MAD {stats.balance >= 0 ? 'Positif' : 'Négatif'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
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

      {/* Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Commandes d'Achat</h3>
              <button
                onClick={() => setIsAddOrderModalOpen(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Commande</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">N° Commande</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Articles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sous-total HT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TVA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total TTC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {supplierOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {new Date(order.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{order.items.map(i => i.productName).join(', ')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{order.items.length} article{order.items.length > 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{order.subtotal.toLocaleString()} MAD</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{order.totalVat.toLocaleString()} MAD</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{order.totalTTC.toLocaleString()} MAD</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getOrderStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-3">
                        <button onClick={() => setEditingOrder(order.id)} className="text-amber-600 hover:text-amber-700 transition-colors" title="Modifier">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteOrder(order.id)} className="text-red-600 hover:text-red-700 transition-colors" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {supplierOrders.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune commande pour ce fournisseur</p>
            </div>
          )}
        </div>
      )}

      {/* Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Historique des Paiements</h3>
              <button
                onClick={() => setIsAddPaymentModalOpen(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Paiement</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mode de paiement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {supplierPaymentsData.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {payment.amount.toLocaleString()} MAD
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getPaymentMethodBadge(payment.paymentMethod)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{payment.reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{payment.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-3">
                        <button onClick={() => setEditingPayment(payment.id)} className="text-amber-600 hover:text-amber-700 transition-colors" title="Modifier">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeletePayment(payment.id)} className="text-red-600 hover:text-red-700 transition-colors" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {supplierPaymentsData.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun paiement pour ce fournisseur</p>
            </div>
          )}
        </div>
      )}

      {/* Balance */}
      {activeTab === 'balance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Balance Fournisseur</h3>
              <div
                className={`inline-flex items-center space-x-3 px-8 py-6 rounded-2xl ${
                  stats.balance >= 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700'
                }`}
              >
                {stats.balance >= 0 ? <CheckCircle className="w-12 h-12 text-green-600" /> : <AlertTriangle className="w-12 h-12 text-red-600" />}
                <div>
                  <div className={`text-4xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.balance.toLocaleString()} MAD
                  </div>
                  <div className={`text-lg ${stats.balance >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {stats.balance >= 0 ? 'Balance positive' : 'Balance négative'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Détail */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Détail du Calcul</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Total des commandes</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{(stats as any).ordersCount} commande{(stats as any).ordersCount > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600">+{stats.totalPurchases.toLocaleString()}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">MAD</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Total des paiements</p>
                    <p className="text-sm text-green-700 dark:text-green-300">{supplierPaymentsData.length} paiement{supplierPaymentsData.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">-{stats.totalPayments.toLocaleString()}</p>
                  <p className="text-sm text-green-700 dark:text-green-300">MAD</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddPurchaseOrderModal isOpen={isAddOrderModalOpen} onClose={() => setIsAddOrderModalOpen(false)} />
      {editingOrder && (
        <EditPurchaseOrderModal
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          order={purchaseOrders.find(order => order.id === editingOrder)!}
        />
      )}
      <AddSupplierPaymentModal isOpen={isAddPaymentModalOpen} onClose={() => setIsAddPaymentModalOpen(false)} />
      {editingPayment && (() => {
        const payment = supplierPayments.find(p => p.id === editingPayment);
        return payment ? (
          <EditSupplierPaymentModal isOpen={!!editingPayment} onClose={() => setEditingPayment(null)} payment={payment} />
        ) : null;
      })()}
    </div>
  );
}

/**
 * Dépendances à installer:
 *   npm i jspdf jspdf-autotable
 *   # ou
 *   yarn add jspdf jspdf-autotable
 */
