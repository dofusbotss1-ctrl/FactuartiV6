// src/components/quotes/QuotesList.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Eye,
  Edit,
  Trash2,
  FileText,
  Crown,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function QuotesList() {
  const { t } = useLanguage();
  const { licenseType } = useLicense();
  const { quotes, deleteQuote, convertQuoteToInvoice, updateQuote } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
  >('all');

  const [viewingQuote, setViewingQuote] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [showProModal, setShowProModal] = useState(false);
  const [blockedTemplateName, setBlockedTemplateName] = useState('');
  const [showUpgradePage, setShowUpgradePage] = useState(false);

  // groupement par année
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const toggleYearExpansion = (year: number) =>
    setExpandedYears((p) => ({ ...p, [year]: !p[year] }));

  // état du modal de conversion
  const [convertModalQuoteId, setConvertModalQuoteId] = useState<string | null>(null);
  const [accessApproved, setAccessApproved] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [alreadyMsg, setAlreadyMsg] = useState<string | null>(null);

  // ✅ Fallback local : on mémorise les devis convertis immédiatement
  const [localConverted, setLocalConverted] = useState<Set<string>>(new Set());

  const isTemplateProOnly = (templateId: string = 'template1') => {
    const proTemplates = ['template2', 'template3', 'template4', 'template5'];
    return proTemplates.includes(templateId);
  };
  const getTemplateName = (templateId: string = 'template1') => {
    const m: Record<string, string> = {
      template1: 'Classic Free',
      template2: 'Noir Classique Pro',
      template3: 'Moderne avec formes vertes Pro',
      template4: 'Bleu Élégant Pro',
      template5: 'Minimal Bleu Pro',
    };
    return m[templateId] || 'Template';
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
      case 'converted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
            Converti
          </span>
        );
      default:
        return null;
    }
  };

  // filtres
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // groupement
  const quotesByYear = filteredQuotes.reduce((acc, q) => {
    const y = new Date(q.date).getFullYear();
    (acc[y] ||= []).push(q);
    return acc;
  }, {} as Record<number, typeof filteredQuotes>);

  const getYearStats = (list: typeof filteredQuotes) => {
    const count = list.length;
    const totalTTC = list.reduce((s, q) => s + (q.totalTTC || 0), 0);
    return { count, totalTTC };
  };

  const sortedYears = Object.keys(quotesByYear)
    .map(Number)
    .sort((a, b) => b - a);

  // ouvrir année courante
  const currentYear = new Date().getFullYear();
  useEffect(() => {
    if (sortedYears.includes(currentYear) && expandedYears[currentYear] !== true) {
      setExpandedYears((p) => ({ ...p, [currentYear]: true }));
    }
  }, [sortedYears, currentYear, expandedYears]);

  // actions simples
  const handleDeleteQuote = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) deleteQuote(id);
  };
  const handleViewQuote = (id: string) => setViewingQuote(id);
  const handleEditQuote = (id: string) => setEditingQuote(id);

  // ---- logique "déjà converti" (inclut fallback local) ----
  const isAlreadyConverted = (q: any) =>
    Boolean(q?.invoiceId) || Boolean(q?.converted) || q?.status === 'converted';

  const handleRequestConvert = (id: string) => {
    const q = quotes.find((x) => x.id === id);
    if (!q) return;
    if (isAlreadyConverted(q) || localConverted.has(id)) {
      setAlreadyMsg('La facture est déjà créée pour ce devis.');
      setTimeout(() => setAlreadyMsg(null), 2500);
      return;
    }
    setAccessApproved(false);
    setConvertModalQuoteId(id);
  };

  const confirmConvert = async () => {
    if (!convertModalQuoteId || !accessApproved) return;
    setIsConverting(true);
    try {
      // 1) créer la facture
      const result = await convertQuoteToInvoice(convertModalQuoteId);

      // 2) récupérer un éventuel id retourné (string ou objet {id})
      let invoiceId: string | undefined;
      if (typeof result === 'string') invoiceId = result;
      else if (result && typeof result === 'object' && 'id' in result) {
        // @ts-ignore
        invoiceId = result.id as string;
      }

      // 3) marquer le devis converti dans la source de vérité (si DataContext permet)
      try {
        await updateQuote(convertModalQuoteId, {
          converted: true,
          status: 'converted',
          ...(invoiceId ? { invoiceId } : {}),
        });
      } catch {
        // ignore si pas supporté
      }

      // 4) fallback immédiat côté UI
      setLocalConverted((prev) => {
        const n = new Set(prev);
        n.add(convertModalQuoteId!);
        return n;
      });

      // 5) animation succès
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setConvertModalQuoteId(null);
      }, 1200);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la création de la facture.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
              <option value="converted">Converti</option>
            </select>
            <button className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white">
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
            </button>
          </div>
        </div>
      </div>

      {/* Blocs par année */}
      <div className="space-y-6">
        {Object.keys(quotesByYear).length ? (
          Object.keys(quotesByYear)
            .map(Number)
            .sort((a, b) => b - a)
            .map((year) => {
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
                            <p className="text-3xl font-bold text-white">
                              {stats.totalTTC.toLocaleString()}
                            </p>
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

                  {/* Tableau année */}
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
                            {yearQuotes.map((quote) => {
                              const already =
                                isAlreadyConverted(quote) || localConverted.has(quote.id);
                              return (
                                <tr
                                  key={quote.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
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
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(quote.status)}
                                  </td>
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

                                      {/* Convertir : MASQUÉ si déjà converti */}
                                      {!already ? (
                                        <button
                                          onClick={() => handleRequestConvert(quote.id)}
                                          className="text-purple-600 hover:text-purple-700 transition-colors"
                                          title="Convertir en facture"
                                        >
                                          <FileText className="w-4 h-4" />
                                        </button>
                                      ) : (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                                          Facturé
                                        </span>
                                      )}

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
                              );
                            })}
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
                💡 <strong>Astuce :</strong> Un devis “Accepté” peut être converti en facture via
                l’icône <FileText className="w-4 h-4 inline" /> dans la colonne Actions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals existants */}
      {viewingQuote && (
        <QuoteViewer
          quote={quotes.find((q) => q.id === viewingQuote)!}
          onClose={() => setViewingQuote(null)}
          onEdit={() => {
            setViewingQuote(null);
            setEditingQuote(viewingQuote);
          }}
          onUpgrade={() => setShowUpgradePage(true)}
        />
      )}

      {editingQuote && (
        <EditQuote
          quote={quotes.find((q) => q.id === editingQuote)!}
          onSave={(updatedData) => {
            updateQuote(editingQuote, updatedData);
            setEditingQuote(null);
          }}
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  Passez à la version Pro
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Débloquez tous les templates premium et fonctionnalités avancées !
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUpgradePage(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
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

      {/* Bandeau info */}
      {quotes.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <p className="text-sm text-purple-800 dark:text-purple-300">
            💡 <strong>Information :</strong> Convertissez un devis en facture via l’icône
            <FileText className="w-4 h-4 inline mx-1" />. Si le devis est déjà converti, le bouton
            est automatiquement masqué.
          </p>
        </div>
      )}

      <QuoteActionsGuide />

      {/* ======= MODAL Convertir en facture (dark mode + fallback) ======= */}
      <AnimatePresence>
        {convertModalQuoteId && (
          <motion.div
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 22, stiffness: 240 }}
            >
              {(() => {
                const q = quotes.find((x) => x.id === convertModalQuoteId)!;
                const items = q.items || [];
                const subtotal =
                  q.subtotal ??
                  items.reduce((s: number, it: any) => s + Number(it.total || 0), 0);
                const totalVat =
                  q.totalVat ??
                  Math.max(
                    0,
                    (q.totalTTC ?? 0) - (q.subtotal ?? items.reduce((s: number, it: any) => s + Number(it.total || 0), 0))
                  );
                const totalTTC = q.totalTTC ?? subtotal + totalVat;
                const already =
                  isAlreadyConverted(q) || localConverted.has(convertModalQuoteId);

                return (
                  <>
                    <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Convertir en facture
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Vérifiez les informations avant de créer la facture.
                        </p>
                      </div>
                      <button
                        onClick={() => setConvertModalQuoteId(null)}
                        className="rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Fermer
                      </button>
                    </div>

                    <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-auto">
                      {/* Client */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Client</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                          {q.client?.name}
                        </p>
                        {q.client?.ice && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ICE : {q.client.ice}
                          </p>
                        )}
                      </div>

                      {/* Lignes */}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Articles
                        </p>
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr className="text-gray-700 dark:text-gray-300">
                                <th className="px-4 py-2 text-left">Produit / Désignation</th>
                                <th className="px-4 py-2 text-center">Quantité</th>
                                <th className="px-4 py-2 text-center">PU HT</th>
                                <th className="px-4 py-2 text-right">Total HT</th>
                              </tr>
                            </thead>
                            <tbody className="text-gray-900 dark:text-gray-100">
                              {items.map((it: any, idx: number) => (
                                <tr
                                  key={idx}
                                  className="border-t border-gray-100 dark:border-gray-800"
                                >
                                  <td className="px-4 py-2">{it.description}</td>
                                  <td className="px-4 py-2 text-center">
                                    {Number(it.quantity).toFixed(3)}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    {Number(it.unitPrice).toFixed(2)} MAD
                                  </td>
                                  <td className="px-4 py-2 text-right font-medium">
                                    {Number(it.total).toFixed(2)} MAD
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Totaux */}
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Montant HT</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {Number(subtotal).toFixed(2)} MAD
                          </p>
                        </div>
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400">TVA</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {Number(totalVat).toFixed(2)} MAD
                          </p>
                        </div>
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total TTC</p>
                          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                            {Number(totalTTC).toFixed(2)} MAD
                          </p>
                        </div>
                      </div>

                      {/* Accès Oui/Non */}
                      <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Accès</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Activez “Oui” pour autoriser la création de la facture.
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setAccessApproved(false)}
                            className={`px-4 py-2 rounded-lg border transition ${
                              !accessApproved
                                ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:border-gray-200'
                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                            }`}
                          >
                            Non
                          </button>
                          <button
                            onClick={() => setAccessApproved(true)}
                            className={`px-4 py-2 rounded-lg border transition ${
                              accessApproved
                                ? 'bg-green-600 text-white border-green-600'
                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                            }`}
                          >
                            Oui
                          </button>
                        </div>
                      </div>

                      {/* Message déjà facturé */}
                      {already && (
                        <div className="rounded-xl p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-sm text-yellow-800 dark:text-yellow-200">
                          Ce devis est déjà converti en facture.
                        </div>
                      )}
                    </div>

                    <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3 relative">
                      <button
                        onClick={() => setConvertModalQuoteId(null)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={isConverting}
                      >
                        Annuler
                      </button>

                      {/* Bouton masqué si already */}
                      {!already && (
                        <motion.button
                          whileHover={{ scale: accessApproved ? 1.02 : 1 }}
                          whileTap={{ scale: accessApproved ? 0.98 : 1 }}
                          onClick={confirmConvert}
                          disabled={!accessApproved || isConverting}
                          className={`px-4 py-2 rounded-lg text-white ${
                            accessApproved
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isConverting ? 'Création…' : 'Créer la facture'}
                        </motion.button>
                      )}

                      {/* Animation succès */}
                      <AnimatePresence>
                        {showSuccess && (
                          <motion.div
                            className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-b-2xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="text-center"
                            >
                              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
                              <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
                                Facture créée avec succès !
                              </p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast : déjà créée */}
      <AnimatePresence>
        {alreadyMsg && (
          <motion.div
            className="fixed bottom-6 right-6 z-[80] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 flex items-center space-x-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-800 dark:text-gray-200">{alreadyMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
