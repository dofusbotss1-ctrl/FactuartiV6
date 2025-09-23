// =========================================
// src/components/auth/WelcomeProModal.tsx
// =========================================
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, CheckCircle, X } from 'lucide-react';

type WelcomeProModalProps = {
  isOpen: boolean;
  onClose: () => void;
  expiryDate?: string | null;
};

export default function WelcomeProModal({ isOpen, onClose, expiryDate }: WelcomeProModalProps) {
  if (!isOpen) return null;

  const expiryLabel = expiryDate
    ? new Date(expiryDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <AnimatePresence>
      <motion.div
        key="welcome-overlay"
        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      />
      <motion.div
        key="welcome-modal"
        className="fixed inset-0 z-[71] grid place-items-center px-4"
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      >
        <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-emerald-200/70 dark:border-emerald-800/40 bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <motion.div
                className="w-32 h-32 rounded-full bg-white/20 absolute -top-8 -left-8"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-7 h-7" />
                <h3 className="text-xl font-bold">Bienvenue en Pro 🎉</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <p className="text-gray-800 dark:text-gray-100 font-medium">
                Félicitations ! Votre compte a un <span className="text-emerald-600 dark:text-emerald-400">mois gratuit</span> en version Pro.
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {expiryLabel
                ? <>Votre période d’essai Pro se termine le <b>{expiryLabel}</b>.</>
                : <>Votre période d’essai Pro vient de commencer.</>}
            </p>

            <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Facturation & devis illimités</li>
              <li>• Tableaux de bord avancés</li>
              <li>• Support prioritaire</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/60 flex justify-end">
            <motion.button
              whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              Commencer
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
