import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, X, Lightbulb, CheckCircle, Target,
  Plus, FolderPlus, ListChecks, KanbanSquare, CalendarDays,
  LayoutDashboard, BarChart3, Users, MessageSquare, Paperclip,
  AlarmClock, TrendingUp, Banknote, Pencil
} from 'lucide-react';

export default function ProjectActionsGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null); // <- état unique

  const actions = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      title: 'Tableau de bord',
      description: 'Vue synthétique de l’activité projets : KPIs, progression, budget, retards, performance équipe.',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      border: 'border-indigo-200 dark:border-indigo-700',
      features: [
        'KPI Projets / Tâches / Terminés / En retard',
        'Progression moyenne (%) avec barre',
        'Budget total et suivi',
        'Projets urgents (deadlines < 7 jours)',
        'Top employés par tâches',
      ],
    },
    {
      id: 'projects',
      icon: FolderPlus,
      title: 'Projets',
      description: 'Créer, consulter, modifier et archiver vos projets.',
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      border: 'border-sky-200 dark:border-sky-700',
      features: [
        'Nouveau Projet (bouton en haut à droite)',
        'Éditer un projet (nom, client, budget, dates, statut)',
        'Suivi du % de progression',
        'Gestion des membres (assignations)',
        'Suppression / Archivage',
      ],
    },
    {
      id: 'kanban',
      icon: KanbanSquare,
      title: 'Kanban',
      description: 'Suivi visuel des tâches par colonnes. Glissez-déposez pour changer d’étape.',
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-700',
      features: [
        'Colonnes (À faire → En cours → Terminé …)',
        'Drag & drop des cartes',
        'Badges: priorité, échéance, assignés',
        'Ouverture rapide d’une tâche',
        'Filtre par projet / statut',
      ],
    },
    {
      id: 'tasks',
      icon: ListChecks,
      title: 'Tâches',
      description: 'Liste complète des tâches avec tri / recherche.',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-700',
      features: [
        'Nouvelle Tâche (bouton en haut à droite)',
        'Assigner à un membre',
        'Priorité, estimation, statut',
        'Commentaires & pièces jointes',
        'Édition / Suppression',
      ],
    },
    {
      id: 'calendar',
      icon: CalendarDays,
      title: 'Calendrier',
      description: 'Planification et vision temporelle des tâches et jalons.',
      color: 'text-fuchsia-600',
      bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
      border: 'border-fuchsia-200 dark:border-fuchsia-700',
      features: [
        'Vue mensuelle / hebdo',
        'Glisser pour déplacer une tâche',
        'Affichage des deadlines (⏰)',
        'Filtre par projet / assigné',
        'Création rapide depuis un créneau',
      ],
    },
    {
      id: 'reports',
      icon: BarChart3,
      title: 'Rapports',
      description: 'Analyses et exports pour suivre l’avancement et la charge.',
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
      border: 'border-teal-200 dark:border-teal-700',
      features: [
        'Rapport progression par projet',
        'Temps / tâches par membre',
        'Retards & points bloquants',
        'Budget consommé vs prévu',
        'Export (PDF/CSV) selon la page',
      ],
    },
  ];

  const container = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, staggerChildren: 0.08 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };
  const item = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } } };
  const pulse = { pulse: { scale: [1, 1.06, 1], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } } };

  return (
    <>
      <motion.div className="fixed bottom-6 right-6 z-40" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
        <motion.button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center"
          title="Guide — Gestion de Projet"
          variants={pulse}
          animate="pulse"
        >
          <HelpCircle className="w-6 h-6" />
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center px-4 py-10">
              <motion.div
                className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
                variants={container}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">🚀 Guide — Gestion de Projet</h2>
                      <p className="text-sm opacity-90">Toutes les actions et bonnes pratiques de cette section</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-lg">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <motion.div className="px-8 pt-6 grid grid-cols-1 md:grid-cols-3 gap-4" variants={item}>
                  <QuickAction Icon={Plus} title="Nouvelle Tâche" subtitle="Créer une tâche avec assignation, priorité et deadline" color="from-emerald-500 to-teal-600" />
                  <QuickAction Icon={FolderPlus} title="Nouveau Projet" subtitle="Définir objectifs, budget, dates et membres" color="from-sky-500 to-blue-600" />
                  <QuickAction Icon={Users} title="Équipe & Assignations" subtitle="Assigner les tâches et suivre la charge par membre" color="from-purple-500 to-pink-600" />
                </motion.div>

                <div className="p-8">
                  <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={item}>
                    {actions.map((a) => {
                      const Icon = a.icon;
                      const isActive = active === a.id; // ✅ correct
                      return (
                        <motion.div
                          key={a.id}
                          className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                            isActive ? `${a.border} ${a.bg} shadow-lg scale-[1.02]` : 'border-gray-200 dark:border-gray-600 hover:shadow-md'
                          }`}
                          onClick={() => setActive((prev) => (prev === a.id ? null : a.id))}
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${a.bg}`}>
                              <Icon className={`w-6 h-6 ${a.color}`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{a.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{a.description}</p>

                              <AnimatePresence>
                                {isActive && (
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

                  <motion.div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6" variants={item}>
                    <TipCard Icon={AlarmClock} title="Deadlines & Retards" text="Renseigne des dates d’échéance et surveille la carte « En retard » du dashboard." tone="amber" />
                    <TipCard Icon={TrendingUp} title="Progression réaliste" text="Mets à jour le % d’avancement au fil des tâches terminées." tone="emerald" />
                    <TipCard Icon={Banknote} title="Suivi Budget" text="Compare budget prévu vs consommé via les indicateurs du tableau de bord." tone="teal" />
                  </motion.div>

                  <motion.div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600" variants={item}>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
                      <ListChecks className="w-5 h-5 text-emerald-600" />
                      <span>Bonnes pratiques pour les tâches</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <TaskHint Icon={Users} label="Assignations" text="Assigne clairement chaque tâche à 1+ membres." />
                      <TaskHint Icon={MessageSquare} label="Commentaires" text="Note les faits marquants et décisions." />
                      <TaskHint Icon={Paperclip} label="Pièces jointes" text="Ajoute specs, captures, contrats, etc." />
                      <TaskHint Icon={Pencil} label="Mises à jour" text="Édite priorité/statut dès qu’il change." />
                    </div>
                  </motion.div>

                  <div className="text-center mt-8">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg"
                    >
                      <span className="inline-flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>OK, c’est clair !</span>
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

/* --- petits composants --- */

function QuickAction({ Icon, title, subtitle, color }:{
  Icon: any; title: string; subtitle: string; color: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center space-x-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center bg-gradient-to-r ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="font-semibold text-gray-900 dark:text-gray-100">{title}</div>
        <div className="text-xs text-gray-600 dark:text-gray-300">{subtitle}</div>
      </div>
    </div>
  );
}

function TipCard({ Icon, title, text, tone }:{
  Icon:any; title:string; text:string; tone:'amber'|'emerald'|'teal';
}) {
  const tones:any = {
    amber:   'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100',
    teal:    'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700 text-teal-900 dark:text-teal-100',
  };
  return (
    <div className={`p-6 rounded-xl border ${tones[tone]}`}>
      <div className="w-10 h-10 rounded-lg bg-white/60 dark:bg-white/10 flex items-center justify-center mb-2">
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-sm">{text}</div>
    </div>
  );
}

function TaskHint({ Icon, label, text }:{ Icon:any; label:string; text:string }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center space-x-2 mb-1">
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-300">{text}</div>
    </div>
  );
}
