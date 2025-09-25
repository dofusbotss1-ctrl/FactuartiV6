// File: src/utils/exportSupplierReport.ts
import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

export type UserLike = { company?: { name?: string; logo?: string; logoUrl?: string } };
export type SupplierLike = {
  id?: string;
  name?: string;
  ice?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: number | string;
};
export type OrderLike = {
  number?: string | number;
  date: string | number | Date;
  subtotal?: number;
  totalVat?: number;
  totalTTC?: number;
  status?: string;
};
export type PaymentLike = {
  paymentDate: string | number | Date;
  amount?: number;
  paymentMethod?: string;
  reference?: string;
  description?: string;
};
export type StatsLike = { totalPurchases: number; totalPayments: number; balance: number };

const fmtMAD = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const textOrDash = (v: any) => (v == null || v === '' ? '-' : String(v));

async function loadImageAsDataURL(url: string): Promise<string | null> {
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
  } catch {
    // Pourquoi: CORS/erreur – on n'empêche pas l'export
    return null;
  }
}

export async function exportSupplierReportPDF(args: {
  user?: UserLike;
  supplier: SupplierLike;
  orders: OrderLike[];
  payments: PaymentLike[];
  stats: StatsLike;
}): Promise<void> {
  const { user, supplier, orders, payments, stats } = args;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const totalPagesExp = '{total_pages_count_string}';

  const m = 12;            // marges
  const headerH = 28;      // hauteur entête
  const footerH = 10;      // hauteur pied

  const companyName = user?.company?.name || '';
  const logoUrl = user?.company?.logo || user?.company?.logoUrl || '';
  const logoDataUrl = logoUrl ? await loadImageAsDataURL(logoUrl) : null; // Pourquoi: éviter async dans didDrawPage

  // --- Header/Pied de page (appelé à chaque page)
  const drawHeaderFooter = (pageNumber: number) => {
    const yTop = m;

    // Nom société (gauche)
    if (companyName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(companyName, m, yTop + 5);
    }

    // Logo (droite)
    if (logoDataUrl) {
      try {
        const imgW = 38, imgH = 14;
        const type = logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(logoDataUrl, type as any, pageW - m - imgW, yTop - 2, imgW, imgH, undefined, 'FAST');
      } catch {
        // Pourquoi: image invalide – ignorer sans casser l'export
      }
    }

    // Titre centré
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(234, 88, 12);
    doc.text('FICHE DE SUIVI FOURNISSEUR', pageW / 2, yTop + 4, { align: 'center' });

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(11);
    doc.text(`« ${supplier?.name || 'Fournisseur'} »`, pageW / 2, yTop + 10, { align: 'center' });

    // Séparateur
    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(0.6);
    doc.line(m, yTop + 14, pageW - m, yTop + 14);

    // Pied
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, m, pageH - 5);
    doc.text(`Page ${pageNumber} / ${totalPagesExp}`, pageW - m, pageH - 5, { align: 'right' });
  };

  // --- Titres de section (gras & centrés)
  const sectionTitle = (text: string, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(text, pageW / 2, y, { align: 'center' });
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.line(m, y + 2.5, pageW - m, y + 2.5);
    return y + 7;
  };

  // --- Bandeau KPI balance (vert si >0, sinon rouge)
  const kpiBanner = (y: number, valueText: string, label: string, positive: boolean) => {
    const stroke = positive ? [22, 163, 74] : [220, 38, 38];
    const fill = positive ? [220, 252, 231] : [254, 226, 226];
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(m, y, pageW - 2 * m, 18, 2, 2, 'FD');
    doc.setTextColor(stroke[0], stroke[1], stroke[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(valueText, pageW / 2, y + 7.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(label, pageW / 2, y + 13.5, { align: 'center' });
    return y + 22;
  };

  const commonTable: Partial<UserOptions> = {
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [229, 231, 235], textColor: [17, 24, 39] },
    margin: { top: m + headerH, bottom: m + footerH, left: m, right: m },
    didDrawPage: (d) => drawHeaderFooter(d.pageNumber)
  };

  // -------- Page 1
  let y = m + headerH + 6;

  // Infos fournisseur
  y = sectionTitle('INFORMATIONS FOURNISSEUR', y);
  autoTable(doc, {
    ...commonTable,
    startY: y + 3,
    head: [['Champ', 'Valeur']],
    body: [
      ['Nom', textOrDash(supplier?.name)],
      ['ICE', textOrDash(supplier?.ice)],
      ['Contact', textOrDash(supplier?.contactPerson)],
      ['Téléphone', textOrDash(supplier?.phone)],
      ['Email', textOrDash(supplier?.email)],
      ['Adresse', textOrDash(supplier?.address)],
      ['Délai de paiement (jours)', textOrDash(supplier?.paymentTerms)]
    ],
    headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 'auto' } }
  });
  y = (doc as any).lastAutoTable?.finalY ?? y;

  // Résumé + Balance
  y = sectionTitle('RÉSUMÉ FINANCIER', y + 8);
  y = kpiBanner(
    y + 3,
    `${fmtMAD(stats.balance)} MAD`,
    stats.balance > 0 ? 'Balance positive' : 'Balance négative',
    stats.balance > 0
  );
  autoTable(doc, {
    ...commonTable,
    startY: y,
    head: [['Total Commandes', 'Total Paiements']],
    body: [[`${fmtMAD(stats.totalPurchases)} MAD`, `${fmtMAD(stats.totalPayments)} MAD`]],
    headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55], fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' } }
  });
  y = (doc as any).lastAutoTable?.finalY ?? y;

  // Commandes (bleu)
  y = sectionTitle('COMMANDES', y + 10);
  autoTable(doc, {
    ...commonTable,
    startY: y + 3,
    head: [['N°', 'Date', 'Sous-total HT', 'TVA', 'Total TTC', 'Statut']],
    body:
      (orders?.length ?? 0) > 0
        ? orders.map((o) => [
            textOrDash(o.number),
            new Date(o.date).toLocaleDateString('fr-FR'),
            `${fmtMAD(o.subtotal)} MAD`,
            `${fmtMAD(o.totalVat)} MAD`,
            `${fmtMAD(o.totalTTC)} MAD`,
            textOrDash(o.status)
          ])
        : [['-', '-', '-', '-', '-', '-']],
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' }, // bleu
    alternateRowStyles: { fillColor: [219, 234, 254] }, // bleu clair
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 'auto', halign: 'center' }
    }
  });
  y = (doc as any).lastAutoTable?.finalY ?? y;

  // Paiements (rouge)
  y = sectionTitle('PAIEMENTS', y + 10);
  autoTable(doc, {
    ...commonTable,
    startY: y + 3,
    head: [['Date', 'Montant', 'Mode', 'Référence', 'Description']],
    body:
      (payments?.length ?? 0) > 0
        ? payments.map((p) => [
            new Date(p.paymentDate).toLocaleDateString('fr-FR'),
            `${fmtMAD(p.amount)} MAD`,
            textOrDash(p.paymentMethod),
            textOrDash(p.reference),
            textOrDash(p.description)
          ])
        : [['-', '-', '-', '-', '-']],
    headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: 'bold' }, // rouge
    alternateRowStyles: { fillColor: [254, 226, 226] }, // rouge clair
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 36, halign: 'center' },
      4: { cellWidth: 'auto' }
    }
  });

  // Pagination totale
  try { (doc as any).putTotalPages(totalPagesExp); } catch {}

  const filename = `Fournisseur_${String(supplier?.name || 'Inconnu').replace(/\s+/g, '_')}_${new Date()
    .toLocaleDateString('fr-FR')
    .replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}

// ----------------------------------------------------------------------
// File: src/components/suppliers/ExportButton.tsx  (exemple d’intégration)
// ----------------------------------------------------------------------
import React from 'react';
import { Download } from 'lucide-react';
import {
  exportSupplierReportPDF,
  UserLike, SupplierLike, OrderLike, PaymentLike, StatsLike
} from '../../utils/exportSupplierReport';

export default function ExportButton(props: {
  user?: UserLike;
  supplier: SupplierLike;
  orders: OrderLike[];
  payments: PaymentLike[];
  stats: StatsLike;
  className?: string;
}) {
  const { user, supplier, orders, payments, stats, className } = props;
  return (
    <button
      onClick={() => exportSupplierReportPDF({ user, supplier, orders, payments, stats })}
      className={className ?? 'inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200'}
    >
      <Download className="w-4 h-4" />
      <span>Export PDF</span>
    </button>
  );
}
