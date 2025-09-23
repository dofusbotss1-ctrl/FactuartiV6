// src/components/orders/CreateInvoiceFromOrderModal.tsx
import React from 'react';
import { X, FilePlus2, Loader2, Ban } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOrder } from '../../contexts/OrderContext';
import { useData } from '../../contexts/DataContext';
import type { Order } from '../../contexts/DataContext';

type Props = {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated?: (invoiceId: string) => void;
};

const nf2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CreateInvoiceFromOrderModal({ orderId, isOpen, onClose, onInvoiceCreated }: Props) {
  const { getOrderById } = useOrder();
  const { addInvoiceFromOrder } = useData();
  const [submitting, setSubmitting] = React.useState(false);

  const order = (isOpen ? (getOrderById(orderId) as Order | null) : null);
  const isCanceled = !!order && order.status === 'annule';

  // Fermer avec Esc
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleCreate = async () => {
    if (!order) return;
    // Pourquoi: défense en profondeur si le bouton était activé par erreur.
    if (order.status === 'annule') {
      alert('Impossible de créer une facture pour une commande annulée.');
      return;
    }
    setSubmitting(true);
    try {
      const inv = await addInvoiceFromOrder(order);
      onInvoiceCreated?.(inv.id);
      onClose();
    } catch {
      alert('Erreur lors de la création de la facture.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          aria-hidden="true"
        >
          <motion.div
            key="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-invoice-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.6 }}
            className="w-full max-w-2xl rounded-2xl shadow-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 p-6 text-gray-900 dark:text-gray-100"
          >
            <div className="flex items-center justify-between">
              <h3 id="create-invoice-title" className="text-lg font-semibold">
                Créer une facture {order ? `depuis la commande ${order.number}` : ''}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!order ? (
              <p className="mt-4 text-red-600 dark:text-red-400">Commande introuvable.</p>
            ) : (
              <>
                {isCanceled && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 p-3">
                    <Ban className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-700 dark:text-red-300">
                        Cette commande est annulée.
                      </div>
                      <div className="text-sm text-red-700/80 dark:text-red-300/80">
                        La création de facture est désactivée pour les commandes annulées.
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300">Produit</th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300">Qté</th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300">PU HT</th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {order.items.map((it, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                          <td className="px-3 py-2">{it.productName}</td>
                          <td className="px-3 py-2">{it.quantity} {it.unit || ''}</td>
                          <td className="px-3 py-2">{nf2.format(it.unitPrice)} MAD</td>
                          <td className="px-3 py-2 font-semibold">{nf2.format(it.total)} MAD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Client</div>
                    <div className="font-medium">
                      {order.client?.name || order.clientName || 'Client particulier'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Montants</div>
                    <div className="text-sm">Sous-total HT: <b>{nf2.format(order.subtotal)} MAD</b></div>
                    {order.totalVat > 0 && (
                      <div className="text-sm">TVA: <b>{nf2.format(order.totalVat)} MAD</b></div>
                    )}
                    <div className="text-sm">
                      TOTAL TTC: <b className="text-blue-600 dark:text-blue-400">{nf2.format(order.totalTTC)} MAD</b>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Annuler
                  </button>

                  <button
                    onClick={handleCreate}
                    disabled={submitting || isCanceled}
                    title={isCanceled ? 'Commande annulée — création impossible' : undefined}
                    className={[
                      "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                      isCanceled ? "bg-gray-400 dark:bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
                    ].join(' ')}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus2 className="w-4 h-4" />}
                    <span>Créer la facture</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
