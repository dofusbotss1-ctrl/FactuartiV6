import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, X, Lightbulb, Eye, Edit, Trash2, Plus,
  Download, Printer, CheckCircle, Target, FileText,
  Send, BadgeCheck, Ban, Hourglass, ArrowRightCircle, Calendar
} from 'lucide-react';

export default function QuoteActionsGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const actions = [
    {
      id: 'create',
      icon: Plus,
      title: 'Créer un devis',
      description: 'Démarrez un nouveau devis : client, articles, TVA, validité.',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-700',
      features: [
        'Numérotation automatique',
        'Lignes d’articles & taux de TVA',
        'Total HT / TVA / TTC',
        'Période de validité'
      ]
    },
    {
      id: 'view',
      icon: Eye,
      title: 'Voir / Prévisualiser',
      description: 'Ouvrez le devis avec choix du template et export PDF/Impression.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      features: [
        'Jusqu’à 5 templates A4',
        'Téléchargement PDF',
        'Impression navigateur',
        'Entête & pied fixes multi-pages'
      ]
    },
    {
      id: 'status',
      icon: BadgeCheck,
      title: 'Gérer le Statut',
      description: 'Mettez à jour le statut du devis selon l’avancement.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700',
      features: [
        'Brouillon',
        'Envoyé',
        'Accepté',
        'Rejeté',
        'Expiré (selon validité)'
      ]
    },
    {
      id: 'convert',
      icon: ArrowRightCircle,
      title: 'Convertir en Facture',
      description: 'Générez une facture à partir d’un devis accepté.',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-700',
      features: [
        'Reprend client & lignes',
        'Calculs recopiés (HT/TVA/TTC)',
        'Numérotation facture automatique',
        'Lien devis ↔ facture'
      ]
    },
    {
      id: 'edit',
      icon: Edit,
      title: 'Modifier',
      description: 'Mettez à jour client, lignes, prix, TVA, validité.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-700',
      features: [
        'Edition des articles',
        'Recalcul automatique',
        'Sauvegarde immédiate',
        'Historique cohérent'
      ]
    },
    {
      id: 'delete',
      icon: Trash2,
      title: 'Supprimer',
      description: 'Supprimez le devis après confirmation (action irréversible).',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700',
      features: [
        'Demande de confirmation',
        'Nettoyage cohérent',
        'Aucun impact sur le stock',
        'À utiliser avec prudence'
      ]
    }
  ];

  const container = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, staggerChildren: 0.1 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
  const pulse = { pulse: { scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } } };

  return (
    <>
      {/* Bouton d’aide flottant */}
      <motion.div className="fixed bottom-6 right-6 z-40" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <motion.button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-full shadow-lg flex items-center justify-center"
          title="Guide — Devis"
          variants={pulse}
          animate="pulse"
        >
          <HelpCircle className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-10">
              <motion.div
                className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
                variants={container}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-8 py-6 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">📄 Guide des actions — Devis</h2>
                      <p className="text-sm opacity-90">Comprenez toutes les actions possibles sur vos devis</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/20 rounded-lg" onClick={() => setIsOpen(false)}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Actions */}
                <div className="p-8">
                  <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={item}>
                    {actions.map(a => {
                      const Icon = a.icon;
                      const active = activeAction === a.id;
                      return (
                        <motion.div
                          key={a.id}
                          className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                            active ? `${a.borderColor} ${a.bgColor} shadow-lg scale-[1.02]` :
                            'border-gray-200 dark:border-gray-600 hover:shadow-md'
                          }`}
                          onClick={() => setActiveAction(active ? null : a.id)}
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${a.bgColor}`}>
                              <Icon className={`w-6 h-6 ${a.color}`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{a.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{a.description}</p>
                              <AnimatePresence>
                                {active && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
                                        <Target className="w-4 h-4 text-green-600" />
                                        <span>Fonctionnalités :</span>
                                      </h5>
                                      <ul className="space-y-2">
                                        {a.features.map((f, i) => (
                                          <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-sm text-gray-700 dark:text-gray-300 flex items-start space-x-2"
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

                  {/* Infos / Conseils */}
                  <motion.div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6" variants={item}>
                    <InfoCard
                      title="Validité & Expiration"
                      text="Définissez une date de validité. Passé ce délai, le devis peut passer au statut « Expiré »."
                      Icon={Hourglass}
                      color="amber"
                    />
                    <InfoCard
                      title="Envoi du devis"
                      text="Status « Envoyé » après transmission au client (email, PDF). Gardez une trace."
                      Icon={Send}
                      color="sky"
                    />
                    <InfoCard
                      title="Conversion rapide"
                      text="Un devis « Accepté » peut être converti en facture en un clic, en copiant toutes les lignes."
                      Icon={ArrowRightCircle}
                      color="indigo"
                    />
                  </motion.div>

                  <div className="text-center mt-8">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg"
                    >
                      <span className="inline-flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Parfait, j’ai compris</span>
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function InfoCard({
  title, text, Icon, color
}: { title: string; text: string; Icon: any; color: 'amber'|'sky'|'indigo' }) {
  const palette: any = {
    amber:  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200',
    sky:    'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700 text-sky-800 dark:text-sky-200',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200'
  };
  return (
    <div className={`p-6 border rounded-xl ${palette[color]}`}>
      <div className="w-10 h-10 rounded-lg bg-white/60 dark:bg-white/10 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h5 className="font-semibold mb-1">{title}</h5>
      <p className="text-sm">{text}</p>
    </div>
  );
}
