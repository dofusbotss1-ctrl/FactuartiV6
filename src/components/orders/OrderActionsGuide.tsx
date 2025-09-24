// src/components/orders/OrderActionsGuide.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  X,
  Filter,
  FileText,
  Edit,
  Trash2,
  HelpCircle,
  Lightbulb,
  Target,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Truck,
  Calendar,
  DollarSign,
  Eye,
} from 'lucide-react';

export default function OrderActionsGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const actions = [
    {
      id: 'status',
      icon: Filter,
      title: 'Changer le Statut',
      description:
        "Modifiez le statut de la commande et gérez automatiquement l'impact sur le stock",
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700',
      features: [
        'En cours de livraison (stock débité)',
        'Livré (stock débité, commande terminée)',
        'Annulé (stock ré-injecté automatiquement)',
        'Gestion automatique du stock selon le statut',
        'Traçabilité complète des changements',
      ],
    },
    {
      id: 'details',
      icon: FileText,
      title: 'Voir Détails',
      description:
        'Consultez tous les détails de la commande avec bon de livraison',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      features: [
        'Informations complètes de la commande',
        'Détails client (société ou particulier)',
        'Liste des articles avec quantités',
        'Calculs de totaux HT et TTC',
        'Dates de commande et livraison',
      ],
    },
    // 🔁 Remplacement de "print / Bon de livraison" par "createInvoice / Créer facture"
    {
      id: 'createInvoice',
      icon: DollarSign,
      title: 'Créer Facture',
      description:
        'Générez la facture à partir de la commande (société uniquement, non annulée)',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700',
      features: [
        'Préremplissage automatique du client',
        'Articles, quantités et prix repris de la commande',
        'Calcul automatique HT / TVA / TTC',
        'Empêche la doublure si une facture existe déjà',
        'Affiche une confirmation animée de création',
      ],
    },
    {
      id: 'edit',
      icon: Edit,
      title: 'Modifier Commande',
      description:
        'Modifiez les détails de la commande (articles, quantités, client)',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-700',
      features: [
        'Modifier les articles et quantités',
        'Changer le client ou les dates',
        'Ajuster les prix (admin uniquement)',
        'Recalcul automatique des totaux',
        "Attention : n'affecte pas automatiquement le stock",
      ],
    },
    {
      id: 'delete',
      icon: Trash2,
      title: 'Supprimer Commande',
      description:
        'Supprimez définitivement une commande avec gestion du stock',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700',
      features: [
        'Suppression définitive de la commande',
        'Stock automatiquement ré-injecté si débité',
        'Confirmation de sécurité requise',
        'Historique des mouvements conservé',
        'Action irréversible',
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, staggerChildren: 0.1 },
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  return (
    <>
      {/* Bouton d'aide flottant */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          variants={pulseVariants}
          animate="pulse"
          title="Guide des actions commandes"
        >
          <HelpCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
        </motion.button>
      </motion.div>

      {/* Modal d'aide */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
              <motion.div
                className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Lightbulb className="w-6 h-6" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold">🚚 Guide des Actions Commandes</h2>
                        <p className="text-sm opacity-90">
                          Maîtrisez la gestion de vos commandes et bons de livraison
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-8">
                  {/* Introduction */}
                  <motion.div className="text-center mb-8" variants={itemVariants}>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Gérez vos Commandes Efficacement
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Chaque commande dispose de 5 actions principales avec gestion
                      automatique du stock. Cliquez sur une action pour découvrir ses
                      fonctionnalités.
                    </p>
                  </motion.div>

                  {/* Actions Grid */}
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={itemVariants}
                  >
                    {actions.map((action) => {
                      const Icon = action.icon;
                      const isActive = activeAction === action.id;

                      return (
                        <motion.div
                          key={action.id}
                          className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                            isActive
                              ? `${action.borderColor} ${action.bgColor} shadow-lg scale-105`
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                          }`}
                          onClick={() =>
                            setActiveAction(isActive ? null : action.id)
                          }
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start space-x-4">
                            <motion.div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                isActive ? 'bg-white shadow-md' : action.bgColor
                              }`}
                              whileHover={{ rotate: 5 }}
                            >
                              <Icon className={`w-6 h-6 ${action.color}`} />
                            </motion.div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                {action.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                {action.description}
                              </p>

                              <AnimatePresence>
                                {isActive && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
                                        <Target className="w-4 h-4 text-green-600" />
                                        <span>Fonctionnalités incluses :</span>
                                      </h5>
                                      <ul className="space-y-2">
                                        {action.features.map((feature, index) => (
                                          <motion.li
                                            key={index}
                                            className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                          >
                                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                          </motion.li>
                                        ))}
                                      </ul>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Workflow Section */}
                  <motion.div
                    className="mt-8 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-700"
                    variants={itemVariants}
                  >
                    <h4 className="font-bold text-teal-900 dark:text-teal-100 mb-4 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>🔄 Workflow Recommandé</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-teal-200 dark:border-teal-600">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">1</span>
                        </div>
                        <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                          Créer la commande
                        </p>
                        <p className="text-xs text-teal-600 dark:text-teal-300">
                          Avec client et produits
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-teal-200 dark:border-teal-600">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">2</span>
                        </div>
                        <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                          Gérer le statut
                        </p>
                        <p className="text-xs text-teal-600 dark:text-teal-300">
                          Stock auto-géré
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-teal-200 dark:border-teal-600">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">3</span>
                        </div>
                        <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                          Créer la facture
                        </p>
                        <p className="text-xs text-teal-600 dark:text-teal-300">
                          Depuis la commande
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-teal-200 dark:border-teal-600">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">4</span>
                        </div>
                        <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                          Marquer livré
                        </p>
                        <p className="text-xs text-teal-600 dark:text-teal-300">
                          Finaliser
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Types de clients */}
                  <motion.div
                    className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-700"
                    variants={itemVariants}
                  >
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center space-x-2">
                      <Eye className="w-5 h-5" />
                      <span>👥 Types de Clients Supportés</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-200 dark:border-indigo-600">
                        <div className="flex items-center space-x-3 mb-3">
                          <Package className="w-6 h-6 text-blue-600" />
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                            Sociétés
                          </h5>
                        </div>
                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          <li>• Clients existants de votre base</li>
                          <li>• Informations complètes (ICE, adresse)</li>
                          <li>• TVA automatiquement appliquée</li>
                          <li>• Historique des commandes</li>
                        </ul>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-200 dark:border-indigo-600">
                        <div className="flex items-center space-x-3 mb-3">
                          <Eye className="w-6 h-6 text-green-600" />
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                            Particuliers
                          </h5>
                        </div>
                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          <li>• Saisie manuelle du nom</li>
                          <li>• TVA optionnelle</li>
                          <li>• Idéal pour ventes directes</li>
                          <li>• Bon de livraison simplifié</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>

                  {/* Gestion du stock */}
                  <motion.div
                    className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-700"
                    variants={itemVariants}
                  >
                    <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-4 flex items-center space-x-2">
                      <Truck className="w-5 h-5" />
                      <span>📦 Gestion Automatique du Stock</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-900 dark:text-amber-100">
                              Livraison Immédiate
                            </p>
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              Sans date de livraison → Statut "Livré" → Stock débité
                              immédiatement
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <Truck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-900 dark:text-amber-100">
                              Livraison Planifiée
                            </p>
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              Date future → "En cours" → Stock débité à la création
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-900 dark:text-amber-100">
                              Annulation
                            </p>
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              Statut "Annulé" → Stock automatiquement ré-injecté
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Important Note */}
                  <motion.div
                    className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700"
                    variants={itemVariants}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Info className="w-6 h-6 text-green-600" />
                      <h4 className="font-bold text-green-900 dark:text-green-100">
                        ℹ️ Information Importante
                      </h4>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-600">
                      <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                        <strong>🔗 Nouvelle Logique de Stock :</strong> Les
                        commandes gèrent maintenant le stock automatiquement. Le
                        stock est débité quand une commande est "en cours" ou
                        "livrée", et ré-injecté si elle est "annulée". Les
                        factures ne gèrent plus le stock – elles servent
                        uniquement pour la facturation et la comptabilité.
                      </p>
                    </div>
                  </motion.div>

                  {/* Conseils d'utilisation */}
                  <motion.div
                    className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700"
                    variants={itemVariants}
                  >
                    <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center space-x-2">
                      <Lightbulb className="w-5 h-5" />
                      <span>💡 Conseils d'Utilisation</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <DollarSign className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-purple-900 dark:text-purple-100">
                              Créer la facture
                            </p>
                            <p className="text-sm text-purple-800 dark:text-purple-200">
                              Depuis la commande (société & non annulée). Le
                              système évite les doublons si une facture existe déjà.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-purple-900 dark:text-purple-100">
                              Planification
                            </p>
                            <p className="text-sm text-purple-800 dark:text-purple-200">
                              Utilisez les dates de livraison pour organiser vos
                              tournées.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <DollarSign className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-purple-900 dark:text-purple-100">
                              TVA Flexible
                            </p>
                            <p className="text-sm text-purple-800 dark:text-purple-200">
                              Pour les particuliers, la TVA est optionnelle selon
                              vos besoins.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Package className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-purple-900 dark:text-purple-100">
                              Suivi Stock
                            </p>
                            <p className="text-sm text-purple-800 dark:text-purple-200">
                              Consultez la section "Produits" pour voir l'impact sur
                              votre stock.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Bouton de fermeture */}
                  <motion.div className="text-center mt-8" variants={itemVariants}>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Parfait, j'ai compris !</span>
                      </span>
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
