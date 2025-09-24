import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLicense } from '../../contexts/LicenseContext';
import QuoteViewer from './QuoteViewer';
import EditQuote from './EditQuote';
import ProTemplateModal from '../license/ProTemplateModal';
import QuoteActionsGuide from './QuoteActionsGuide';

import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  Crown,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function QuotesList() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { licenseType } = useLicense();
  const { quotes, deleteQuote, convertQuoteToInvoice, updateQuote } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'>('all');

  const [viewingQuote, setViewingQuote] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [showProModal, setShowProModal] = useState(false);
  const [blockedTemplateName, setBlockedTemplateName] = useState('');
  const [showUpgradePage, setShowUpgradePage] = useState(false);

  // ⬇️ Gestion ouverture/fermeture des blocs par année (comme Factures)
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const toggleYearExpansion = (year: number) =>
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));

  const isTemplateProOnly = (templateId: string = 'template1') => {
    const proTemplates = ['template2', 'template3', 'template4', 'template5'];
    return proTemplates.includes(templateId);
  };

  const getTemplateName = (templateId: string = 'template1') => {
    const templates: Record<string, string> = {
      template1: 'Classic Free',
      template2: 'Noir Classique Pro',
      template3: 'Moderne avec formes vertes Pro',
      template4: 'Bleu Élégant Pro',
      template5: 'Minimal Bleu Pro',
    };
    return templates[templateId] || 'Template';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Accepté
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Envoyé
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Brouillon
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Refusé
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Expiré
          </span>
        );
      default:
        return null;
    }
  };

  // Filtre recherche/statut
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Grouper par année (comme Factures)
  const quotesByYear = filteredQuotes.reduce((acc, quote) => {
    const year = new Date(quote.date).getFullYear();
    (acc[year] ||= []).push(quote);
    return acc;
  }, {} as Record<number, typeof filteredQuotes>);

  // Stats par année
  const getYearStats = (yearQuotes: typeof filteredQuotes) => {
    const count = yearQuotes.length;
    const totalTTC = yearQuotes.reduce((sum, q) => sum + (q.totalTTC || 0), 0);
    return { count, totalTTC };
  };

  // Tri desc des années
  const sortedYears = Object.keys(quotesByYear)
    .map(Number)
    .sort((a, b) => b - a);

  // Ouvrir année courante par défaut
  const currentYear = new Date().getFullYear();
  useEffect(() => {
    if (sortedYears.includes(currentYear) && expandedYears[currentYear] !== true) {
      setExpandedYears((prev) => ({ ...prev, [currentYear]: true }));
    }
  }, [sortedYears, currentYear, expandedYears]);

  const handleDeleteQuote = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) deleteQuote(id);
  };
  const handleViewQuote = (id: string) => setViewingQuote(id);
  const handleEditQuote = (id: string) => setEditingQuote(id);

  const handleConvertToInvoice = (id: string) => {
    if (window.confirm('Voulez-vous convertir ce devis en facture ?')) {
      convertQuoteToInvoice(id);
      alert('Devis converti en facture avec succès !');
    }
  };

  const handleDownloadQuote = (id: string) => {
    const quote = quotes.find((q) => q.id === id);
    if (!quote) return;
    if (isTemplateProOnly('template1') && licenseType !== 'pro') {
      setBlockedTemplateName(getTemplateName('template1'));
      setShowProModal(true);
      return;
    }
    downloadQuotePDF(quote, 'template1');
  };

  // ====== Génération PDF ======
  const downloadQuotePDF = (quote: any, templateId: string = 'template1') => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.minHeight = '297mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.zIndex = '-1';
    tempDiv.style.opacity = '0';
    tempDiv.innerHTML = generateSimpleQuoteHTML(quote, false);
    document.body.appendChild(tempDiv);

    const options = {
      margin: [5, 5, 5, 5],
      filename: `Devis_${quote.number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: false,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800,
        height: 1200,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    html2pdf()
      .set(options)
      .from(tempDiv)
      .save()
      .then(() => document.body.removeChild(tempDiv))
      .catch((error) => {
        console.error('Erreur lors de la génération du PDF:', error);
        if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
        alert('Erreur lors de la génération du PDF');
      });
  };

  const generateTemplateHTMLWithTemplate = (quote: any, templateId: string) => {
    let templateContent = '';
    switch (templateId) {
      case 'template1':
        templateContent = generateTemplate1HTML(quote);
        break;
      case 'template2':
      case 'template3':
      case 'template4':
      case 'template5':
        templateContent = generateTemplate1HTML(quote);
        break;
      default:
        templateContent = generateTemplate1HTML(quote);
    }
    const baseStyles = `
      <style>
        @page { size: A4; margin: 15mm; }
        @media print {
          body { margin:0; -webkit-print-color-adjust: exact; color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 0; font-size: 14px; background: white; max-width: 800px; margin: 0 auto; }
      </style>
    `;
    return `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Devis ${quote.number}</title>${baseStyles}</head><body>${templateContent}</body></html>`;
  };

  const generateTemplate1HTML = (quote: any) => {
    return `
      <div style="padding:20px;font-family:Arial,sans-serif;background:white;">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #d1d5db;">
          <div>
            <h2 style="margin:0 0 8px 0;font-size:20px;color:#1f2937;font-weight:bold;">${quote.client.name || 'Entreprise'}</h2>
            <p style="margin:2px 0;font-size:12px;">${quote.client.address || ''}</p>
            <p style="margin:2px 0;font-size:12px;">${quote.client.phone || ''}</p>
            <div style="margin-top:8px;font-size:11px;color:#6b7280;"><p style="margin:1px 0;">ICE: ${quote.client.ice || ''}</p></div>
          </div>
          <div style="text-align:right;">
            <h1 style="margin:0 0 8px 0;font-size:28px;color:#7c3aed;font-weight:bold;">DEVIS</h1>
            <p style="margin:2px 0;font-size:12px;"><strong>N°:</strong> ${quote.number}</p>
            <p style="margin:2px 0;font-size:12px;"><strong>Date:</strong> ${new Date(quote.date).toLocaleDateString('fr-FR')}</p>
            <p style="margin:2px 0;font-size:12px;"><strong>Valide jusqu'au:</strong> ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:12px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:12px;text-align:left;border:1px solid #e5e7eb;font-weight:bold;">DÉSIGNATION</th>
              <th style="padding:12px;text-align:center;border:1px solid #e5e7eb;font-weight:bold;">QUANTITÉ</th>
              <th style="padding:12px;text-align:center;border:1px solid #e5e7eb;font-weight:bold;">P.U. HT</th>
              <th style="padding:12px;text-align:center;border:1px solid #e5e7eb;font-weight:bold;">TOTAL HT</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items
              .map(
                (item: any) => `
              <tr>
                <td style="padding:12px;border:1px solid #e5e7eb;text-align:center;">${item.description}</td>
                <td style="padding:12px;text-align:center;border:1px solid #e5e7eb;">${Number(item.quantity).toFixed(3)}</td>
                <td style="padding:12px;text-align:center;border:1px solid #e5e7eb;">${Number(item.unitPrice).toFixed(2)} MAD</td>
                <td style="padding:12px;text-align:center;border:1px solid #e5e7eb;font-weight:500;">${Number(item.total).toFixed(2)} MAD</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div style="display:flex;justify-content:space-between;margin:20px 0;">
          <div style="width:45%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:15px;">
            <p style="font-size:14px;font-weight:bold;text-align:center;margin-bottom:10px;">Arrêtée le présent devis à la somme de :</p>
            <p style="font-size:14px;margin:0;">• ${quote.totalInWords}</p>
          </div>
          <div style="width:45%;background:#f9fafb;padding:15px;border-radius:8px;border:1px solid #e5e7eb;">
            <div style="display:flex;justify-content:space-between;margin:4px 0;font-size:14px;"><span>Sous-total HT:</span><span><strong>${Number(quote.subtotal).toFixed(2)} MAD</strong></span></div>
            <div style="display:flex;justify-content:space-between;margin:4px 0;font-size:14px;"><span>TVA:</span><span><strong>${Number(quote.totalVat).toFixed(2)} MAD</strong></span></div>
            <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:16px;color:#7c3aed;border-top:1px solid #d1d5db;padding-top:8px;margin-top:8px;"><span>Total TTC:</span><span>${Number(quote.totalTTC).toFixed(2)} MAD</span></div>
          </div>
        </div>
        <div style="margin-top:30px;text-align:center;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:15px;font-size:10px;">
          <p><strong>Conditions:</strong> Ce devis est valable jusqu'au ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}</p>
          <p style="margin-top:8px;">Merci de votre confiance !</p>
        </div>
      </div>
    `;
  };

  const generateSimpleQuoteHTML = (quote: any, includeSignature: boolean = false) => {
    return `
      <div style="padding:20px;font-family:Arial,sans-serif;background:white;width:100%;min-height:297mm;">
        <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #7c3aed;padding-bottom:20px;">
          <h1 style="font-size:32px;color:#7c3aed;margin:0;font-weight:bold;">DEVIS</h1>
          <h2 style="font-size:24px;color:#1f2937;margin:10px 0;font-weight:bold;">${user?.company?.name || ''}</h2>
          <p style="font-size:14px;color:#6b7280;margin:5px 0;">${user?.company?.address || ''}</p>
          <p style="font-size:14px;color:#6b7280;margin:5px 0;">Tél: ${user?.company?.phone || ''} | Email: ${user?.company?.email || ''}</p>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:30px;">
          <div style="width:48%;">
            <h3 style="font-size:16px;font-weight:bold;color:#1f2937;margin-bottom:10px;border-bottom:1px solid #d1d5db;padding-bottom:5px;">CLIENT:</h3>
            <p style="margin:5px 0;font-size:14px;font-weight:bold;">${quote.client.name}</p>
            <p style="margin:5px 0;font-size:12px;">${quote.client.address || ''}</p>
            <p style="margin:5px 0;font-size:12px;">ICE: ${quote.client.ice}</p>
            <p style="margin:5px 0;font-size:12px;">Tél: ${quote.client.phone || ''}</p>
            <p style="margin:5px 0;font-size:12px;">Email: ${quote.client.email || ''}</p>
          </div>
          <div style="width:48%;text-align:right;">
            <p style="margin:5px 0;font-size:14px;"><strong>Devis N°:</strong> ${quote.number}</p>
            <p style="margin:5px 0;font-size:14px;"><strong>Date:</strong> ${new Date(quote.date).toLocaleDateString('fr-FR')}</p>
            <p style="margin:5px 0;font-size:14px;"><strong>Valide jusqu'au:</strong> ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:12px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:12px;text-align:left;border:1px solid #e2e8f0;font-weight:bold;">DESCRIPTION</th>
              <th style="padding:12px;text-align:center;border:1px solid #e2e8f0;font-weight:bold;">QTÉ</th>
              <th style="padding:12px;text-align:center;border:1px solid #e2e8f0;font-weight:bold;">PRIX UNIT.</th>
              <th style="padding:12px;text-align:center;border:1px solid #e2e8f0;font-weight:bold;">TOTAL HT</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items
              .map(
                (item: any) => `
              <tr>
                <td style="padding:10px;border:1px solid #e2e8f0;">${item.description}</td>
                <td style="padding:10px;text-align:center;border:1px solid #e2e8f0;">${item.quantity}</td>
                <td style="padding:10px;text-align:center;border:1px solid #e2e8f0;">${Number(item.unitPrice).toFixed(2)} MAD</td>
                <td style="padding:10px;text-align:center;border:1px solid #e2e8f0;font-weight:bold;">${Number(item.total).toFixed(2)} MAD</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div style="margin-top:30px;">
          <div style="float:right;width:300px;background:#f8fafc;padding:20px;border:1px solid #e2e8f0;border-radius:8px;">
            <div style="display:flex;justify-content:space-between;margin:8px 0;font-size:14px;"><span>Sous-total HT:</span><span><strong>${Number(quote.subtotal).toFixed(2)} MAD</strong></span></div>
            <div style="display:flex;justify-content:space-between;margin:8px 0;font-size:14px;"><span>TVA:</span><span><strong>${Number(quote.totalVat).toFixed(2)} MAD</strong></span></div>
            <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:16px;color:#7c3aed;border-top:2px solid #7c3aed;padding-top:10px;margin-top:10px;"><span>Total TTC:</span><span>${Number(quote.totalTTC).toFixed(2)} MAD</span></div>
          </div>
          <div style="clear:both;"></div>
        </div>
        <div style="margin-top:30px;background:#f0f9ff;padding:15px;border-radius:8px;border:1px solid #0ea5e9;">
          <p style="margin:0;font-size:14px;font-weight:bold;color:#0c4a6e;">Arrêtée le présent devis à la somme de: ${quote.totalInWords}</p>
        </div>
        <div style="margin-top:20px;background:#fef3c7;padding:15px;border-radius:8px;border:1px solid #f59e0b;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="flex:1;"><p style="margin:0;font-size:12px;color:#92400e;"><strong>Conditions:</strong> Ce devis est valable jusqu'au ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}. Prix fermes et non révisables. Règlement à 30 jours.</p></div>
            ${
              includeSignature && user?.company?.signature
                ? `<div style="width:120px;height:80px;border:1px solid #f59e0b;border-radius:4px;display:flex;align-items:center;justify-content:center;background:white;"><img src="${user.company.signature}" alt="Signature" style="max-height:70px;max-width:110px;object-fit:contain;" /></div>`
                : ``
            }
          </div>
        </div>
        <div style="margin-top:40px;padding-top:20px;border-top:1px solid #d1d5db;text-align:center;font-size:11px;color:#6b7280;">
          <p style="margin:0;"><strong>${user?.company?.name || ''}</strong> | ${user?.company?.address || ''} | Tél: ${user?.company?.phone || ''} | Email: ${user?.company?.email || ''} | ICE: ${user?.company?.ice || ''} | IF: ${user?.company?.if || ''} | RC: ${user?.company?.rc || ''} | Patente: ${user?.company?.patente || ''}</p>
        </div>
      </div>
    `;
  };

  const handleSaveEdit = (id: string, updatedData: any) => {
    updateQuote(id, updatedData);
    setEditingQuote(null);
  };

  return (
    <div className="space-y-6">
      {/* Header + bouton créer */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devis</h1>
        <Link
          to="/quotes/create"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Devis</span>
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Rechercher par client ou numéro..."
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyé</option>
              <option value="accepted">Accepté</option>
              <option value="rejected">Refusé</option>
              <option value="expired">Expiré</option>
            </select>

            <button className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white">
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
            </button>
          </div>
        </div>
      </div>

      {/* Blocs par année (comme Factures) */}
      <div className="space-y-6">
        {sortedYears.length > 0 ? (
          sortedYears.map((year) => {
            const yearQuotes = quotesByYear[year];
            const stats = getYearStats(yearQuotes);

            return (
              <div key={year} className="space-y-4">
                {/* Header année */}
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                  onClick={() => toggleYearExpansion(year)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Devis - {year}</h2>
                        <p className="text-sm opacity-90">Résumé de l'année {year}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="grid grid-cols-2 gap-6 text-center">
                        <div>
                          <p className="text-3xl font-bold text-white">{stats.count}</p>
                          <p className="text-sm opacity-90 text-white">Devis</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-white">{stats.totalTTC.toLocaleString()}</p>
                          <p className="text-sm opacity-90 text-white">MAD Total TTC</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        {expandedYears[year] ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tableau de l'année */}
                {expandedYears[year] && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Devis
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Client
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date émission
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Valide jusqu'au
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Montant TTC
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {yearQuotes.map((quote) => (
                            <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {quote.number}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {quote.client.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    ICE: {quote.client.ice}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(quote.date).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {Number(quote.totalTTC).toLocaleString()} MAD
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(quote.status)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => handleViewQuote(quote.id)}
                                    className="text-blue-600 hover:text-blue-700 transition-colors"
                                    title="Voir"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditQuote(quote.id)}
                                    className="text-amber-600 hover:text-amber-700 transition-colors"
                                    title="Modifier"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadQuote(quote.id)}
                                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    title="Télécharger"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleConvertToInvoice(quote.id)}
                                    className="text-purple-600 hover:text-purple-700 transition-colors"
                                    title="Convertir en facture"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuote(quote.id)}
                                    className="text-red-600 hover:text-red-700 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Aucun devis trouvé</p>
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-purple-800 dark:text-purple-300">
                💡 <strong>Astuce :</strong> vous pouvez convertir un devis accepté en facture via l’icône{' '}
                <span className="inline-flex align-middle"><FileText className="w-4 h-4 inline ml-1" /></span> dans la colonne Actions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewingQuote && (
        <QuoteViewer
          quote={quotes.find((q) => q.id === viewingQuote)!}
          onClose={() => setViewingQuote(null)}
          onEdit={() => {
            setViewingQuote(null);
            setEditingQuote(viewingQuote);
          }}
          onDownload={() => handleDownloadQuote(viewingQuote)}
          onUpgrade={() => setShowUpgradePage(true)}
        />
      )}

      {editingQuote && (
        <EditQuote
          quote={quotes.find((q) => q.id === editingQuote)!}
          onSave={(updatedData) => handleSaveEdit(editingQuote, updatedData)}
          onCancel={() => setEditingQuote(null)}
        />
      )}

      {showProModal && (
        <ProTemplateModal
          isOpen={showProModal}
          onClose={() => setShowProModal(false)}
          templateName={blockedTemplateName}
        />
      )}

      {showUpgradePage && (
        <div className="fixed inset-0 z-[60] bg-gray-500 bg-opacity-75">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4">Passez à la version Pro</h3>
                <p className="text-gray-600 mb-6">
                  Débloquez tous les templates premium et fonctionnalités avancées !
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUpgradePage(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg">
                    Acheter Pro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bandeau d'info */}
      {quotes.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <p className="text-sm text-purple-800 dark:text-purple-300">
            💡 <strong>Information :</strong> Mettez à jour le statut d’un devis (Envoyé, Accepté, …) depuis la page du
            devis. Un devis “Accepté” peut être converti en facture via l’icône <FileText className="w-4 h-4 inline" />.
          </p>
        </div>
      )}

      <QuoteActionsGuide />
    </div>
  );
}

