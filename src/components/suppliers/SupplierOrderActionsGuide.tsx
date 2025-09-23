// src/components/suppliers/SupplierOrderActionsGuide.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  X,
  Eye,
  Edit,
  Trash2,
  Plus,
  HelpCircle,
  Lightbulb,
  Target,
  TrendingUp,
  CheckCircle,
  FileText,
  DollarSign,
  Calendar,
  Building2,
} from 'lucide-react';

export default function SupplierOrderActionsGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Actions réellement disponibles dans la section "Fournisseurs"
  const actions = [
    {
      id: 'create',
      icon: Plus,
      title: 'Nouveau Fournisseur',
      description:
        'Ajoutez un fournisseur avec ses informations (ICE, contact, email, téléphone, adresse).',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-700',
      features: [
        'Nom du fournisseur et ICE',
        'Contact (téléphone, email, adresse)',
        'Statut par défaut : Actif',
        'Création rapide depuis le bouton en haut à droite',
      ],
    },
    {
      id: 'view',
      icon: Eye,
      title: 'Voir la fiche fournisseur',
      description:
        'Accédez à la vue détaillée du fournisseur (commandes, paiements, balance).',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      features: [
        'Informations générales',
        'Historique des commandes d’achat',
        'Historique des paiements',
        'Balance calculée automatiquement',
        'Accès rapide depuis l’icône 👁️ sur la carte',
      ],
    },
    {
      id: 'edit',
      icon: Edit,
      title: 'Modifier fournisseur',
      description:
        'Mettez à jour le nom, l’ICE ou les coordonnées du fournisseur.',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-700',
      features: [
        'Modification des champs (nom, ICE, contact)',
        'Validation et sauvegarde immédiate',
        'Accès via l’icône ✏️ sur la carte',
      ],
    },
    {
      id: 'delete',
      icon: Trash2,
      title: 'Supprimer fournisseur',
      description:
        'Supprimez un fournisseur après confirmation. Historique conservé selon votre logique métier.',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700',
      features: [
        'Demande de confirmation',
        'Action irréversible',
        'Vérifiez les impacts sur vos données liées',
        'Accès via l’icône 🗑️ sur la carte',
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  return (
    <>
      {/* Fab d’aide */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          variants={pulseVariants}
          animate="pulse"
          title="Guide des actions — Fournisseurs"
        >
          <HelpCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
        </motion.button>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
              <motion.div
                className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
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
                        <h2 className="text-2xl font-bold">🏢 Guide — Fournisseurs</h2>
                        <p className="text-sm opacity-90">
                          Comprenez les actions disponibles sur la liste des fournisseurs
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
                  {/* Intro */}
                  <motion.div className="text-center mb-8" variants={itemVariants}>
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Section “Fournisseurs”
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Sur chaque carte fournisseur, vous trouverez les icônes 👁️ (voir),
                      ✏️ (modifier) et 🗑️ (supprimer), ainsi que le bouton
                      “Nouveau Fournisseur” en haut de la page.
                    </p>
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
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
                          onClick={() => setActiveAction(isActive ? null : action.id)}
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
                                        <span>Fonctionnalités :</span>
                                      </h5>
                                      <ul className="space-y-2">
                                        {action.features.map((f, i) => (
                                          <motion.li
                                            key={i}
                                            className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                          >
                                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span>{f}</span>
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

                  {/* Workflow */}
                  <motion.div
                    className="mt-8 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-700"
                    variants={itemVariants}
                  >
                    <h4 className="font-bold text-teal-900 dark:text-teal-100 mb-4 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>🔄 Workflow recommandé</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <Step index={1} title="Créer" subtitle="Nouveau fournisseur" />
                      <Step index={2} title="Mettre à jour" subtitle="Coordonnées & ICE" />
                      <Step index={3} title="Voir la fiche" subtitle="Commandes & Paiements" />
                      <Step index={4} title="Suivre la balance" subtitle="Commandes - Paiements" />
                      <Step index={5} title="Archiver/Supprimer" subtitle="Si nécessaire" />
                    </div>
                  </motion.div>

                  {/* Fiche détaillée */}
                  <motion.div
                    className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-700"
                    variants={itemVariants}
                  >
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>👁️ Fiche fournisseur (vue détaillée)</span>
                    </h4>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-indigo-200 dark:border-indigo-600">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 text-center">
                        En cliquant sur l’icône 👁️, vous accédez à une vue avec :
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoCard color="blue" title="Commandes" desc="Historique des commandes d’achat" />
                        <InfoCard color="green" title="Paiements" desc="Tous les paiements enregistrés" />
                        <InfoCard color="purple" title="Balance" desc="Total commandes - total paiements" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Finance */}
                  <motion.div
                    className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700"
                    variants={itemVariants}
                  >
                    <h4 className="font-bold text-green-900 dark:text-green-100 mb-4 flex items-center space-x-2">
                      <DollarSign className="w-5 h-5" />
                      <span>💰 Suivi financier</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Bullet title="Balance fournisseur" text="Calcul automatique : Commandes - Paiements" />
                      <Bullet title="Historique" text="Traçabilité des opérations (commandes/paiements)" />
                      <Bullet title="Échéances" text="Suivi des délais avec la date de paiement" icon={<Calendar className="w-5 h-5 text-green-600" />} />
                    </div>
                  </motion.div>

                  {/* Note */}
                  <motion.div
                    className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700"
                    variants={itemVariants}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Info className="w-6 h-6 text-blue-600" />
                      <h4 className="font-bold text-blue-900 dark:text-blue-100">ℹ️ Info</h4>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                      <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                        Les cartes affichent le nombre de commandes, le total des achats et le montant à payer.
                        Les icônes en haut de chaque carte permettent d’ouvrir la fiche, modifier ou supprimer le fournisseur.
                      </p>
                    </div>
                  </motion.div>

                  {/* Fermer */}
                  <motion.div className="text-center mt-8" variants={itemVariants}>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>OK, compris</span>
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

/* ----- Petites sous-compos utilitaires (claires, réutilisables) ----- */
function Step({ index, title, subtitle }: { index: number; title: string; subtitle: string }) {
  return (
    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-teal-200 dark:border-teal-600">
      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
        <span className="text-white font-bold">{index}</span>
      </div>
      <p className="text-sm font-medium text-teal-800 dark:text-teal-200">{title}</p>
      <p className="text-xs text-teal-600 dark:text-teal-300">{subtitle}</p>
    </div>
  );
}

function InfoCard({ color, title, desc }: { color: 'blue' | 'green' | 'purple'; title: string; desc: string }) {
  const map = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200',
  } as const;
  return (
    <div className={`text-center p-4 rounded-lg border ${map[color]}`}>
      <h6 className="font-medium">{title}</h6>
      <p className="text-xs">{desc}</p>
    </div>
  );
}

function Bullet({ title, text, icon }: { title: string; text: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        {icon ?? <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
        <div>
          <p className="font-medium text-green-900 dark:text-green-100">{title}</p>
          <p className="text-sm text-green-800 dark:text-green-200">{text}</p>
        </div>
      </div>
    </div>
  );
}
