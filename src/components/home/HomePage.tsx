// src/components/home/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, FileText, Package, BarChart3, Download, Check, Star, ArrowRight, ShieldCheck, Globe, Users,
  Phone, Mail, MapPin, Gift, BadgeCheck, CalendarDays, PlayCircle, ClipboardList, Briefcase, Calculator,
  PenLine, MessageSquare, Bell, FolderKanban, PieChart, Monitor, Megaphone, Grid2x2, Cog
} from 'lucide-react';
import { motion } from 'framer-motion';

type BillingPeriod = 'monthly' | 'annual';

export default function HomePage() {
  const [billingPeriod, setBillingPeriod] = React.useState<BillingPeriod>('monthly');

  const PRICES = { monthly: 299, annual: 3300 } as const;
  const monthlyTotal = 299 * 12;
  const savings = monthlyTotal - PRICES.annual;
  const savingsPct = Math.round((savings / monthlyTotal) * 100);

  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };
  const staggerParent = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/85 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-black-200 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <img
                  src="https://i.ibb.co/kgVKRM9z/20250915-1327-Conception-Logo-Color-remix-01k56ne0szey2vndspbkzvezyp-1.png"
                  alt="Facturati Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Facturati</h1>
                <p className="text-xs text-gray-500">ERP Morocco</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#accueil" className="text-gray-800 hover:text-teal-600 font-medium">Accueil</a>
              <a href="#secteurs" className="text-gray-800 hover:text-teal-600 font-medium">Secteurs</a>
              <a href="#modules" className="text-gray-800 hover:text-teal-600 font-medium">Modules</a>
              <a href="#tarifs" className="text-gray-800 hover:text-teal-600 font-medium">Tarifs</a>
              <a href="#faq" className="text-gray-800 hover:text-teal-600 font-medium">FAQ</a>
              <Link to="/login" className="text-gray-800 hover:text-teal-600 font-medium">Connexion</Link>
            </nav>

            <Link
              to="/login"
              className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Essai 1 mois gratuit
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-teal-300/30 to-blue-300/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-gradient-to-tr from-amber-300/30 to-red-300/30 blur-3xl" />

        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
            <p className="text-sm sm:text-base font-semibold">
              🎁 Vous avez <span className="underline decoration-white/60">1 mois d’essai gratuit</span> — Sans carte bancaire — Annulation à tout moment
            </p>
            <Link to="/login" className="hidden sm:inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md text-sm font-semibold transition">
              Commencer maintenant <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ... sections Hero / Secteurs / Modules / Témoignages / FAQ inchangés ... */}

        {/* Tarifs */}
        <section id="tarifs" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerParent} className="text-center mb-6">
              <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Tarifs simples & transparents</motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-gray-600">Commencez gratuitement — <strong>1er mois offert</strong></motion.p>
            </motion.div>

            {/* Toggle période */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  aria-pressed={billingPeriod === 'monthly'}
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    billingPeriod === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  aria-pressed={billingPeriod === 'annual'}
                  onClick={() => setBillingPeriod('annual')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    billingPeriod === 'annual' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Annuel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Gratuit (inchangé) */}
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Gratuit</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-1">0 MAD</div>
                  <p className="text-gray-600">Pour démarrer</p>
                </div>
                <ul className="space-y-3 mb-8 text-gray-800">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-600" /> 10 factures</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-600" /> 10 devis</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-600" /> 10 fournisseurs</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-600" /> 10 clients</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-600" /> 20 produits</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-600" /> 1 utilisateur</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-600" /> 1 template facture & devis</li>
                </ul>
                <Link to="/login" className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 rounded-lg font-semibold text-center block transition">
                  Commencer gratuitement
                </Link>
              </motion.div>

              {/* Pro (dynamique) */}
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="relative bg-gradient-to-br from-teal-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">1er mois gratuit</span>
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-1">Pro</h3>
                  <div className="text-4xl font-bold mb-1">
                    {billingPeriod === 'monthly' ? `${PRICES.monthly} MAD` : `${PRICES.annual} MAD`}
                  </div>
                  <p className="opacity-90">
                    {billingPeriod === 'monthly' ? 'par mois' : 'par an'}
                  </p>
                  {billingPeriod === 'annual' && (
                    <p className="mt-2 text-sm text-yellow-100">
                      🎉 Économisez {savings} MAD/an (~{savingsPct}%)
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Factures illimitées', 'Devis illimités', 'Fournisseurs illimités', 'Clients illimités',
                    'Produits illimités', '6 utilisateurs', '5 templates', 'Signature électronique',
                    'Gestion fournisseur', 'Gestion stock', 'Gestion projet', 'Gestion financière', 'Gestion humaine'
                  ].map((txt, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-yellow-300" /> {txt}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="w-full bg-white text-teal-600 hover:bg-gray-100 py-3 px-6 rounded-lg font-semibold text-center block transition">
                  Démarrer l’essai Pro (1 mois)
                </Link>
                <p className="mt-3 text-center text-white/90 text-sm">Sans carte bancaire • Annulable à tout moment</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ... autres sections inchangées ... */}
      </main>

      <footer id="contact" className="bg-gray-900 text-white py-16 mt-auto">
        {/* ... footer inchangé ... */}
      </footer>
    </div>
  );
}


// src/components/license/UpgradePage.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLicense } from '../../contexts/LicenseContext';
import PaymentModal from './PaymentModal';
import { 
  Crown, Check, X, Infinity, FileText, Users, Package, BarChart3,
  Shield, Headphones, Zap
} from 'lucide-react';

type BillingPeriod = 'monthly' | 'annual';

interface UpgradePageProps {
  onClose: () => void;
  isRenewal?: boolean;
}

export default function UpgradePage({ onClose, isRenewal = false }: UpgradePageProps) {
  const { limits, getRemainingCount } = useLicense();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  const PRICES = { monthly: 299, annual: 3300 } as const;

  const handleUpgrade = () => setShowPaymentModal(true);

  const freeFeatures = [
    { icon: FileText, label: 'Factures', limit: limits.invoices, remaining: getRemainingCount('invoices') },
    { icon: Users, label: 'Clients', limit: limits.clients, remaining: getRemainingCount('clients') },
    { icon: Package, label: 'Produits', limit: limits.products, remaining: getRemainingCount('products') },
    { icon: FileText, label: 'Devis', limit: limits.quotes, remaining: getRemainingCount('quotes') }
  ];

  const proFeatures = [
    { icon: Infinity, label: 'Factures illimitées', description: 'Créez autant de factures que nécessaire' },
    { icon: Users, label: 'Clients illimités', description: 'Gérez tous vos clients sans restriction' },
    { icon: Package, label: 'Produits illimités', description: 'Catalogue produits sans limite' },
    { icon: FileText, label: 'Devis illimités', description: 'Propositions commerciales sans restriction' },
    { icon: BarChart3, label: 'Rapports avancés', description: 'Analyses détaillées de vos performances' },
    { icon: Shield, label: 'Sauvegarde automatique', description: 'Vos données protégées en permanence' },
    { icon: Headphones, label: 'Support prioritaire', description: 'Assistance dédiée et rapide' },
    { icon: Zap, label: 'Nouvelles fonctionnalités', description: 'Accès anticipé aux nouveautés' }
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
          <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Passez à la version Pro</h2>
                    <p className="opacity-90">Débloquez tout le potentiel de Facture.ma</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Current Limits */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vos limites actuelles (Version Gratuite)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {freeFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    const isLimitReached = feature.remaining === 0;
                    return (
                      <div key={index} className={`p-4 rounded-lg border-2 ${isLimitReached ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon className={`w-5 h-5 ${isLimitReached ? 'text-red-600' : 'text-gray-600'}`} />
                          <span className="font-medium text-gray-900">{feature.label}</span>
                        </div>
                        <p className={`text-sm ${isLimitReached ? 'text-red-600' : 'text-gray-600'}`}>
                          {feature.remaining} restant(s) / {feature.limit}
                        </p>
                        {isLimitReached && <p className="text-xs text-red-600 font-medium mt-1">Limite atteinte !</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pro Features */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ce que vous obtenez avec la version Pro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg border border-teal-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{feature.label}</h4>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Toggle période */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    aria-pressed={billingPeriod === 'monthly'}
                    onClick={() => setBillingPeriod('monthly')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${billingPeriod === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Mensuel
                  </button>
                  <button
                    type="button"
                    aria-pressed={billingPeriod === 'annual'}
                    onClick={() => setBillingPeriod('annual')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${billingPeriod === 'annual' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Annuel
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 mb-8 border border-teal-200">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Crown className="w-8 h-8 text-teal-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Version Pro</h3>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-teal-600">
                      {billingPeriod === 'monthly' ? `${PRICES.monthly} MAD` : `${PRICES.annual} MAD`}
                    </span>
                    <span className="text-gray-600 ml-2">/ {billingPeriod === 'monthly' ? 'mois' : 'an'}</span>
                  </div>
                  <p className="text-gray-600 mb-6">Tout illimité + support prioritaire</p>
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mb-6">
                    <div className="flex items-center space-x-1"><Check className="w-4 h-4 text-green-500" /><span>Factures illimitées</span></div>
                    <div className="flex items-center space-x-1"><Check className="w-4 h-4 text-green-500" /><span>Support 24/7</span></div>
                    <div className="flex items-center space-x-1"><Check className="w-4 h-4 text-green-500" /><span>Rapports avancés</span></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  {isRenewal ? 'Fermer' : 'Peut-être plus tard'}
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Traitement...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <Crown className="w-5 h-5" />
                      <span>
                        Payer maintenant - {billingPeriod === 'monthly' ? `${PRICES.monthly} MAD/mois` : `${PRICES.annual} MAD/an`}
                      </span>
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">🛡️ Garantie satisfait ou remboursé 30 jours • 🇲🇦 Paiement sécurisé au Maroc</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onComplete={() => { setShowPaymentModal(false); onClose(); }}
          isRenewal={isRenewal}
          billingPeriod={billingPeriod}
        />
      )}
    </>
  );
}
