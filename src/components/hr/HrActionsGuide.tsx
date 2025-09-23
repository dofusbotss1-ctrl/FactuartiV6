// src/components/hr/HrActionsGuide.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  X,
  Users,
  UserPlus,
  Edit,
  Trash2,
  Timer,
  Calendar,
  FileDown,
  Filter,
  BarChart2,
  DollarSign,
  Info,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

export default function HrActionsGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  type Action = {
    id: string;
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    features: string[];
  };

  // 🔹 Uniquement les actions visibles dans ta section RH
  const actions: Action[] = [
    {
      id: "dashboard",
      icon: BarChart2,
      title: "Dashboard RH",
      description:
        "Vue d’ensemble: employés, heures sup. du mois, coût total (MAD) et jours de congés restants.",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      borderColor: "border-cyan-200 dark:border-cyan-700",
      features: [
        "Employés Total",
        "Heures Supplémentaires (mois)",
        "Coût total = Salaires de base + Heures sup.",
        "Jours de congés alloués / pris / restants",
      ],
    },
    {
      id: "export",
      icon: FileDown,
      title: "Export PDF",
      description: "Bouton en haut à droite pour exporter les tableaux en PDF.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      borderColor: "border-indigo-200 dark:border-indigo-700",
      features: ["Export du tableau filtré", "Mise en page A4 optimisée", "Idéal pour archivage et partage"],
    },
    {
      id: "filter",
      icon: Filter,
      title: "Filtrer par employé",
      description:
        "Menu déroulant pour n’afficher que les données d’un employé (dashboard, listes, totaux).",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-700",
      features: ["Filtrage instantané", "S’applique au Dashboard et aux listes", "Garde l’export PDF cohérent"],
    },

    // Personnel
    {
      id: "add-employee",
      icon: UserPlus,
      title: "Nouveau Employé",
      description:
        "Depuis l’onglet Personnel : bouton « + Nouvel Employé ».",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-200 dark:border-emerald-700",
      features: [
        "Nom, poste, email, téléphone",
        "Salaire de base",
        "Jours de congés annuels alloués",
      ],
    },
    {
      id: "edit-employee",
      icon: Edit,
      title: "Modifier Employé",
      description:
        "Icône ✏️ dans la colonne Actions (onglet Personnel).",
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-200 dark:border-amber-700",
      features: ["Changer poste/salaire", "Mettre à jour email/téléphone", "Ajuster congés alloués"],
    },
    {
      id: "delete-employee",
      icon: Trash2,
      title: "Supprimer Employé",
      description:
        "Icône 🗑️ dans la colonne Actions (onglet Personnel).",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-700",
      features: ["Suppression sécurisée (confirmation)", "Retire l’employé des listes et du filtre"],
    },

    // Heures Supplémentaires
    {
      id: "add-ot",
      icon: Timer,
      title: "Ajouter Heures Sup.",
      description:
        "Dans l’onglet Heures Sup. → bouton « + Ajouter Heures Sup. ».",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-700",
      features: [
        "Date, nombre d’heures",
        "Taux horaire (MAD/h)",
        "Total auto (heures × taux)",
        "Impacte le coût mensuel",
      ],
    },
    {
      id: "delete-ot",
      icon: Trash2,
      title: "Supprimer Heures Sup.",
      description:
        "Icône 🗑️ sur la ligne (onglet Heures Sup.).",
      color: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-900/20",
      borderColor: "border-rose-200 dark:border-rose-700",
      features: ["Retire la ligne d’OT", "Met à jour le total du mois", "Nettoyage simple et rapide"],
    },

    // Congés
    {
      id: "new-leave",
      icon: Calendar,
      title: "Nouveau Congé",
      description:
        "Dans l’onglet Congés → bouton « + Nouveau Congé ».",
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
      borderColor: "border-teal-200 dark:border-teal-700",
      features: [
        "Choisir l’employé et le type",
        "Période & durée",
        "Le Dashboard calcule jours pris/restants",
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.25, staggerChildren: 0.08 },
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  };

  const pulse = {
    pulse: {
      scale: [1, 1.06, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <>
      {/* Bouton d’aide flottant */}
      <motion.div className="fixed bottom-6 right-6 z-40" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
        <motion.button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white flex items-center justify-center"
          title="Guide Gestion Humaine"
          variants={pulse}
          animate="pulse"
        >
          <HelpCircle className="w-6 h-6" />
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                className="inline-block w-full max-w-5xl overflow-hidden align-middle transition-all transform bg-white dark:bg-gray-800 rounded-2xl shadow-2xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Users className="w-6 h-6" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold">👥 Guide — Gestion Humaine</h2>
                        <p className="text-sm opacity-90">
                          Comprendre et maîtriser Personnel, Heures Sup. et Congés
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-white/20">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                  {/* Intro */}
                  <motion.div className="text-center" variants={itemVariants}>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                      <Lightbulb className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Vos outils RH au même endroit
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Suivez vos employés, saisissez les heures supplémentaires, gérez les congés et exportez vos
                      tableaux en PDF. Tout est pensé pour des calculs automatiques et une lecture rapide.
                    </p>
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={itemVariants}
                  >
                    {actions.map((a) => {
                      const Icon = a.icon;
                      const open = activeId === a.id;
                      return (
                        <motion.div
                          key={a.id}
                          className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                            open
                              ? `${a.borderColor} ${a.bgColor} shadow-lg scale-[1.02]`
                              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md"
                          }`}
                          onClick={() => setActiveId(open ? null : a.id)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${a.bgColor}`}>
                              <Icon className={`w-6 h-6 ${a.color}`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                {a.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{a.description}</p>

                              <AnimatePresence>
                                {open && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        <span>Fonctionnalités :</span>
                                      </h5>
                                      <ul className="space-y-2">
                                        {a.features.map((f, i) => (
                                          <motion.li
                                            key={i}
                                            className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300"
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                          >
                                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
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

                  {/* Calculs & Rappels */}
                  <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    variants={itemVariants}
                  >
                    <div className="rounded-xl p-6 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border border-teal-200 dark:border-teal-700">
                      <h4 className="font-bold text-teal-900 dark:text-teal-100 mb-3 flex items-center space-x-2">
                        <DollarSign className="w-5 h-5" />
                        <span>Formules de calcul</span>
                      </h4>
                      <ul className="text-sm text-teal-800 dark:text-teal-200 space-y-2">
                        <li>
                          <strong>Coût total mensuel</strong> = Salaires de base + Total Heures Sup. (mois)
                        </li>
                        <li>
                          <strong>Total Heures Sup.</strong> = somme (heures × taux) pour le mois
                        </li>
                        <li>
                          <strong>Congés restants</strong> = Jours alloués - Jours pris
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-xl p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700">
                      <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-3 flex items-center space-x-2">
                        <Info className="w-5 h-5" />
                        <span>Bonnes pratiques</span>
                      </h4>
                      <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                        <li>Crée d’abord l’employé dans <strong>Personnel</strong>.</li>
                        <li>Saisis les <strong>Heures Sup.</strong> au fil du mois pour garder le coût à jour.</li>
                        <li>Ajoute les <strong>Congés</strong> pour que les compteurs restent corrects.</li>
                        <li>Utilise le <strong>Filtre par employé</strong> avant l’<strong>Export PDF</strong> si besoin.</li>
                      </ul>
                    </div>
                  </motion.div>

                  {/* Bouton fermer */}
                  <motion.div className="text-center" variants={itemVariants}>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-8 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
                    >
                      J’ai compris 👍
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
