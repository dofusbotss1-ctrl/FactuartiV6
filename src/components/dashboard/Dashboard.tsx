// src/components/dashboard/Dashboard.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, LifeBuoy, MessageCircle, Send, X } from 'lucide-react';
import StatsCards from './StatsCards';
import RecentInvoices from './RecentInvoices';
import TopProducts from './TopProducts';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';

export default function Dashboard() {
  const { user, checkSubscriptionExpiry } = useAuth();
  const { t } = useLanguage();
  const { invoices, clients, products } = useData();

  React.useEffect(() => { if (user) checkSubscriptionExpiry(); }, [user, checkSubscriptionExpiry]);

  const hasAnyData = invoices.length > 0 || clients.length > 0 || products.length > 0;

  // Support widget state (pourquoi: UX rapide vers support)
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [supportName, setSupportName] = React.useState<string>(user?.name || '');
  const [supportMsg, setSupportMsg] = React.useState<string>('');
  const [supportError, setSupportError] = React.useState<string | null>(null);

  React.useEffect(() => { setSupportName(user?.name || ''); }, [user]);

  const handleSupportSend = () => {
    if (!supportMsg.trim()) { setSupportError('Veuillez saisir votre message.'); return; }
    const phone = '212666736446'; // 06… -> +212… (sans le 0)
    const text = encodeURIComponent([
      '👋 Support Facturati',
      `Nom: ${supportName || '—'}`,
      `Email: ${user?.email || '—'}`,
      `Société: ${user?.company?.name || '—'}`,
      '---',
      supportMsg.trim(),
      '',
      `Envoyé depuis le Dashboard (${new Date().toLocaleString('fr-FR')})`,
    ].join('\n'));
    const url = `https://wa.me/${phone}?text=${text}`;
    window.open(url, '_blank');
    setSupportOpen(false);
    setSupportMsg('');
    setSupportError(null);
  };

  const getWelcomeMessage = () => {
    if (user?.email === 'admin@facturati.ma') return `Bienvenue Administrateur Facturati ! Vous gérez la plateforme.`;
    if (user?.isAdmin) return `Bienvenue ${user.name} ! Vous êtes connecté en tant qu'administrateur.`;
    const permissionCount = user?.permissions ? Object.values(user.permissions).filter(Boolean).length : 0;
    return `Bienvenue ${user?.name} ! Vous avez accès à ${permissionCount} section${permissionCount > 1 ? 's' : ''} de l'entreprise ${user?.company?.name}.`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard')}
        </motion.h1>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-sm text-gray-500 dark:text-gray-400">
          Dernière mise à jour: {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </motion.div>
      </div>

      {/* Message de bienvenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className={`rounded-xl border p-4 ${
          user?.isAdmin
            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700'
            : 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700'
        }`}
      >
        <p className={`text-sm font-medium ${user?.isAdmin ? 'text-indigo-800' : 'text-blue-800'} dark:text-white transition-colors duration-300`}>
          {getWelcomeMessage()}
        </p>
      </motion.div>

      <StatsCards />

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <QuickActions />
      </motion.div>

      {!hasAnyData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl border border-teal-200 dark:border-teal-700 p-8 text-center"
        >
          <div className="max-w-md mx-auto">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <span className="text-2xl">🚀</span>
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Bienvenue sur Facture.ma !</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Commencez par ajouter vos premiers clients et produits pour voir vos données apparaître ici.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl">
                Ajouter un client
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl">
                Ajouter un produit
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
      </motion.div>

      <TopProducts />
      <RecentInvoices />

      {/* === Bouton Support flottant + Formulaire === */}
      {/* Bouton flottant */}
      <motion.button
        aria-label="Ouvrir le support"
        onClick={() => setSupportOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 rounded-full p-4 sm:p-5 shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-300 dark:focus:ring-pink-700
                   bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-600 text-white"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 0, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative">
          <LifeBuoy className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow" />
          {/* Pulse ring (pourquoi: attirer l'oeil) */}
          <span className="absolute -inset-3 rounded-full bg-pink-500/20 blur-lg -z-10" />
        </div>
      </motion.button>

      {/* Carte formulaire */}
      <AnimatePresence>
        {supportOpen && (
          <motion.div
            key="support-card"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-md"
          >
            <div className="rounded-2xl shadow-2xl border border-pink-200/70 dark:border-pink-800/50 overflow-hidden
                            bg-white dark:bg-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3
                              bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 text-white">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <h3 className="font-semibold">Besoin d’aide ?</h3>
                </div>
                <button aria-label="Fermer le support" onClick={() => setSupportOpen(false)} className="p-1.5 rounded-md hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="support-name" className="block text-xs font-medium text-gray-700 dark:text-gray-200">Votre nom</label>
                    <input
                      id="support-name"
                      type="text"
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      placeholder="Ex: Fatima El Alami"
                      className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                                 text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="support-message" className="block text-xs font-medium text-gray-700 dark:text-gray-200">Message</label>
                    <textarea
                      id="support-message"
                      rows={4}
                      value={supportMsg}
                      onChange={(e) => { setSupportMsg(e.target.value); if (supportError) setSupportError(null); }}
                      placeholder="Expliquez votre besoin…"
                      className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                                 text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-y"
                    />
                    {supportError && <p className="mt-1 text-xs text-pink-600 dark:text-pink-300">{supportError}</p>}
                  </div>

                  {/* Hint */}
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    L’envoi ouvre WhatsApp avec votre message pré-rempli. Aucun frais, réponse rapide.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900/60">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Support en ligne
                </div>
                <motion.button
                  whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSupportSend}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white
                             bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700
                             focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <Send className="w-4 h-4" />
                  Envoyer via WhatsApp
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
